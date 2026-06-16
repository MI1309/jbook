import os
import sys
import django
import json
from django.db import transaction

# Setup Django
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.dirname(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from content.models import Vocab

def sync():
    print("Starting PDF Vocabulary synchronization...")
    
    # Paths
    backend_root = os.path.dirname(BASE_DIR)
    project_root = os.path.dirname(backend_root)
    data_proses_dir = os.path.join(project_root, 'data_proses')
    
    levels = [5, 4, 3, 2, 1]
    
    for lvl in levels:
        json_path = os.path.join(data_proses_dir, f"n{lvl}_parsed.json")
        if not os.path.exists(json_path):
            print(f"Warning: Parsed JSON for level N{lvl} not found at {json_path}. Skipping.")
            continue
            
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        print(f"\nProcessing N{lvl}: Loaded {len(data)} entries from JSON.")
        
        with transaction.atomic():
            # Delete existing vocab entries for this level
            deleted_count = Vocab.objects.filter(jlpt_level=lvl).delete()[0]
            print(f"Deleted {deleted_count} existing N{lvl} entries from database.")
            
            vocab_objs = []
            for entry in data:
                word = entry['word']
                reading = entry['reading']
                meaning = entry['meaning']
                
                # Cleanup readings if any extra spaces are present
                reading = reading.replace(' ', '')
                
                v = Vocab(
                    word=word,
                    reading=reading,
                    furigana=reading,  # Using reading as furigana
                    meaning=meaning,
                    jlpt_level=lvl,
                    word_type='other'
                )
                vocab_objs.append(v)
                
            Vocab.objects.bulk_create(vocab_objs)
            print(f"Successfully imported {len(vocab_objs)} N{lvl} entries.")
            
    print("\nSynchronization completed successfully!")

if __name__ == "__main__":
    sync()
