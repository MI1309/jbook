
import os
import django
import sys
import json

# Setup sys.path to include backend root directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_ROOT = os.path.dirname(BASE_DIR)
sys.path.append(BACKEND_ROOT)

# Set settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

try:
    django.setup()
except Exception as e:
    print(f"Error setting up Django: {e}")
    sys.exit(1)

from content.models import Kanji

def load_data(filename):
    # Scripts will be in backend/scripts/, data in backend/data/
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    DATA_DIR = os.path.join(os.path.dirname(BASE_DIR), 'data')
    filepath = os.path.join(DATA_DIR, filename)
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return []
        
    with open(filepath, 'r') as f:
        return json.load(f)

def populate_kanji():
    files = ['kanji_data_n5.json', 'kanji_data_n4.json', 'kanji_data_n3.json', 'kanji_data_n2.json', 'kanji_data_n1.json']
    total_added = 0
    total_updated = 0
    
    for filename in files:
        print(f"Processing {filename}...")
        data_list = load_data(filename)
        
        for data in data_list:
            try:
                kanji, created = Kanji.objects.get_or_create(
                    character=data["char"],
                    defaults={
                        "meaning": data["meaning"],
                        "onyomi": data["on"],
                        "kunyomi": data["kun"],
                        "strokes": data["strokes"],
                        "jlpt_level": data["level"],
                        "radical": data["radical"]
                    }
                )
                
                if created:
                    print(f"Added: {data['char']}")
                    total_added += 1
                else:
                    # Update if radical is missing or meaningful change
                    updated = False
                    if not kanji.radical and data["radical"]:
                        kanji.radical = data["radical"]
                        updated = True
                    
                    if updated:
                        kanji.save()
                        print(f"Updated: {data['char']}")
                        total_updated += 1
                        
            except Exception as e:
                print(f"Error processing {data['char']}: {e}")

    print(f"Done. Added: {total_added}, Updated: {total_updated}")

if __name__ == "__main__":
    populate_kanji()
