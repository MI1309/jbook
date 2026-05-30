import os
import sys
import django

# 1. Tentukan root directory dari project Django (~/jbook/backend)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CURRENT_PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

# Daftarkan ke sys.path agar module lokal bisa di-import
if CURRENT_PROJECT_ROOT not in sys.path:
    sys.path.insert(0, CURRENT_PROJECT_ROOT)

# 2. DETEKSI OTOMATIS: Cari folder mana yang berisi file settings.py
nama_setting_module = None
for root, dirs, files in os.walk(CURRENT_PROJECT_ROOT):
    if 'settings.py' in files:
        nama_folder = os.path.basename(root)
        if nama_folder not in ['site-packages', '.venv', 'venv', 'env', '__pycache__']:
            nama_setting_module = f"{nama_folder}.settings"
            break

if not nama_setting_module:
    nama_setting_module = "config.settings"

print(f"[jbook-debug] Menggunakan module konfigurasi: {nama_setting_module}")
os.environ.setdefault('DJANGO_SETTINGS_MODULE', nama_setting_module)

# 3. Inisialisasi Django dengan Fallback Parent Directory
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

def perbaiki_database_svg():
    print("=== MEMULAI PERBAIKAN & VALIDASI ULANG SVG ===")
    print(f"Mencari file SVG di jalur: {PATH_FOLDER_SVG}")
    
    daftar_kanji = Kanji.objects.all()
    total = daftar_kanji.count()
    counter = 0
    
    for kanji in daftar_kanji:
        # Bersihkan karakter dari spasi tak terlihat atau whitespace sialan
        char_bersih = kanji.character.strip()
        
        if not char_bersih:
            continue
            
        # Ambil karakter pertama saja untuk memastikan tidak membaca string panjang
        char_utama = char_bersih[0]
        
        # Konversi ulang ke kode unicode hex 5 digit yang asli
        unicode_hex = hex(ord(char_utama))[2:].zfill(5)
        nama_file = f"{unicode_hex}.svg"
        path_file = os.path.join(PATH_FOLDER_SVG, nama_file)
        
        if os.path.exists(path_file):
            try:
                with open(path_file, 'r', encoding='utf-8') as f:
                    isi_svg = f.read()
                
                # Overwrite data lama yang salah dengan data baru yang sudah divalidasi
                kanji.svg_data = isi_svg
                kanji.character = char_utama
                kanji.save()
                
                counter += 1
                if char_utama == "刀":
                    print(f"🔥 [KHUSUS] Kanji 刀 sukses di-remap ke file {nama_file}!")
            except Exception as e:
                print(f"Gagal memproses {char_utama}: {str(e)}")

    print(f"\n=== SELESAI! {counter}/{total} Kanji telah diverifikasi ulang dengan benar ===")

if __name__ == '__main__':
    perbaiki_database_svg()