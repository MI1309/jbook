import sqlite3
import re

conn = sqlite3.connect('db.sqlite3')
cursor = conn.cursor()
cursor.execute("SELECT id, word, meaning FROM content_vocab")
rows = cursor.fetchall()

id_keywords = {'yang', 'di', 'ke', 'dari', 'untuk', 'sebuah', 'dengan', 'saya', 'kamu', 'dia', 'mereka', 'kita', 'kami', 'ini', 'itu', 'bisa', 'akan', 'sudah', 'telah', 'dan', 'atau', 'tetapi', 'karena', 'buku', 'kucing', 'anjing'}
eng_keywords = {'to', 'the', 'a', 'an', 'is', 'are', 'in', 'on', 'of', 'and', 'with', 'something', 'someone'}

eng_count = 0
for row in rows:
    meaning = str(row[2]).lower()
    words = set(re.findall(r'\b\w+\b', meaning))
    
    # If meaning has some common english words and no common indonesian words, it's likely english
    if (words & eng_keywords) and not (words & id_keywords):
        eng_count += 1
    elif not (words & id_keywords):
        # Could be a single noun like "apple" which doesn't have "the" or "a"
        eng_count += 1

print(f"Potentially English or un-translated items: {eng_count}")
conn.close()
