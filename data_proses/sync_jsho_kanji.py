import sqlite3
import json
import os
import uuid
import time
from deep_translator import GoogleTranslator

db_path = os.path.join(os.path.dirname(__file__), '../backend/db.sqlite3')
json_path = os.path.join(os.path.dirname(__file__), 'data_jsho/kanjidic_all_levels.json')

def translate_meaning(english_meanings):
    if not english_meanings:
        return ""
    try:
        if isinstance(english_meanings, list):
            text_to_translate = ", ".join(english_meanings)
        else:
            text_to_translate = str(english_meanings)
        translated = GoogleTranslator(source='en', target='id').translate(text_to_translate)
        return translated
    except Exception as e:
        print(f"Gagal menerjemahkan: {e}")
        if isinstance(english_meanings, list):
            return ", ".join(english_meanings)
        return str(english_meanings)

def main():
    # 1. Connect to DB and get existing kanjis
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("SELECT character FROM content_kanji")
    existing_kanjis = set(row[0] for row in cursor.fetchall())
    print(f"Found {len(existing_kanjis)} kanji in database.")

    # 2. Load JSON
    with open(json_path, 'r', encoding='utf-8') as f:
        json_data = json.load(f)
        
    print(f"Found {len(json_data)} kanji in json.")

    added = 0
    # 3. Iterate and add if missing
    for item in json_data:
        char = item.get("kanji")
        if not char:
            continue
            
        if char not in existing_kanjis:
            level_str = item.get("level", "N5").replace("N", "")
            try:
                level = int(level_str)
            except:
                level = 5

            strokes = item.get("strokes", 0)
            if isinstance(strokes, str):
                try: strokes = int(strokes)
                except: strokes = 0
                
            meaning_id = item.get("meaning_id")
            if not meaning_id:
                meaning_en = item.get("meaning_en", [])
                meaning_id = translate_meaning(meaning_en)
                
            onyomi = json.dumps(item.get("onyomi", []), ensure_ascii=False)
            kunyomi = json.dumps(item.get("kunyomi", []), ensure_ascii=False)
            
            new_id = str(uuid.uuid4()).replace('-', '')
            
            try:
                cursor.execute("""
                    INSERT INTO content_kanji 
                    (id, character, meaning, onyomi, kunyomi, strokes, jlpt_level, examples, radical, word_type)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    new_id,
                    char,
                    meaning_id,
                    onyomi,
                    kunyomi,
                    strokes,
                    level,
                    "[]",
                    None,
                    None
                ))
                conn.commit()
                added += 1
                existing_kanjis.add(char)
                print(f"Added {char} ({meaning_id})")
                
                # Small delay to prevent rate limit on Google Translator if needed, though it's usually fine
                time.sleep(0.1)
                
            except Exception as e:
                print(f"Failed to add {char}: {e}")

    conn.close()
    print(f"Process complete. Added {added} missing kanji.")

if __name__ == "__main__":
    main()
