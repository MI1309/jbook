import sqlite3
import uuid

# Database path
db_path = 'db.sqlite3'

particles = [
    # N5
    {
        "character": "は (wa)", 
        "meaning": "Penanda Topik", 
        "explanation": "Menunjukkan topik kalimat.", 
        "jlpt_level": 5,
        "sentences": [
            {"jp": "私( )学生です。", "id": "Saya adalah siswa.", "answer": "は"}
        ]
    },
    {
        "character": "が (ga)", 
        "meaning": "Penanda Subjek", 
        "explanation": "Menunjukkan subjek yang melakukan aksi atau memiliki sifat tertentu.", 
        "jlpt_level": 5,
        "sentences": [
            {"jp": "猫( )います。", "id": "Ada kucing.", "answer": "が"}
        ]
    },
    {
        "character": "を (o)", 
        "meaning": "Penanda Objek", 
        "explanation": "Menunjukkan objek langsung dari kata kerja transitif.", 
        "jlpt_level": 5,
        "sentences": [
            {"jp": "ご飯( )食べます。", "id": "Makan nasi.", "answer": "を"}
        ]
    },
    {
        "character": "に (ni)", 
        "meaning": "Penanda Tujuan / Waktu", 
        "explanation": "Menunjukkan tujuan (ke), waktu spesifik, atau lokasi keberadaan.", 
        "jlpt_level": 5,
        "sentences": [
            {"jp": "学校( )行きます。", "id": "Pergi ke sekolah.", "answer": "に"},
            {"jp": "七時( )起きます。", "id": "Bangun pada jam 7.", "answer": "に"}
        ]
    },
    {
        "character": "へ (e)", 
        "meaning": "Penanda Arah", 
        "explanation": "Menunjukkan arah pergerakan.", 
        "jlpt_level": 5,
        "sentences": [
            {"jp": "日本( )行きたいです。", "id": "Saya ingin pergi ke Jepang.", "answer": "へ"}
        ]
    },
    {
        "character": "で (de)", 
        "meaning": "Penanda Tempat Aksi / Alat", 
        "explanation": "Menunjukkan tempat terjadinya aksi, atau alat/cara melakukan sesuatu.", 
        "jlpt_level": 5,
        "sentences": [
            {"jp": "はし( )食べます。", "id": "Makan menggunakan sumpit.", "answer": "で"},
            {"jp": "家( )勉強します。", "id": "Belajar di rumah.", "answer": "で"}
        ]
    },
    {
        "character": "と (to)", 
        "meaning": "Penanda Teman / Dan", 
        "explanation": "Menunjukkan arti 'dan' atau 'bersama'.", 
        "jlpt_level": 5,
        "sentences": [
            {"jp": "友達( )話します。", "id": "Berbicara dengan teman.", "answer": "と"}
        ]
    },
    {
        "character": "も (mo)", 
        "meaning": "Penanda 'Juga'", 
        "explanation": "Menunjukkan arti 'juga' atau 'pun'.", 
        "jlpt_level": 5,
        "sentences": [
            {"jp": "これ( )ください。", "id": "Tolong berikan ini juga.", "answer": "も"}
        ]
    },
    {
        "character": "の (no)", 
        "meaning": "Penanda Kepemilikan", 
        "explanation": "Menghubungkan dua kata benda untuk menyatakan kepemilikan atau modifikasi.", 
        "jlpt_level": 5,
        "sentences": [
            {"jp": "私( )本です。", "id": "Buku saya.", "answer": "の"}
        ]
    },
    {
        "character": "か (ka)", 
        "meaning": "Penanda Tanya", 
        "explanation": "Diletakkan di akhir kalimat untuk menjadikannya pertanyaan.", 
        "jlpt_level": 5,
        "sentences": [
            {"jp": "元気です( )？", "id": "Apakah kamu sehat?", "answer": "か"}
        ]
    },
    # N4
    {
        "character": "まで (made)", 
        "meaning": "Sampai", 
        "explanation": "Menunjukkan batas waktu atau tempat.", 
        "jlpt_level": 4,
        "sentences": [
            {"jp": "東京( )行きます。", "id": "Pergi sampai Tokyo.", "answer": "まで"}
        ]
    },
    {
        "character": "から (kara)", 
        "meaning": "Dari / Karena", 
        "explanation": "Menunjukkan titik awal atau alasan.", 
        "jlpt_level": 4,
        "sentences": [
            {"jp": "家( )来ました。", "id": "Datang dari rumah.", "answer": "から"}
        ]
    },
    {
        "character": "より (yori)", 
        "meaning": "Daripada", 
        "explanation": "Digunakan untuk perbandingan.", 
        "jlpt_level": 4,
        "sentences": [
            {"jp": "これ( )あれの方がいいです。", "id": "Daripada ini, yang itu lebih baik.", "answer": "より"}
        ]
    },
    {
        "character": "ほど (hodo)", 
        "meaning": "Sejauh / Kira-kira", 
        "explanation": "Menunjukkan tingkat atau perkiraan.", 
        "jlpt_level": 4,
        "sentences": [
            {"jp": "これ( )難しくないです。", "id": "Tidak sesulit ini.", "answer": "ほど"}
        ]
    },
    {
        "character": "だけ (dake)", 
        "meaning": "Hanya", 
        "explanation": "Menunjukkan batasan.", 
        "jlpt_level": 4,
        "sentences": [
            {"jp": "一つ( )あります。", "id": "Hanya ada satu.", "answer": "だけ"}
        ]
    },
    {
        "character": "しか (shika)", 
        "meaning": "Hanya (negatif)", 
        "explanation": "Digunakan dengan bentuk negatif untuk arti 'hanya'.", 
        "jlpt_level": 4,
        "sentences": [
            {"jp": "これ( )ありません。", "id": "Hanya ada ini (tidak ada yang lain).", "answer": "しか"}
        ]
    },
    {
        "character": "ばかり (bakari)", 
        "meaning": "Baru saja / Melulu", 
        "explanation": "Menunjukkan aksi yang baru selesai atau kebiasaan.", 
        "jlpt_level": 4,
        "sentences": [
            {"jp": "食べた( )です。", "id": "Baru saja makan.", "answer": "ばかり"}
        ]
    },
]

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

count = 0
for p in particles:
    import json
    sentences_json = json.dumps(p.get("sentences", []))
    
    # Check if exists
    cursor.execute("SELECT id FROM content_particle WHERE character=?", (p["character"],))
    row = cursor.fetchone()
    if not row:
        id_str = uuid.uuid4().hex
        cursor.execute(
            "INSERT INTO content_particle (id, character, meaning, explanation, jlpt_level, sentences) VALUES (?, ?, ?, ?, ?, ?)",
            (id_str, p["character"], p["meaning"], p["explanation"], p["jlpt_level"], sentences_json)
        )
        count += 1
    else:
        # Update existing
        cursor.execute(
            "UPDATE content_particle SET sentences=? WHERE id=?",
            (sentences_json, row[0])
        )
        count += 1

conn.commit()
conn.close()

print(f"Successfully inserted {count} particles directly via SQLite.")
