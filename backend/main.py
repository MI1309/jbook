import os
import sys
import argparse
import json

# Django setup needs to happen before importing models
def setup_django():
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
    import django
    django.setup()

def list_kotoba():
    setup_django()
    from content.models import Vocab
    kotoba = Vocab.objects.all().order_by('-id')[:20] # Show last 20 for brevity
    print(f"Total Kosakata di Database: {Vocab.objects.count()}")
    print("-" * 50)
    for k in kotoba:
        print(f"[{k.id}] {k.word} ({k.reading}) - {k.meaning}")

def add_kotoba(word, meaning):
    setup_django()
    from utils.kotoba_sync import process_new_kotoba
    from content.models import Vocab
    
    data = {
        "word": word,
        "meaning": meaning
    }
    print(f"Memproses '{word}'...")
    processed = process_new_kotoba(data)
    
    vocab, created = Vocab.objects.update_or_create(
        word=processed['word'],
        defaults={
            'reading': processed.get('reading', ''),
            'furigana': processed.get('furigana', ''),
            'meaning': processed.get('meaning', '')
        }
    )
    
    status = "Ditambahkan" if created else "Diupdate"
    print(f"[{status}] {vocab.word}")
    print(f"Furigana: {vocab.furigana}")
    print(f"Arti: {vocab.meaning}")

def sync_kotoba(file_path, skip_existing=False):
    setup_django()
    from utils.kotoba_sync import sync_from_json_file
    
    print(f"Sinkronisasi dari file {file_path}...")
    stats = sync_from_json_file(file_path, skip_existing=skip_existing)
    
    if "error" in stats:
        print(f"ERROR: {stats['error']}")
    else:
        print("Sinkronisasi Selesai!")
        print(f"- Ditambahkan : {stats['added']}")
        print(f"- Diupdate    : {stats['updated']}")
        print(f"- Dilewati    : {stats['skipped']}")
        print(f"- Error       : {stats['errors']}")

def translate_kotoba(text):
    from utils.kotoba_sync import translate_ja_to_id, generate_furigana
    
    print(f"Kata Jepang : {text}")
    furigana = generate_furigana(text)
    print(f"Furigana    : {furigana}")
    meaning = translate_ja_to_id(text)
    print(f"Arti        : {meaning}")

def export_kotoba(format_type):
    setup_django()
    from content.models import Vocab
    
    kotoba = Vocab.objects.all()
    if format_type == "json":
        data = []
        for k in kotoba:
            data.append({
                "id": str(k.id),
                "word": k.word,
                "reading": k.reading,
                "furigana": k.furigana,
                "meaning": k.meaning,
                "word_type": k.word_type,
                "jlpt_level": k.jlpt_level,
                "examples": k.examples
            })
        with open("kotoba_export.json", "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print("Data berhasil diekspor ke kotoba_export.json")
    elif format_type == "csv":
        import csv
        with open("kotoba_export.csv", "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["ID", "Word", "Reading", "Furigana", "Meaning", "Type", "JLPT"])
            for k in kotoba:
                writer.writerow([str(k.id), k.word, k.reading, k.furigana, k.meaning, k.word_type, k.jlpt_level])
        print("Data berhasil diekspor ke kotoba_export.csv")
    else:
        print("Format tidak didukung. Gunakan 'json' atau 'csv'.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="JBook Kotoba Sync & Management Tool")
    subparsers = parser.add_subparsers(dest="command", help="Perintah yang tersedia")

    # Command: list
    parser_list = subparsers.add_parser("list", help="Tampilkan daftar kosakata")

    # Command: add
    parser_add = subparsers.add_parser("add", help="Tambah kosakata baru")
    parser_add.add_argument("--word", required=True, help="Kosakata bahasa Jepang")
    parser_add.add_argument("--meaning", required=False, help="Arti kosakata (opsional, jika kosong akan diterjemahkan otomatis)")

    # Command: sync
    parser_sync = subparsers.add_parser("sync", help="Sinkronkan data dari file JSON")
    parser_sync.add_argument("--file", default="kotoba.json", help="Path ke file JSON lokal")
    parser_sync.add_argument("--skip-existing", action="store_true", help="Lewati kata yang sudah ada di database tanpa mengubahnya")

    # Command: translate
    parser_translate = subparsers.add_parser("translate", help="Terjemahkan teks")
    parser_translate.add_argument("text", help="Teks bahasa Jepang")

    # Command: export
    parser_export = subparsers.add_parser("export", help="Export data")
    parser_export.add_argument("--format", choices=["json", "csv"], default="json", help="Format export (json/csv)")

    args = parser.parse_args()

    if args.command == "list":
        list_kotoba()
    elif args.command == "add":
        add_kotoba(args.word, args.meaning)
    elif args.command == "sync":
        sync_kotoba(args.file, skip_existing=args.skip_existing)
    elif args.command == "translate":
        translate_kotoba(args.text)
    elif args.command == "export":
        export_kotoba(args.format)
    else:
        parser.print_help()
