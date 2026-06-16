import sqlite3

def check_db():
    conn = sqlite3.connect('/home/imron/jbook/backend/db.sqlite3')
    cursor = conn.cursor()
    cursor.execute('SELECT jlpt_level, COUNT(*) FROM content_kanji GROUP BY jlpt_level ORDER BY jlpt_level DESC')
    results = cursor.fetchall()
    print("Kanji count in DB by JLPT level:")
    total = 0
    for level, count in results:
        print(f"N{level}: {count}")
        total += count
    print(f"Total Kanji: {total}")
    conn.close()

if __name__ == '__main__':
    check_db()
