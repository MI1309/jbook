import os, sys, json
import django
from deep_translator import GoogleTranslator

def setup_django():
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(BASE_DIR, '..'))
    sys.path.append(project_root)
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
    django.setup()

setup_django()

from content.models import Vocab

EDICT_PATH = os.path.expanduser('~/jbook/data_proses/data_jsho/edict')
PROGRESS_PATH = os.path.expanduser('~/jbook/backend/scripts/import_progress.json')

# Load progress
if os.path.exists(PROGRESS_PATH):
    with open(PROGRESS_PATH) as f:
        progress = json.load(f)
    start_line = progress.get('last_line', 0) + 1
else:
    start_line = 1

batch = []
BATCH_SIZE = 1000

with open(EDICT_PATH, encoding='utf-8') as f:
    for i, raw in enumerate(f, start=1):
        if i < start_line:
            continue
        raw = raw.strip()
        if not raw or raw.startswith('#'):
            continue
        # EDICT format: kanji [reading] /eng1/eng2/ ... /
        # Extract kanji, reading, english meanings
        kanji_part, rest = raw.split(' [', 1) if ' [' in raw else (raw.split(' ', 1)[0], raw)
        kanji = kanji_part.strip()
        reading = ''
        if '[' in raw and ']' in raw:
            reading = raw.split(']')[0].split('[')[-1]
        english = rest.split('/')
        english_meanings = [e for e in english if e]
        eng_text = english_meanings[0] if english_meanings else ''
        # Translate to Indonesian
        try:
            ind_text = GoogleTranslator(source='en', target='id').translate(eng_text)
        except Exception:
            ind_text = eng_text
        vocab = Vocab(
            word=kanji,
            reading=reading,
            furigana=reading,
            meaning=ind_text,
            jlpt_level=5,  # default N5; you can adjust later
            word_type='noun'
        )
        batch.append(vocab)
        if len(batch) >= BATCH_SIZE:
            Vocab.objects.bulk_create(batch)
            batch.clear()
            # Save progress
            with open(PROGRESS_PATH, 'w') as pf:
                json.dump({'last_line': i}, pf)
            print(f'Processed up to line {i}')

# Final batch
if batch:
    Vocab.objects.bulk_create(batch)
    with open(PROGRESS_PATH, 'w') as pf:
        json.dump({'last_line': i}, pf)
    print(f'Processed final up to line {i}')
