import json
from collections import OrderedDict
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from content.models import JLPTLevel, Vocab, WordType


class Command(BaseCommand):
    help = (
        'Mengimpor kata sifat N4 dari JSON. Kata yang sama di database '
        'dihapus lalu diganti dengan data dari file.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            default='data/kata_sifat_n4.json',
            help='Path JSON relatif terhadap backend atau path absolut.',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Tampilkan rencana impor tanpa mengubah database.',
        )

    def _resolve_path(self, file_name):
        path = Path(file_name)
        if not path.is_absolute():
            path = Path(__file__).resolve().parents[3] / path
        return path

    def _load_data(self, path):
        try:
            with path.open('r', encoding='utf-8') as source_file:
                raw_data = json.load(source_file)
        except (OSError, json.JSONDecodeError) as exc:
            raise CommandError(f'Gagal membaca JSON {path}: {exc}') from exc

        if not isinstance(raw_data, list):
            raise CommandError('Format JSON harus berupa list of objects.')

        # Bila file sendiri berisi kata yang sama, entri terakhir adalah versi baru.
        unique_data = OrderedDict()
        source_duplicates = []
        for item in raw_data:
            if not isinstance(item, dict) or not item.get('word'):
                raise CommandError('Setiap entri harus berupa object dengan field word.')
            word = item['word'].strip()
            if word in unique_data:
                source_duplicates.append(word)
            unique_data[word] = item

        return list(unique_data.values()), source_duplicates

    def _normalize_item(self, item):
        word_type = {
            'i-adjective': WordType.ADJECTIVE_I,
            'na-adjective': WordType.ADJECTIVE_NA,
            'adnominal': WordType.ADJECTIVE_NA,
        }.get(item.get('word_type'), item.get('word_type'))
        valid_types = {choice for choice, _label in WordType.choices}
        if word_type not in valid_types:
            raise CommandError(
                f"word_type '{item.get('word_type')}' untuk '{item['word']}' tidak dikenal."
            )

        return {
            'word': item['word'].strip(),
            'reading': item.get('reading', '').strip(),
            'furigana': item.get('furigana'),
            'meaning': item.get('meaning', '').strip(),
            'word_type': word_type,
            'jlpt_level': JLPTLevel.N4,
            'examples': item.get('examples', []),
        }

    def handle(self, *args, **options):
        path = self._resolve_path(options['file'])
        data, source_duplicates = self._load_data(path)
        normalized_data = [self._normalize_item(item) for item in data]

        self.stdout.write(f'File sumber: {path}')
        self.stdout.write(f'Entri sumber: {len(data)}')
        for word in source_duplicates:
            self.stdout.write(self.style.WARNING(
                f'DUPLIKAT DI FILE: {word} -> memakai entri terakhir.'
            ))

        planned_deletions = 0
        existing_by_word = {}
        for item in normalized_data:
            matches = list(Vocab.objects.filter(word__iexact=item['word']))
            existing_by_word[item['word']] = matches
            if matches:
                planned_deletions += len(matches)
                self.stdout.write(
                    f"REPLACE: '{item['word']}' -> {len(matches)} record lama akan dihapus."
                )
                for match in matches:
                    self.stdout.write(
                        f"  HAPUS: id={match.id} | {match.word} | {match.meaning} | N{match.jlpt_level}"
                    )
            else:
                self.stdout.write(f"CREATE: '{item['word']}' -> belum ada di database.")

        if options['dry_run']:
            self.stdout.write(self.style.WARNING(
                f'DRY-RUN selesai. Hapus: {planned_deletions}, '
                f'buat/ganti: {len(normalized_data)}.'
            ))
            return

        created_count = 0
        deleted_count = 0
        with transaction.atomic():
            for item in normalized_data:
                for match in existing_by_word[item['word']]:
                    match.delete()
                    deleted_count += 1
                Vocab.objects.create(**item)
                created_count += 1

        self.stdout.write(self.style.SUCCESS(
            f'Selesai. Dibuat: {created_count}, dihapus/diganti: {deleted_count}, '
            f'duplikat file: {len(source_duplicates)}.'
        ))