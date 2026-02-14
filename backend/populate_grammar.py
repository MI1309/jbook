
import os
import django
import sys
import json

# Setup sys.path to include backend directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)

# Set settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

try:
    django.setup()
except Exception as e:
    print(f"Error setting up Django: {e}")
    sys.exit(1)

from content.models import Grammar

def load_grammar_data():
    file_path = os.path.join(BASE_DIR, 'content', 'fixtures', 'grammar_data.json')
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: Fixture file not found at {file_path}")
        return []
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON: {e}")
        return []

grammar_data = load_grammar_data()

def populate_grammar():
    print("Populating grammar data...")
    count = 0
    for item in grammar_data:
        grammar, created = Grammar.objects.get_or_create(
            title=item["title"],
            defaults={
                "structure": item["structure"],
                "explanation": item["explanation"],
                "chapter": item["chapter"],
                "jlpt_level": item["jlpt_level"],
                "sentences": item["sentences"]
            }
        )
        
        if not created:
            grammar.chapter = item["chapter"]
            grammar.save()
            print(f"Updated: {item['title']} (Bab {item['chapter']})")
        else:
            print(f"Created: {item['title']} (Bab {item['chapter']})")
        count += 1
        
    print(f"Done. Processed {count} items.")

if __name__ == "__main__":
    populate_grammar()
