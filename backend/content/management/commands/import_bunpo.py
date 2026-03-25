import json
import uuid
import os
from django.core.management.base import BaseCommand
from content.models import Grammar, JLPTLevel

class Command(BaseCommand):
    help = 'Import Bunpo (Grammar) data from a JSON file, preventing duplicates by title.'

    def add_arguments(self, parser):
        parser.add_argument('json_file', type=str, help='Path to the JSON file to import')
        parser.add_argument(
            '--tag',
            type=str,
            default=None,
            help='Optional tag or source name to log/identify where the data came from',
        )

    def handle(self, *args, **kwargs):
        json_file = kwargs['json_file']
        tag = kwargs.get('tag') or os.path.basename(json_file)

        if not os.path.exists(json_file):
            self.stdout.write(self.style.ERROR(f'File "{json_file}" does not exist.'))
            return

        with open(json_file, 'r', encoding='utf-8') as f:
            try:
                data = json.load(f)
            except json.JSONDecodeError as e:
                self.stdout.write(self.style.ERROR(f'Invalid JSON format in {json_file}: {e}'))
                return

        created_count = 0
        updated_count = 0

        for item in data:
            title = item.get('title')
            if not title:
                self.stdout.write(self.style.WARNING("Skipping item without a 'title' field."))
                continue

            existing_grammar = Grammar.objects.filter(title=title).first()

            if existing_grammar:
                # Update existing record
                existing_grammar.structure = item.get('structure', existing_grammar.structure)
                existing_grammar.explanation = item.get('explanation', existing_grammar.explanation)
                existing_grammar.chapter = item.get('chapter', existing_grammar.chapter)
                existing_grammar.jlpt_level = item.get('jlpt_level', existing_grammar.jlpt_level)
                existing_grammar.sentences = item.get('sentences', existing_grammar.sentences)
                existing_grammar.save()
                updated_count += 1
                self.stdout.write(self.style.NOTICE(f'[UPDATED] {title} (Source: {tag})'))
            else:
                # Create a new record
                item_id = item.get('id')
                valid_id = None
                if item_id:
                    try:
                        valid_id = uuid.UUID(item_id)
                    except ValueError:
                        pass
                
                Grammar.objects.create(
                    id=valid_id if valid_id else uuid.uuid4(),
                    title=title,
                    structure=item.get('structure', ''),
                    explanation=item.get('explanation', ''),
                    chapter=item.get('chapter', 0),
                    jlpt_level=item.get('jlpt_level', JLPTLevel.N5),
                    sentences=item.get('sentences', []),
                )
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'[CREATED] {title} (Source: {tag})'))

        self.stdout.write(self.style.SUCCESS(
            f'Import finished from {tag}. Created: {created_count}, Updated: {updated_count}'
        ))
