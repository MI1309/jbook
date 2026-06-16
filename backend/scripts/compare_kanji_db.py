import pypdf
import os
import sqlite3
import re

pdf_dir = "/home/imron/jbook/data_proses"
db_path = "/home/imron/jbook/backend/db.sqlite3"

def is_kanji(char):
    # Basic CJK Unified Ideographs block
    if len(char) != 1: return False
    return '\u4e00' <= char <= '\u9faf'

def get_pdf_kanji():
    pdf_kanji = {}
    for lvl in [5, 4, 3, 2, 1]:
        pdf_path = os.path.join(pdf_dir, f"KanjiList.N{lvl}.pdf")
        if not os.path.exists(pdf_path):
            continue
        reader = pypdf.PdfReader(pdf_path)
        lvl_kanji = set()
        for page in reader.pages:
            text = page.extract_text()
            lines = text.split('\n')
            for line in lines:
                line = line.strip()
                if not line: continue
                # First non-space character
                first_char = line.split()[0] if line.split() else ''
                # Usually the kanji is just the first character of the line
                # But sometimes 'Kanji  Onyomi...' or something else.
                # Let's just check the first character of the first word
                if len(first_char) >= 1 and is_kanji(first_char[0]):
                    # It's a kanji entry!
                    # Only take the first character because sometimes the word might have punctuation?
                    char = first_char[0]
                    lvl_kanji.add(char)
        pdf_kanji[lvl] = lvl_kanji
        print(f"Extracted {len(lvl_kanji)} kanji for N{lvl} from PDF.")
    return pdf_kanji

def get_db_kanji():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute('SELECT character, jlpt_level FROM content_kanji')
    db_kanji = {}
    for char, level in cursor.fetchall():
        if level not in db_kanji:
            db_kanji[level] = set()
        db_kanji[level].add(char)
    conn.close()
    return db_kanji

def compare():
    pdf_kanji = get_pdf_kanji()
    db_kanji = get_db_kanji()
    
    all_pdf = set()
    for lvl, kset in pdf_kanji.items():
        all_pdf.update(kset)
        
    all_db = set()
    for lvl, kset in db_kanji.items():
        all_db.update(kset)
        
    missing_in_db = all_pdf - all_db
    extra_in_db = all_db - all_pdf
    
    print(f"\nTotal in PDF: {len(all_pdf)}")
    print(f"Total in DB: {len(all_db)}")
    
    print(f"\nMissing in DB ({len(missing_in_db)}): {list(missing_in_db)[:20]}...")
    print(f"Extra in DB ({len(extra_in_db)}): {list(extra_in_db)[:20]}...")
    
    print("\nLevel mismatches:")
    for lvl in [5,4,3,2,1]:
        pdf_lvl = pdf_kanji.get(lvl, set())
        db_lvl = db_kanji.get(lvl, set())
        
        # In PDF for this level, but in DB under different level
        for char in pdf_lvl:
            if char in all_db and char not in db_lvl:
                # Find where it is in DB
                for dl, dk in db_kanji.items():
                    if char in dk:
                        print(f"{char}: PDF N{lvl} -> DB N{dl}")

if __name__ == '__main__':
    compare()
