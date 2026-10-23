import json
import time
from pathlib import Path

from django.core.management.base import BaseCommand
from openjlpt import get_kanji
import requests

from content.models import Kanji


class Command(BaseCommand):
    help = "Import N3 kanji from OpenJLPT with Indonesian meanings"
    translate_url = "https://translate.googleapis.com/translate_a/single"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show how many N3 kanji would be added without saving them",
        )
        parser.add_argument(
            "--limit",
            type=int,
            help="Process at most this many kanji (useful for a small trial run)",
        )

    def handle(self, *args, **options):
        entries = get_kanji("N3")
        if options["limit"] is not None:
            entries = entries[:options["limit"]]

        data_path = Path(__file__).resolve().parents[3] / "data" / "kanji_data_n3.json"
        with data_path.open(encoding="utf-8") as data_file:
            indonesia_meanings = {
                item["char"]: item["meaning"]
                for item in json.load(data_file)
                if item.get("char") and item.get("meaning")
            }

        to_add = []
        already_n3 = 0
        skipped_other_levels = 0
        needs_translation = 0
        for entry in entries:
            existing = Kanji.objects.filter(character=entry.character).first()
            if existing:
                if existing.jlpt_level == 3:
                    already_n3 += 1
                else:
                    skipped_other_levels += 1
                continue
            meaning = indonesia_meanings.get(entry.character)
            to_add.append((entry, meaning))
            if not meaning:
                needs_translation += 1

        self.stdout.write(
            f"OpenJLPT N3: {len(entries)} entries; "
            f"{already_n3} already N3; {len(to_add)} ready to add; "
            f"{needs_translation} need online Indonesian translation; "
            f"{skipped_other_levels} assigned to another level."
        )
        if options["dry_run"]:
            return

        added = 0
        failed = 0
        session = requests.Session()
        for entry, meaning in to_add:
            try:
                if not meaning:
                    english_meaning = ", ".join(entry.meanings)
                    meaning = self.translate_meaning(session, english_meaning)

                Kanji.objects.create(
                    character=entry.character,
                    meaning=meaning,
                    onyomi=entry.onyomi,
                    kunyomi=entry.kunyomi,
                    strokes=entry.strokes or 0,
                    jlpt_level=3,
                )
                added += 1
                time.sleep(0.15)
            except Exception as exc:
                failed += 1
                self.stderr.write(f"Failed {entry.character}: {exc}")

        self.stdout.write(self.style.SUCCESS(
            f"Added {added} N3 kanji from OpenJLPT; {failed} failed."
        ))

    def translate_meaning(self, session, text):
        if not text:
            raise ValueError("OpenJLPT entry has no meaning to translate")

        params = {
            "client": "gtx",
            "sl": "en",
            "tl": "id",
            "dt": "t",
            "q": text,
        }
        for attempt in range(3):
            try:
                response = session.get(self.translate_url, params=params, timeout=20)
                response.raise_for_status()
                translated = " ".join(
                    segment[0]
                    for segment in response.json()[0]
                    if segment and segment[0]
                ).strip()
                if not translated:
                    raise ValueError("translation returned an empty result")
                return translated[:255]
            except (requests.RequestException, ValueError, IndexError, TypeError):
                if attempt == 2:
                    raise
                time.sleep(1.5 * (attempt + 1))