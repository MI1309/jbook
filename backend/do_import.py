import json
import uuid
from content.models import Grammar

def run():
    print("Loading JSON...", flush=True)
    with open('bunpo_data_n4.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    for item in data:
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
        
    with open('bunpo_data_n4.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"Successfully imported {len(data)} N4 grammar items and corrected any invalid UUIDs.", flush=True)

run()
