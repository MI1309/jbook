import os
import django
import sys
import json

# Setup Django
# Current file is /home/imron/jbook/backend/sync_n5.py
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from content.models import Vocab
from utils.kana import to_kana, to_katakana

def is_katakana(text):
    return any('\u30a0' <= char <= '\u30ff' for char in text)

def sync():
    print("Starting N5 synchronization...")
    
    json_path = os.path.join(BASE_DIR, 'scripts', 'n5_594.json')
    if not os.path.exists(json_path):
        print(f"Error: {json_path} not found!")
        return

    with open(json_path, 'r') as f:
        data = json.load(f)
    
    print(f"Loaded {len(data)} entries from JSON.")
    
    from django.db import transaction
    with transaction.atomic():
        # Clear existing N5
        deleted_count = Vocab.objects.filter(jlpt_level=5).delete()[0]
        print(f"Deleted {deleted_count} existing N5 entries.")
        
        vocab_objs = []
        for entry in data:
            word = entry['word']
            romaji_reading = entry['reading']
            
            # Convert romaji to kana
            # Special handling for common N5 patterns in reading
            clean_romaji = romaji_reading.replace('~', '').strip()
            
            if is_katakana(word):
                reading = to_katakana(clean_romaji)
            else:
                reading = to_kana(clean_romaji)
            
            # Add back the tilde if it was in the word
            if word.startswith('～') or word.startswith('~'):
                reading = '～' + reading
            if word.endswith('～') or word.endswith('~'):
                reading = reading + '～'
            
            # Cleanup
            reading = reading.replace(' ', '')
            
            # Determine furigana
            # If word is already all kana, furigana = word
            # If word has Kanji, furigana = reading
            # For simplicity, we set furigana to reading for now, 
            # as it will be used for Dikti/Kakitori
            furigana = reading
            
            v = Vocab(
                word=word,
                reading=reading,
                furigana=furigana,
                meaning=entry['meaning'],
                jlpt_level=5,
                word_type=entry.get('word_type', 'other')
            )
            vocab_objs.append(v)
            
        Vocab.objects.bulk_create(vocab_objs)
        print(f"Imported {len(vocab_objs)} N5 entries.")
        
    # Final check
    final_count = Vocab.objects.filter(jlpt_level=5).count()
    print(f"Sync finished. Current N5 count in database: {final_count}")

if __name__ == "__main__":
    sync()
