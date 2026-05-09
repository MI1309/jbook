import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from content.models import Kanji, JLPTLevel

def run():
    kanji_data = [
        {
            "character": "日",
            "meaning": "Matahari, Hari",
            "onyomi": ["NICHI", "JITSU"],
            "kunyomi": ["hi", "bi", "ka"],
            "strokes": 4,
            "jlpt_level": JLPTLevel.N5,
            "examples": [
                {"word": "日本", "reading": "Nihon", "meaning": "Jepang"},
                {"word": "日曜日", "reading": "Nichiyoubi", "meaning": "Hari Minggu"},
                {"word": "毎日", "reading": "Mainichi", "meaning": "Setiap hari"}
            ]
        },
        {
            "character": "本",
            "meaning": "Buku, Asal",
            "onyomi": ["HON"],
            "kunyomi": ["moto"],
            "strokes": 5,
            "jlpt_level": JLPTLevel.N5,
            "examples": [
                {"word": "本", "reading": "Hon", "meaning": "Buku"},
                {"word": "山本", "reading": "Yamamoto", "meaning": "Yamamoto (Nama orang)"}
            ]
        },
        {
            "character": "学",
            "meaning": "Belajar",
            "onyomi": ["GAKU"],
            "kunyomi": ["mana-bu"],
            "strokes": 8,
            "jlpt_level": JLPTLevel.N5,
            "examples": [
                {"word": "学生", "reading": "Gakusei", "meaning": "Siswa"},
                {"word": "学校", "reading": "Gakkou", "meaning": "Sekolah"}
            ]
        }
    ]

    print("Starting population...")
    for data in kanji_data:
        k, created = Kanji.objects.get_or_create(
            character=data["character"],
            defaults={
                "meaning": data["meaning"],
                "onyomi": data["onyomi"],
                "kunyomi": data["kunyomi"],
                "strokes": data["strokes"],
                "jlpt_level": data["jlpt_level"],
                "examples": data["examples"]
            }
        )
        if created:
            print(f"Created Kanji: {k.character}")
        else:
            print(f"Kanji already exists: {k.character}")
    print("Done.")

if __name__ == "__main__":
    run()
