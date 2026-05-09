import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from content.models import Particle

particles = [
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
]

for p in particles:
    Particle.objects.get_or_create(
        character=p["character"],
        defaults={
            "meaning": p["meaning"],
            "explanation": p["explanation"],
            "jlpt_level": p["jlpt_level"]
        }
    )

print(f"Successfully populated {len(particles)} particles.")
