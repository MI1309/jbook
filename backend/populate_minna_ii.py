import os
import django
import json

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from content.models import Vocab, JLPTLevel, WordType

WORD_TYPE_MAP = {
    'V-I': 'godan',
    'V-II': 'ichidan',
    'V-III': 'suru',
    'N': 'noun',
    'Adj-F': 'other',
    'Adj-L': 'other',
    'Suf': 'suffix',
    'Adv': 'adverb',
    'Conj': 'other',
    'Pron': 'other',
    'Partikel': 'particle',
    'i-adj': 'i_adj',
    'na-adj': 'na_adj',
    'N/V-III': 'suru',
    'Frasa': 'other',
    'Frasa/Adj': 'other',
    'Counter': 'suffix',
    'N-Adj': 'na_adj',
    'Adj': 'other',
    'Adj-N': 'noun',
    'Suf': 'suffix',
}

def get_word_type(suffix):
    return WORD_TYPE_MAP.get(suffix, 'other')

def populate_minna_ii():
    backend_dir = os.path.dirname(__file__)
    json_files = sorted([f for f in os.listdir(backend_dir) if f.startswith('minna_ii_') and f.endswith('.json')])
    
    if not json_files:
        print("No minna_ii_*.json files found.")
        return

    total_added = 0
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

        print(f"  Found {len(all_words)} words in {lesson_num if 'lesson_num' in locals() else 'this file'}")
        
        count = 0
        for item in all_words:
            kotoba = item.get('kotoba', '')
            kanji_field = item.get('kanji', '-')
            suffix = item.get('suffix', '')
            meaning = item.get('terjemahan', '')

            if not kotoba:
                continue

            # Determine word and reading
            if kanji_field == '-':
                word = kotoba
                reading = kotoba
            else:
                # Handle multiple kanji (e.g., "見ます、診ます")
                word = kanji_field.split('、')[0].split(',')[0].strip()
                reading = kotoba

            word_type = get_word_type(suffix)
            
            vocab, created = Vocab.objects.get_or_create(
                word=word,
                reading=reading,
                defaults={
                    "meaning": meaning,
                    "word_type": word_type,
                    "jlpt_level": JLPTLevel.N4
                }
            )
            
            if created:
                count += 1
            else:
                # Optionally update existing (but for now just keeping existing)
                pass

        print(f"  Added {count} new items from {json_file}.")
        total_added += count

    print(f"\nImport complete. Total added: {total_added}")

if __name__ == "__main__":
    populate_minna_ii()
