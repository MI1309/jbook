import os
import django
import json
import uuid
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from content.models import Grammar

def run():
    print("Loading JSON...")
    with open('bunpo_data_n4.json', 'r', encoding='utf-8') as f:
        try:
            data = json.load(f)
        except Exception as e:
            print("JSON Load Error:", e)
            sys.exit(1)

    print(f"Total items: {len(data)}")
    for i, item in enumerate(data):
        print(f"Processing #{i} ID: {item.get('id')}...", end=" ")
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
        print("OK")
        
    print("Writing back to JSON...", end=" ")
    with open('bunpo_data_n4.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print("OK")

    print(f"Successfully imported {len(data)} N4 grammar items and corrected any invalid UUIDs.")

if __name__ == '__main__':
    run()
