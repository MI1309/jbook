import sqlite3
import uuid

# Database path
db_path = 'db.sqlite3'

particles = [
    # N5
    {"character": "は (wa)", "meaning": "Penanda Topik", "explanation": "Menunjukkan topik kalimat.", "jlpt_level": 5},
    {"character": "が (ga)", "meaning": "Penanda Subjek", "explanation": "Menunjukkan subjek yang melakukan aksi atau memiliki sifat tertentu.", "jlpt_level": 5},
    {"character": "を (o)", "meaning": "Penanda Objek", "explanation": "Menunjukkan objek langsung dari kata kerja transitif.", "jlpt_level": 5},
    {"character": "に (ni)", "meaning": "Penanda Tujuan / Waktu", "explanation": "Menunjukkan tujuan (ke), waktu spesifik, atau lokasi keberadaan.", "jlpt_level": 5},
    {"character": "へ (e)", "meaning": "Penanda Arah", "explanation": "Menunjukkan arah pergerakan.", "jlpt_level": 5},
    {"character": "で (de)", "meaning": "Penanda Tempat Aksi / Alat", "explanation": "Menunjukkan tempat terjadinya aksi, atau alat/cara melakukan sesuatu.", "jlpt_level": 5},
    {"character": "と (to)", "meaning": "Penanda Teman / Dan", "explanation": "Menunjukkan arti 'dan' atau 'bersama'.", "jlpt_level": 5},
    {"character": "も (mo)", "meaning": "Penanda 'Juga'", "explanation": "Menunjukkan arti 'juga' atau 'pun'.", "jlpt_level": 5},
    {"character": "の (no)", "meaning": "Penanda Kepemilikan", "explanation": "Menghubungkan dua kata benda untuk menyatakan kepemilikan atau modifikasi.", "jlpt_level": 5},
    {"character": "か (ka)", "meaning": "Penanda Tanya", "explanation": "Diletakkan di akhir kalimat untuk menjadikannya pertanyaan.", "jlpt_level": 5},
    # N4
    {"character": "まで (made)", "meaning": "Sampai", "explanation": "Menunjukkan batas waktu atau tempat.", "jlpt_level": 4},
    {"character": "から (kara)", "meaning": "Dari / Karena", "explanation": "Menunjukkan titik awal atau alasan.", "jlpt_level": 4},
    {"character": "より (yori)", "meaning": "Daripada", "explanation": "Digunakan untuk perbandingan.", "jlpt_level": 4},
    {"character": "ほど (hodo)", "meaning": "Sejauh / Kira-kira", "explanation": "Menunjukkan tingkat atau perkiraan.", "jlpt_level": 4},
    {"character": "だけ (dake)", "meaning": "Hanya", "explanation": "Menunjukkan batasan.", "jlpt_level": 4},
    {"character": "しか (shika)", "meaning": "Hanya (negatif)", "explanation": "Digunakan dengan bentuk negatif untuk arti 'hanya'.", "jlpt_level": 4},
    {"character": "ばかり (bakari)", "meaning": "Baru saja / Melulu", "explanation": "Menunjukkan aksi yang baru selesai atau kebiasaan.", "jlpt_level": 4},
]

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

count = 0
for p in particles:
    # Check if exists
    cursor.execute("SELECT id FROM content_particle WHERE character=?", (p["character"],))
    if not cursor.fetchone():
        id_str = uuid.uuid4().hex
        cursor.execute(
            "INSERT INTO content_particle (id, character, meaning, explanation, jlpt_level) VALUES (?, ?, ?, ?, ?)",
            (id_str, p["character"], p["meaning"], p["explanation"], p["jlpt_level"])
        )
        count += 1

conn.commit()
conn.close()

print(f"Successfully inserted {count} particles directly via SQLite.")
