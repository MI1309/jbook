import os
import django
import json
import uuid

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from content.models import Vocab, JLPTLevel, WordType

WORD_TYPE_MAP = {
    'V-I': WordType.GODAN_VERB,
    'V-II': WordType.ICHIDAN_VERB,
    'V-III': WordType.SURU_VERB,
    'N': WordType.NOUN,
    'Noun': WordType.NOUN,
    'Adj-I': WordType.ADJECTIVE_I,
    'i-adj': WordType.ADJECTIVE_I,
    'Adj-NA': WordType.ADJECTIVE_NA,
    'na-adj': WordType.ADJECTIVE_NA,
    'Adv': WordType.ADVERB,
    'Adj': WordType.OTHER,
    'Adj-N': WordType.NOUN,
    'Suf': WordType.SUFFIX,
    'Suffix': WordType.SUFFIX,
    'Sufiks': WordType.SUFFIX,
    'Frasa': WordType.OTHER,
    'Partikel': WordType.PARTICLE,
    'Conj': WordType.CONJUNCTION,
    'Intj': WordType.INTERJECTION,
    'Pron': WordType.PRONOUN,
    'Counter': WordType.COUNTER,
    'Adj-L': WordType.OTHER,
    'Adj-F': WordType.OTHER,
    'Frasa/Adj': WordType.OTHER,
    'N/V': WordType.SURU_VERB,
    'N/V-III': WordType.SURU_VERB,
    'Adv/N': WordType.ADVERB,
    'N/Adv': WordType.NOUN,
    'Adj/Adv': WordType.OTHER,
    'Adj-Frasa': WordType.OTHER,
}

def get_word_type(suffix):
    return WORD_TYPE_MAP.get(suffix, WordType.OTHER)

def populate_minna_ii():
    backend_dir = os.path.dirname(__file__)
    json_files = sorted([f for f in os.listdir(backend_dir) if f.startswith('minna_ii_') and f.endswith('.json')])
    
    if not json_files:
        print("No minna_ii_*.json files found.")
        return

    total_added = 0
    total_updated = 0
    for json_file in json_files:
        json_path = os.path.join(backend_dir, json_file)
        print(f"Processing {json_file}...")
        
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Consolidate all words from all lessons and all categories
        all_words = []
        minna_data = data.get('Minna_no_Nihongo_II', {})
        for lesson_num, lesson_data in minna_data.items():
            for category, words in lesson_data.items():
                if isinstance(words, list):
                    all_words.extend(words)

        print(f"  Found {len(all_words)} words in {json_file}")
        
        count_added = 0
        count_updated = 0
        for item in all_words:
            kotoba = item.get('kotoba', '')
            kanji_field = item.get('kanji', '-')
            suffix = item.get('suffix', '')
            meaning = item.get('terjemahan', '')

            if not kotoba:
                continue

            # word = kanji_field for 100% fidelity (could be "見ます、診ます")
            word = kanji_field if (kanji_field and kanji_field != '-') else kotoba
            reading = kotoba
            word_type = get_word_type(suffix)
            
            # Use update_or_create to ensure data is exactly as in JSON
            vocab, created = Vocab.objects.update_or_create(
                word=word,
                reading=reading,
                defaults={
                    "meaning": meaning,
                    "word_type": word_type,
                    "jlpt_level": JLPTLevel.N4
                }
            )
            
            if created:
                count_added += 1
            else:
                count_updated += 1

        print(f"  Added {count_added}, Updated {count_updated} items from {json_file}")
        total_added += count_added
        total_updated += count_updated

    print(f"\nImport complete. Total added: {total_added}, Total updated: {total_updated}")

if __name__ == "__main__":
    populate_minna_ii()
