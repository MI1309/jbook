import os
import sys
import django

# 1. Tentukan root directory dari project Django (~/jbook/backend)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CURRENT_PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

# Daftarkan ke sys.path agar module lokal bisa di-import
if CURRENT_PROJECT_ROOT not in sys.path:
    sys.path.insert(0, CURRENT_PROJECT_ROOT)

# 2. 🌟 DETEKSI OTOMATIS: Cari folder mana yang berisi file settings.py
nama_setting_module = None
for root, dirs, files in os.walk(CURRENT_PROJECT_ROOT):
    if 'settings.py' in files:
        # Ambil nama folder tempat settings.py berada
        nama_folder = os.path.basename(root)
        # Pastikan bukan folder dari virtual environment atau cache
        if nama_folder not in ['site-packages', '.venv', 'venv', 'env', '__pycache__']:
            nama_setting_module = f"{nama_folder}.settings"
            break

if not nama_setting_module:
    # Fallback terakhir kalau gagal deteksi otomatis
    nama_setting_module = "config.settings"

print(f"[jbook-debug] Menggunakan module konfigurasi: {nama_setting_module}")
os.environ.setdefault('DJANGO_SETTINGS_MODULE', nama_setting_module)

# 3. Inisialisasi Django
try:
    django.setup()
except Exception as e:
    print(f"[jbook-error] Gagal setup Django: {str(e)}")
    print("Mencoba fallback mendaftarkan parent directory...")
    PARENT_DIR = os.path.dirname(CURRENT_PROJECT_ROOT)
    if PARENT_DIR not in sys.path:
        sys.path.insert(0, PARENT_DIR)
    django.setup()

from content.models import Kanji

# 4. Tentukan jalur folder 'kanjivg_files' (~/jbook/kanjivg_files)
JBOOK_ROOT = os.path.dirname(CURRENT_PROJECT_ROOT)
PATH_FOLDER_SVG = os.path.join(JBOOK_ROOT, 'kanjivg_files')

def jalankan_importer():
    print("=== MEMULAI IMPORT KANJIVG KE SQLITE ===")
    print(f"Mencari file SVG di jalur: {PATH_FOLDER_SVG}")
    
    daftar_kanji = Kanji.objects.all()
    total_kanji = daftar_kanji.count()
    print(f"Ditemukan {total_kanji} karakter kanji di database SQLite saat ini.")
    
    if total_kanji == 0:
        print("[jbook-warning] Tidak ada data kanji di database. Proses dihentikan.")
        return

    counter_sukses = 0
    
    for kanji in daftar_kanji:
        unicode_hex = hex(ord(kanji.character))[2:].zfill(5)
        nama_file = f"{unicode_hex}.svg"
        path_file = os.path.join(PATH_FOLDER_SVG, nama_file)
        
        if os.path.exists(path_file):
            try:
                with open(path_file, 'r', encoding='utf-8') as f:
                    isi_svg = f.read()
                    
                kanji.svg_data = isi_svg
                kanji.save()
                counter_sukses += 1
                print(f"[{counter_sukses}/{total_kanji}] Berhasil memasukkan SVG untuk: {kanji.character}")
            except Exception as e:
                print(f"Gagal membaca file {nama_file}: {str(e)}")
        else:
            pass # Skip print file tidak ditemukan biar console kamu ga spamming ratusan baris

    print("\n=== PROSES SELESAI ===")
    print(f"Total {counter_sukses} dari {total_kanji} kanji berhasil di-update dengan data SVG.")

if __name__ == '__main__':
    jalankan_importer()