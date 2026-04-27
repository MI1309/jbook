from django.core.management.base import BaseCommand
from content.models import Kanji
import json
import uuid

class Command(BaseCommand):
    help = 'Populate missing N4 and N5 Kanji with Indonesian translations and examples'

    def handle(self, *args, **options):
        KANJI_DATA = {
            "二": {"meaning": "Dua", "level": 5, "onyomi": ["ジ", "ニ"], "kunyomi": ["ふた", "ふた.つ"], "strokes": 2, "radical": "二",
                  "examples": [{"word": "二つ", "reading": "ふたつ", "meaning": "Dua buah"}, {"word": "二月", "reading": "にがつ", "meaning": "Februari"}]},
            "十": {"meaning": "Sepuluh", "level": 5, "onyomi": ["ジュウ"], "kunyomi": ["とお", "と"], "strokes": 2, "radical": "十",
                  "examples": [{"word": "十", "reading": "じゅう", "meaning": "Sepuluh"}, {"word": "十日", "reading": "とおか", "meaning": "Tanggal 10"}]},
            "会": {"meaning": "Bertemu, Pertemuan", "level": 4, "onyomi": ["カイ", "エ"], "kunyomi": ["あ.う"], "strokes": 6, "radical": "人",
                  "examples": [{"word": "会う", "reading": "あう", "meaning": "Bertemu"}, {"word": "会社", "reading": "かいしゃ", "meaning": "Perusahaan"}]},
            "力": {"meaning": "Kekuatan, Tenaga", "level": 4, "onyomi": ["リョク", "リキ"], "kunyomi": ["ちから"], "strokes": 2, "radical": "力",
                  "examples": [{"word": "力", "reading": "ちから", "meaning": "Kekuatan"}]},
            "勉": {"meaning": "Belajar, Berusaha", "level": 4, "onyomi": ["ベン"], "kunyomi": ["つと.める"], "strokes": 10, "radical": "力",
                  "examples": [{"word": "勉強", "reading": "べんきょう", "meaning": "Belajar"}]},
            "口": {"meaning": "Mulut", "level": 4, "onyomi": ["コウ", "ク"], "kunyomi": ["くち"], "strokes": 3, "radical": "口",
                  "examples": [{"word": "口", "reading": "くち", "meaning": "Mulut"}]},
            "夕": {"meaning": "Sore, Malam", "level": 4, "onyomi": ["セキ"], "kunyomi": ["ゆう"], "strokes": 3, "radical": "夕",
                  "examples": [{"word": "夕方", "reading": "ゆう가타", "meaning": "Sore hari"}]},
            "曜": {"meaning": "Hari (dalam seminggu)", "level": 4, "onyomi": ["ヨウ"], "kunyomi": [], "strokes": 18, "radical": "日",
                  "examples": [{"word": "曜日", "reading": "ようび", "meaning": "Hari"}]},
            "楽": {"meaning": "Nyaman, Senang, Musik", "level": 4, "onyomi": ["ガク", "ラク"], "kunyomi": ["たの.しい"], "strokes": 13, "radical": "木",
                  "examples": [{"word": "音楽", "reading": "おんがく", "meaning": "Musik"}]},
            "犬": {"meaning": "Anjing", "level": 4, "onyomi": ["ケン"], "kunyomi": ["いぬ"], "strokes": 4, "radical": "犬",
                  "examples": [{"word": "犬", "reading": "いぬ", "meaning": "Anjing"}]},
            "田": {"meaning": "Sawah", "level": 4, "onyomi": ["デン"], "kunyomi": ["た"], "strokes": 5, "radical": "田",
                  "examples": [{"word": "田んぼ", "reading": "たんぼ", "meaning": "Sawah"}]},
            "空": {"meaning": "Langit, Kosong", "level": 4, "onyomi": ["クウ"], "kunyomi": ["そら", "あ.く"], "strokes": 8, "radical": "穴",
                  "examples": [{"word": "空", "reading": "そら", "meaning": "Langit"}]},
            "飲": {"meaning": "Minum", "level": 4, "onyomi": ["イン"], "kunyomi": ["の.む"], "strokes": 12, "radical": "食",
                  "examples": [{"word": "飲む", "reading": "のむ", "meaning": "Minum"}]},
            "駅": {"meaning": "Stasiun", "level": 4, "onyomi": ["エキ"], "kunyomi": [], "strokes": 14, "radical": "馬",
                  "examples": [{"word": "駅", "reading": "えき", "meaning": "Stasiun"}]}
        }

        success_count = 0
        for char, info in KANJI_DATA.items():
            kanji, created = Kanji.objects.get_or_create(
                character=char,
                defaults={
                    'id': uuid.uuid4(),
                    'meaning': info['meaning'],
                    'jlpt_level': info['level'],
                    'onyomi': info['onyomi'],
                    'kunyomi': info['kunyomi'],
                    'strokes': info['strokes'],
                    'radical': info['radical'],
                    'examples': info['examples']
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Berhasil menambahkan: {char}'))
                success_count += 1
            else:
                # Update if already exists but might be empty
                kanji.meaning = info['meaning']
                kanji.jlpt_level = info['level']
                kanji.onyomi = info['onyomi']
                kanji.kunyomi = info['kunyomi']
                kanji.strokes = info['strokes']
                kanji.radical = info['radical']
                kanji.examples = info['examples']
                kanji.save()
                self.stdout.write(self.style.WARNING(f'Update data untuk: {char}'))
                success_count += 1

        self.stdout.write(self.style.SUCCESS(f'\nSelesai! {success_count} kanji diproses.'))
