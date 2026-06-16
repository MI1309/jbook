import sqlite3

mismatches = {
    '勤': 3, '耳': 3, '処': 3, '忘': 3, '晩': 3,
    '承': 2, '捨': 2, '簡': 2, '装': 2, '諸': 2,
    '劇': 2, '尊': 2, '訓': 2, '敬': 2, '臓': 2,
    '届': 2, '召': 2, '拝': 2, '林': 2, '郵': 2,
    '純': 2, '署': 2, '宇': 2, '紅': 2, '誌': 2,
    '門': 2, '著': 2
}

def sync_levels():
    conn = sqlite3.connect('/home/imron/jbook/backend/db.sqlite3')
    cursor = conn.cursor()
    
    updated = 0
    for char, lvl in mismatches.items():
        cursor.execute('UPDATE content_kanji SET jlpt_level = ? WHERE character = ?', (lvl, char))
        updated += cursor.rowcount
        
    conn.commit()
    conn.close()
    print(f"Successfully synchronized {updated} kanji JLPT levels to match the PDFs.")

if __name__ == '__main__':
    sync_levels()
