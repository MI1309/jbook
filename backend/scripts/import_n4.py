import os
import django
import json
import uuid
import sys

# Setup sys.path to include backend root directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_ROOT = os.path.dirname(BASE_DIR)
sys.path.append(BACKEND_ROOT)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from content.models import Grammar

def run():
    # Scripts will be in backend/scripts/, data in backend/data/
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    DATA_DIR = os.path.join(os.path.dirname(BASE_DIR), 'data')
    json_path = os.path.join(DATA_DIR, 'bunpo_data_n4.json')
    
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    for item in data:
        # Generate new valid UUID if the provided one is invalid
        try:
            uuid.UUID(item['id'])
        except ValueError:
            item['id'] = str(uuid.uuid4())

        Grammar.objects.update_or_create(
            id=item['id'],
            defaults={
                'title': item['title'],
                'structure': item['structure'],
                'explanation': item['explanation'],
                'chapter': item.get('chapter', 0),
                'jlpt_level': item.get('jlpt_level', 4),
                'sentences': item.get('sentences', [])
            }
        )
        
    # Write back the corrected data
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"Successfully imported {len(data)} N4 grammar items and corrected any invalid UUIDs.")

if __name__ == '__main__':
    run()
