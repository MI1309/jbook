
import os
import django
import json
import random

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from content.models import Vocab, JLPTLevel

# Mock Data for N5/N4 Vocab
initial_vocab = [
    {"word": "私", "reading": "watashi", "meaning": "Saya", "level": 5},
    {"word": "猫", "reading": "neko", "meaning": "Kucing", "level": 5},
    {"word": "犬", "reading": "inu", "meaning": "Anjing", "level": 5},
    {"word": "本", "reading": "hon", "meaning": "Buku", "level": 5},
    {"word": "学校", "reading": "gakkou", "meaning": "Sekolah", "level": 5},
    {"word": "先生", "reading": "sensei", "meaning": "Guru", "level": 5},
    {"word": "学生", "reading": "gakusei", "meaning": "Murid", "level": 5},
    {"word": "食べる", "reading": "taberu", "meaning": "Makan", "level": 5},
    {"word": "飲む", "reading": "nomu", "meaning": "Minum", "level": 5},
    {"word": "行く", "reading": "iku", "meaning": "Pergi", "level": 5},
    {"word": "来る", "reading": "kuru", "meaning": "Datang", "level": 5},
    {"word": "大きい", "reading": "ookii", "meaning": "Besar", "level": 5},
    {"word": "小さい", "reading": "chiisai", "meaning": "Kecil", "level": 5},
    {"word": "新しい", "reading": "atarashii", "meaning": "Baru", "level": 5},
    {"word": "古い", "reading": "furui", "meaning": "Lama / Tua (benda)", "level": 5},
    {"word": "明日", "reading": "ashita", "meaning": "Besok", "level": 5},
    {"word": "今日", "reading": "kyou", "meaning": "Hari ini", "level": 5},
    {"word": "昨日", "reading": "kinou", "meaning": "Kemarin", "level": 5},
    {"word": "家族", "reading": "kazoku", "meaning": "Keluarga", "level": 4},
    {"word": "友達", "reading": "tomodachi", "meaning": "Teman", "level": 5},
    {"word": "勉強", "reading": "benkyou", "meaning": "Belajar", "level": 5},
    {"word": "仕事", "reading": "shigoto", "meaning": "Pekerjaan", "level": 4},
    {"word": "電話", "reading": "denwa", "meaning": "Telepon", "level": 5},
    {"word": "部屋", "reading": "heya", "meaning": "Kamar", "level": 5},
    {"word": "名前", "reading": "namae", "meaning": "Nama", "level": 5},
    {"word": "天気", "reading": "tenki", "meaning": "Cuaca", "level": 5},
    {"word": "言葉", "reading": "kotoba", "meaning": "Kata / Bahasa", "level": 4},
    {"word": "意味", "reading": "imi", "meaning": "Arti", "level": 4},
    {"word": "質問", "reading": "shitsumon", "meaning": "Pertanyaan", "level": 4},
    {"word": "答え", "reading": "kotae", "meaning": "Jawaban", "level": 4},
]

def populate_vocab():
    print(f"Checking existing Vocab...")
    if Vocab.objects.count() > 0:
        print(f"Vocab already exists ({Vocab.objects.count()} items). Skipping initial population.")
        # Optional: Uncomment check below to force update/add
        # return 

    print("Populating Vocab data...")
    count = 0
    for item in initial_vocab:
        vocab, created = Vocab.objects.get_or_create(
            word=item["word"],
            defaults={
                "reading": item["reading"],
                "meaning": item["meaning"],
                "jlpt_level": item["level"]
            }
        )
        if created:
            print(f"Created: {item['word']}")
            count += 1
        else:
            print(f"Exists: {item['word']}")
    
    print(f"Done. Added {count} new items.")

if __name__ == "__main__":
    populate_vocab()
