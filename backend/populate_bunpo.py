import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from content.models import Grammar, JLPTLevel

def run():
    grammar_data = [
        {
            "title": "~te imasu (~ています)",
            "structure": "Verb (Te-form) + imasu",
            "explanation": "Menyatakan tindakan yang sedang berlangsung atau keadaan yang terjadi akibat tindakan sebelumnya.",
            "jlpt_level": JLPTLevel.N5,
            "sentences": [
                {"japanese": "私は今、日本語を勉強しています。", "indonesian": "Saya sekarang sedang belajar bahasa Jepang."},
                {"japanese": "彼は結婚しています。", "indonesian": "Dia sudah menikah (status menikah)."}
            ]
        },
        {
            "title": "~masen ka (~ませんか)",
            "structure": "Verb (Masu-form) + masen ka",
            "explanation": "Digunakan untuk mengajak seseoran melakukan sesuatu secara sopan.",
            "jlpt_level": JLPTLevel.N5,
            "sentences": [
                {"japanese": "一緒に映画を見ませんか？", "indonesian": "Maukah Anda menonton film bersama?"},
                {"japanese": "コーヒーを飲みませんか？", "indonesian": "Maukah Anda minum kopi?"}
            ]
        },
        {
            "title": "~to omoimasu (~と思います)",
            "structure": "Plain Form + to omoimasu",
            "explanation": "Menyatakan pendapat atau perkiraan pribadi ('Saya pikir...').",
            "jlpt_level": JLPTLevel.N4,
            "sentences": [
                {"japanese": "明日は雨が降ると思います。", "indonesian": "Saya pikir besok akan hujan."},
                {"japanese": "それはいいアイデアだと思います。", "indonesian": "Saya pikir itu ide yang bagus."}
            ]
        }
    ]

    print("Starting Bunpo population...")
    for data in grammar_data:
        g, created = Grammar.objects.get_or_create(
            title=data["title"],
            defaults={
                "structure": data["structure"],
                "explanation": data["explanation"],
                "jlpt_level": data["jlpt_level"],
                "sentences": data["sentences"]
            }
        )
        if created:
            print(f"Created Grammar: {g.title}")
        else:
            print(f"Grammar already exists: {g.title}")
    print("Done.")

if __name__ == "__main__":
    run()
