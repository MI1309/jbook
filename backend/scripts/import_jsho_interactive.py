import os
import sys
import json
import re
from deep_translator import GoogleTranslator

# Setup Django
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

import django
django.setup()

from content.models import Vocab

def parse_edict_line(line):
    # EDICT format: KANJI [KANA] /(tags) meaning/meaning/
    # Or: KANA /(tags) meaning/meaning/
    
    match_kanji = re.match(r'^([^\[]+)\s\[([^\]]+)\]\s+/(.+)/$', line)
    if match_kanji:
        word = match_kanji.group(1).strip()
        reading = match_kanji.group(2).strip()
        meanings_raw = match_kanji.group(3).strip()
    else:
        match_kana = re.match(r'^([^\s]+)\s+/(.+)/$', line)
        if match_kana:
            word = match_kana.group(1).strip()
            reading = word
            meanings_raw = match_kana.group(2).strip()
        else:
            return None

    # Parse meanings and tags
    # Remove things in parenthesis like (n,adj-no) 
    # Or just keep the raw meaning for translation
    meaning_clean = re.sub(r'\(.*?\)', '', meanings_raw).replace('/', ', ').strip(', ')
    return {
        'word': word,
        'reading': reading,
        'meaning_en': meaning_clean
    }

def main():
    edict_path = '/home/imron/jbook/data_proses/data_jsho/edict'
    progress_file = os.path.join(BASE_DIR, 'scripts', 'import_progress.json')
    
    last_idx = 0
    if os.path.exists(progress_file):
        with open(progress_file, 'r') as f:
            data = json.load(f)
            last_idx = data.get('last_idx', 0)
    
    translator = GoogleTranslator(source='en', target='id')
    
    print(f"Membaca file EDICT... (Mulai dari baris ke-{last_idx})")
    
    try:
        with open(edict_path, 'r', encoding='euc-jp') as f:
            for i, line in enumerate(f):
                if i < last_idx:
                    continue
                    
                # Skip header
                if line.startswith('　？？？'):
                    continue
                    
                parsed = parse_edict_line(line)
                if not parsed:
                    continue
                
                word = parsed['word']
                reading = parsed['reading']
                meaning_en = parsed['meaning_en']
                
                # Check duplicate
                if Vocab.objects.filter(word=word, reading=reading).exists():
                    # print(f"[{i}] {word} sudah ada di database, skip.")
                    continue
                
                # Translate
                try:
                    meaning_id = translator.translate(meaning_en)
                except Exception as e:
                    meaning_id = ""
                    print(f"Gagal translate: {e}")
                
                print("\n" + "="*50)
                print(f"[{i}] Word    : {word}")
                print(f"    Reading : {reading}")
                print(f"    Mean(EN): {meaning_en}")
                print(f"    Mean(ID): {meaning_id}")
                print("-"*50)
                
                print("Tekan [Enter] untuk SETUJU dengan terjemahan di atas,")
                print("Atau KETIK arti baru,")
                print("Atau ketik 'skip' untuk melewati kata ini,")
                print("Atau ketik 'quit' untuk berhenti.")
                
                action = input("=> ").strip()
                
                if action.lower() == 'quit':
                    last_idx = i
                    break
                elif action.lower() == 'skip':
                    continue
                
                final_meaning = meaning_id if action == '' else action
                
                # Ask JLPT level
                jlpt_input = input("JLPT Level [5=N5, 4=N4, 3=N3, 2=N2, 1=N1, 0=None] (Default 0): ").strip()
                jlpt_val = int(jlpt_input) if jlpt_input.isdigit() and jlpt_input in ['1','2','3','4','5','0'] else 0
                
                # Insert to DB
                v = Vocab(
                    word=word,
                    reading=reading,
                    furigana=reading,
                    meaning=final_meaning,
                    word_type='other',
                )
                if jlpt_val != 0:
                    v.jlpt_level = jlpt_val
                    
                v.save()
                print(f"✅ Disimpan: {word} -> {final_meaning} (N{jlpt_val})")
                
                # Save progress
                with open(progress_file, 'w') as pf:
                    json.dump({'last_idx': i + 1}, pf)

    except KeyboardInterrupt:
        print("\nDihentikan oleh user.")
    
    # Save progress on exit
    with open(progress_file, 'w') as pf:
        json.dump({'last_idx': last_idx}, pf)
    print(f"Progress disimpan di index {last_idx}.")

if __name__ == "__main__":
    main()
