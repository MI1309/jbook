import json
import os
from django.core.management.base import BaseCommand
from django.conf import settings
from content.models import MinnaQuestion, QuestionType, JLPTLevel

class Command(BaseCommand):
    help = 'Load Minna no Nihongo practice questions from JSON fixtures.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--book',
            type=int,
            choices=[1, 2],
            help='Load questions only for specific book (1 or 2)'
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Load all books (Minna 1 & 2)'
        )

    def handle(self, *args, **options):
        book_opt = options.get('book')
        all_opt = options.get('all')

        if not book_opt and not all_opt:
            self.stdout.write(self.style.WARNING("Please specify either --book=1/2 or --all. Defaulting to --all."))
            all_opt = True

        books_to_load = []
        if all_opt:
            books_to_load = [1, 2]
        elif book_opt:
            books_to_load = [book_opt]

        # Content app directory
        app_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        fixtures_dir = os.path.join(app_dir, 'fixtures')

        total_created = 0
        total_updated = 0

        for book_num in books_to_load:
            filename = f'minna{book_num}_questions.json'
            file_path = os.path.join(fixtures_dir, filename)

            if not os.path.exists(file_path):
                self.stdout.write(self.style.ERROR(f'Fixture file "{filename}" not found at {file_path}. Skipping.'))
                continue

            self.stdout.write(self.style.NOTICE(f'Loading questions from {filename}...'))

            with open(file_path, 'r', encoding='utf-8') as f:
                try:
                    questions_data = json.load(f)
                except json.JSONDecodeError as e:
                    self.stdout.write(self.style.ERROR(f'Invalid JSON format in {filename}: {e}'))
                    continue

            for q_data in questions_data:
                # Validate type
                q_type = q_data.get('question_type')
                if q_type not in QuestionType.values:
                    self.stdout.write(self.style.WARNING(f"Skipping unknown question type '{q_type}' in chapter {q_data.get('chapter')}"))
                    continue

                # Query to check existing question
                # We identify uniqueness by book, chapter, question_type, and question_jp / question_id
                q_jp = q_data.get('question_jp', '')
                q_id = q_data.get('question_id', '')
                chapter = q_data.get('chapter')

                # We search for existing record
                query = MinnaQuestion.objects.filter(
                    book=book_num,
                    chapter=chapter,
                    question_type=q_type,
                    question_jp=q_jp,
                    question_id=q_id
                )

                defaults = {
                    'shown_translation': q_data.get('shown_translation', ''),
                    'is_translation_correct': q_data.get('is_translation_correct'),
                    'correct_answer': q_data.get('correct_answer', ''),
                    'options': q_data.get('options', []),
                    'explanation': q_data.get('explanation', ''),
                    'jlpt_level': q_data.get('jlpt_level', JLPTLevel.N5)
                }

                obj, created = MinnaQuestion.objects.update_or_create(
                    book=book_num,
                    chapter=chapter,
                    question_type=q_type,
                    question_jp=q_jp,
                    question_id=q_id,
                    defaults=defaults
                )

                if created:
                    total_created += 1
                else:
                    total_updated += 1

        self.stdout.write(self.style.SUCCESS(
            f'Finish loading Minna questions. Created: {total_created}, Updated: {total_updated}'
        ))
