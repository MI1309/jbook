import time
from django.core.management.base import BaseCommand
from content.models import Vocab
from deep_translator import GoogleTranslator

class Command(BaseCommand):
    help = 'Translate English vocabulary meanings to Indonesian using deep-translator (Online)'

    def add_arguments(self, parser):
        parser.add_argument('--limit', type=int, help='Limit the number of words to translate')
        parser.add_argument('--start', type=int, default=0, help='Offset to start from')

    def handle(self, *args, **options):
        # Initialize translator
        # source='auto' or 'en', target='id'
        translator = GoogleTranslator(source='auto', target='id')
        
        limit = options.get('limit')
        start = options.get('start')
        
        # Process Vocabulary
        vocabs = Vocab.objects.all().order_by('id')[start:]
        if limit:
            vocabs = vocabs[:limit]
            
        total_count = len(vocabs)
        self.stdout.write(f"Starting online translation of {total_count} words...")

        count = 0
        errors = 0
        
        for vocab in vocabs:
            try:
                # Skip if empty
                if not vocab.meaning:
                    continue
                
                # Check if already translated (heuristic: no english letters? or check against English content)
                # For now, just re-translate or overwrite.
                # Optimization: if current meaning is same as source, translate.
                # But source is English.
                
                translated_text = translator.translate(vocab.meaning)

                self.stdout.write(f"[{count+1}/{total_count}] {vocab.word}: {vocab.meaning} -> {translated_text}")
                
                vocab.meaning = translated_text
                vocab.save()
                count += 1
                
                # Sleep to avoid IP ban (Online)
                time.sleep(0.5) 
                
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error translating {vocab.word}: {e}"))
                errors += 1
                if errors > 20:
                     self.stdout.write(self.style.ERROR("Too many errors, stopping."))
                     break
                time.sleep(2) # Backoff
                
        self.stdout.write(self.style.SUCCESS(f"Finished. Translated: {count}, Errors: {errors}"))
