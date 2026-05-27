import sqlite3
import urllib.request
import urllib.parse
import json
import re
from concurrent.futures import ThreadPoolExecutor
import time

def translate_text(text):
    if not text:
        return text
    url = 'https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=en&tl=id&q=' + urllib.parse.quote(text)
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as response:
            res = json.loads(response.read().decode('utf-8'))
            return res[0]
    except Exception as e:
        print(f"Error translating '{text}': {e}")
        return text

def main():
    conn = sqlite3.connect('db.sqlite3')
    cursor = conn.cursor()
    cursor.execute("SELECT id, word, meaning FROM content_vocab")
    rows = cursor.fetchall()
    
    id_keywords = {'yang', 'di', 'ke', 'dari', 'untuk', 'sebuah', 'dengan', 'saya', 'kamu', 'dia', 'mereka', 'kita', 'kami', 'ini', 'itu', 'bisa', 'akan', 'sudah', 'telah', 'dan', 'atau', 'tetapi', 'karena', 'buku', 'kucing', 'anjing'}
    eng_keywords = {'to', 'the', 'a', 'an', 'is', 'are', 'in', 'on', 'of', 'and', 'with', 'something', 'someone'}

    to_translate = []
    
    for row in rows:
        row_id, word, meaning = row
        meaning_str = str(meaning).lower()
        words = set(re.findall(r'\b\w+\b', meaning_str))
        
        if (words & eng_keywords) and not (words & id_keywords):
            to_translate.append((row_id, word, meaning))
        elif not (words & id_keywords):
            to_translate.append((row_id, word, meaning))
            
    print(f"Found {len(to_translate)} items to translate.")
    
    def process_item(item):
        row_id, word, meaning = item
        # To make translation better, if it starts with "to ", maybe keep it or just translate directly
        translated = translate_text(meaning)
        return (translated, row_id, meaning)

    updated_count = 0
    # Process in batches to avoid overwhelming and to commit periodically
    batch_size = 500
    for i in range(0, len(to_translate), batch_size):
        batch = to_translate[i:i+batch_size]
        updates = []
        with ThreadPoolExecutor(max_workers=5) as executor:
            results = executor.map(process_item, batch)
            
            for res in results:
                translated, row_id, original = res
                if translated and translated.lower() != original.lower():
                    updates.append((translated, row_id))
                    
        if updates:
            cursor.executemany("UPDATE content_vocab SET meaning = ? WHERE id = ?", updates)
            conn.commit()
            updated_count += len(updates)
            print(f"Committed {len(updates)} updates (Total: {updated_count})")
            
        time.sleep(1) # cool down between batches

    conn.close()
    print(f"Finished! Total updated: {updated_count}")

if __name__ == '__main__':
    main()
