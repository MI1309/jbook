"""
Script untuk mengupdate word_type pada semua Vocab di database
menggunakan JMDict melalui library jamdict.
"""

import sqlite3
import json
import sys

try:
    from jamdict import Jamdict
except ImportError:
    print("ERROR: jamdict belum terinstall. Jalankan: pip install jamdict jamdict-data")
    sys.exit(1)

DB_PATH = '/home/imron/jbook/backend/db.sqlite3'

# ----------------------------------------------------------------
# Pemetaan POS tags JMDict -> WordType (model Django)
# Urutan pemetaan penting: yang lebih spesifik didahulukan
# ----------------------------------------------------------------
POS_MAP = [
    # Suru Verb (lebih spesifik dari noun - cek duluan)
    ('noun or participle which takes the aux. verb suru',   'suru'),
    # Verb golongan
    ('Ichidan verb',                                         'ichidan'),
    ('Godan verb',                                           'godan'),
    ("Kuru verb - special class",                            'suru'),   # くる - disamakan suru
    ("irregular nu verb",                                    'godan'),
    # Sifat
    ('adjective (keiyoushi)',                               'i_adj'),   # i-adj
    ('adjectival nouns or quasi-adjectives (keiyodoshi)',   'na_adj'),  # na-adj
    ('no-adjective',                                        'na_adj'),  # no-adj ~ na-adj
    # Keterangan
    ('adverb (fukushi)',                                    'adverb'),
    ('adverb taking the `to\' particle',                    'adverb'),
    # Partikel
    ('particle',                                            'particle'),
    # Akhiran/awalan
    ('noun or verb acting prenominally',                    'suffix'),
    ('suffix',                                              'suffix'),
    ('prefix',                                              'suffix'),
    # Kata ganti
    ('pronoun',                                             'pronoun'),
    # Kata seru
    ('interjection (kandoushi)',                            'interjection'),
    # Kata sambung
    ('conjunction',                                         'conjunction'),
    # Counter
    ('counter',                                             'counter'),
    # Kata benda (paling umum, letakkan di bawah)
    ('noun (common)',                                       'noun'),
    ('noun',                                               'noun'),
]


def detect_word_type(word: str, reading: str) -> str | None:
    """
    Mencari POS (Part of Speech) dari sebuah kata menggunakan JMDict.
    Mengembalikan string WordType atau None jika tidak ditemukan.
    """
    jmd = _get_jmd()
    # Coba cari dengan kata asli dulu
    for lookup_term in [word, reading]:
        if not lookup_term:
            continue
        # Bersihkan kata dari spasi dan tanda kurung
        clean = lookup_term.split('(')[0].split('（')[0].strip().split(' ')[0]
        if not clean:
            continue
        try:
            result = jmd.lookup(clean, strict_lookup=True)
        except Exception:
            continue
        if not result.entries:
            # Coba tanpa strict
            try:
                result = jmd.lookup(clean)
            except Exception:
                continue
        if result.entries:
            # Kumpulkan semua POS dari semua sense
            all_pos = []
            for entry in result.entries[:3]:  # Cek max 3 entry
                for sense in entry.senses:
                    all_pos.extend(sense.pos)
            # Petakan ke WordType kita
            for pos_key, word_type in POS_MAP:
                for pos in all_pos:
                    if pos_key.lower() in pos.lower():
                        return word_type
    return None


# Cache Jamdict instance
_jmd_instance = None
def _get_jmd():
    global _jmd_instance
    if _jmd_instance is None:
        _jmd_instance = Jamdict()
    return _jmd_instance


def main():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Ambil semua vocab yang word_type-nya masih kosong, null, atau 'other'
    cursor.execute("""
        SELECT id, word, reading
        FROM content_vocab
        WHERE word_type IS NULL OR word_type = '' OR word_type = 'other'
        ORDER BY jlpt_level DESC, word
    """)
    rows = cursor.fetchall()
    total = len(rows)
    print(f"Ditemukan {total} kata yang perlu dikategorikan...")

    updated = 0
    not_found = 0
    type_counts = {}

    for i, (vid, word, reading) in enumerate(rows):
        if (i + 1) % 100 == 0:
            print(f"  Progress: {i+1}/{total} ({updated} diperbarui, {not_found} tidak ditemukan)...")

        word_type = detect_word_type(word, reading)

        if word_type:
            cursor.execute(
                "UPDATE content_vocab SET word_type = ? WHERE id = ?",
                (word_type, vid)
            )
            updated += 1
            type_counts[word_type] = type_counts.get(word_type, 0) + 1
        else:
            # Jika tidak terdeteksi oleh JMDict, biarkan (atau set ke 'other' jika sebelumnya null)
            cursor.execute(
                "UPDATE content_vocab SET word_type = 'other' WHERE id = ? AND (word_type IS NULL OR word_type = '')",
                (vid,)
            )
            not_found += 1

        # Commit setiap 50 agar tidak kehilangan progress kalau error
        if (i + 1) % 50 == 0:
            conn.commit()

    conn.commit()
    conn.close()

    print(f"\n=== SELESAI ===")
    print(f"Total diproses : {total}")
    print(f"Berhasil diupdate: {updated}")
    print(f"Tidak ditemukan (other): {not_found}")
    print(f"\nDistribusi tipe kata:")
    for wt, count in sorted(type_counts.items(), key=lambda x: -x[1]):
        print(f"  {wt}: {count}")


if __name__ == '__main__':
    main()
