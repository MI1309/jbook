import csv
import os
from django.core.management.base import BaseCommand
from content.models import Vocab, JLPTLevel

class Command(BaseCommand):
    help = 'Imports JLPT vocabulary from Anki CSV files (English meanings)'

    def handle(self, *args, **kwargs):
        # Base path to the CSV files
        base_path = '/home/imron/jbook/open-anki-jlpt-decks/src'
        
        files_map = {
            JLPTLevel.N5: 'n5.csv',
            JLPTLevel.N4: 'n4.csv',
            JLPTLevel.N3: 'n3.csv',
            JLPTLevel.N2: 'n2.csv',
            JLPTLevel.N1: 'n1.csv',
        }

        total_created = 0
        total_updated = 0

        for level, filename in files_map.items():
            file_path = os.path.join(base_path, filename)
            if not os.path.exists(file_path):
                self.stdout.write(self.style.WARNING(f"File not found: {file_path}, skipping N{level}"))
                continue

            self.stdout.write(f"Processing N{level} from {filename}...")
            
            with open(file_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                count = 0
                batch_size = 500
                batch_objects = []
                
                for row in reader:
                    word = row['expression']
                    reading = row['reading']
                    meaning = row['meaning']
                    
                    # Basic validation
                    if not word or not reading:
                        continue
                        
                    # Create object to be saved/updated
                    # We use update_or_create to avoid duplicates but it's slower than bulk_create
                    # Given 3000 words, update_or_create is fine.
                    
                    obj, created = Vocab.objects.get_or_create(
                        word=word,
                        defaults={
                            'reading': reading,
                            'meaning': meaning, # Currently English
                            'jlpt_level': level,
                            # examples field is left as default (empty list) for new items
                        }
                    )
                    
                    if created:
                        total_created += 1
                    else:
                        total_updated += 1 # Technically skipped/kept existing
                        
                    count += 1
                    if count % 100 == 0:
                        self.stdout.write(f"  Processed {count} words...")

        self.stdout.write(self.style.SUCCESS(f"Import Finished! Created: {total_created}, Updated: {total_updated}"))
