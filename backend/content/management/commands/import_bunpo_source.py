import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.db.models import Q

from content.models import Grammar


class Command(BaseCommand):
    help = 'Import source-preserving Bunpo JSON records into Grammar.'

    def add_arguments(self, parser):
        parser.add_argument('json_file', type=str, help='Path to the Bunpo source JSON file')
        parser.add_argument('--jlpt-level', type=int, choices=range(1, 6), default=3)
        parser.add_argument('--dry-run', action='store_true')

    def handle(self, *args, **options):
        json_path = Path(options['json_file'])
        if not json_path.is_file():
            raise CommandError(f'File does not exist: {json_path}')

        try:
            with json_path.open(encoding='utf-8') as source_file:
                records = json.load(source_file)
        except (OSError, json.JSONDecodeError) as error:
            raise CommandError(f'Could not read valid UTF-8 JSON: {error}') from error

        if not isinstance(records, list):
            raise CommandError('The source JSON root must be an array.')

        titles = set()
        urls = set()
        for index, record in enumerate(records, start=1):
            if not isinstance(record, dict):
                raise CommandError(f'Entry {index} must be an object.')
            for key in ('kelompok', 'pola', 'arti', 'url', 'detail'):
                if key not in record:
                    raise CommandError(f'Entry {index} is missing {key!r}.')
            if not all(isinstance(record[key], str) for key in ('kelompok', 'pola', 'arti', 'url')):
                raise CommandError(f'Entry {index} has a non-string core field.')
            if not record['pola'] or len(record['pola']) > 255:
                raise CommandError(f'Entry {index} has an empty or overlong pola.')
            if not isinstance(record['detail'], dict):
                raise CommandError(f'Entry {index} detail must be an object.')
            sections = record['detail'].get('bagian')
            if not isinstance(sections, list):
                raise CommandError(f'Entry {index} detail.bagian must be an array.')
            for section_index, section in enumerate(sections, start=1):
                if not isinstance(section, dict) or not isinstance(section.get('judul'), str):
                    raise CommandError(f'Entry {index} section {section_index} has an invalid judul.')
                if not isinstance(section.get('isi'), list) or not all(isinstance(text, str) for text in section['isi']):
                    raise CommandError(f'Entry {index} section {section_index} isi must be an array of strings.')
            if record['pola'] in titles:
                raise CommandError(f'Duplicate pola in input: {record["pola"]}')
            if record['url'] in urls:
                raise CommandError(f'Duplicate URL in input: {record["url"]}')
            titles.add(record['pola'])
            urls.add(record['url'])

        existing = list(
            Grammar.objects.filter(Q(title__in=titles) | Q(source_data__url__in=urls))
        )
        by_title = {}
        by_url = {}
        for grammar in existing:
            by_title.setdefault(grammar.title, []).append(grammar)
            source_url = grammar.source_data.get('url') if isinstance(grammar.source_data, dict) else None
            if source_url:
                by_url.setdefault(source_url, []).append(grammar)

        to_create = []
        skipped_count = 0
        for record in records:
            title_matches = by_title.get(record['pola'], [])
            url_matches = by_url.get(record['url'], [])
            matches = {grammar.pk: grammar for grammar in title_matches + url_matches}
            if len(matches) > 1:
                raise CommandError(f'Ambiguous existing records for pola: {record["pola"]}')
            if matches:
                existing_grammar = next(iter(matches.values()))
                if existing_grammar.title == record['pola'] and existing_grammar.source_data == record:
                    skipped_count += 1
                    continue
                raise CommandError(f'Existing Grammar conflicts with source record: {record["pola"]}')
            to_create.append(record)

        if options['dry_run']:
            self.stdout.write(
                f'Dry run: would create {len(to_create)}, already imported {skipped_count}; no database changes made.'
            )
            return

        with transaction.atomic():
            for record in to_create:
                Grammar.objects.create(
                    title=record['pola'],
                    structure=record['pola'],
                    explanation=record['arti'],
                    chapter=0,
                    jlpt_level=options['jlpt_level'],
                    sentences=[],
                    source_data=record,
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'Import finished. Created: {len(to_create)}, already imported: {skipped_count}.'
            )
        )