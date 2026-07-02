# JBook - Testing & Deployment Documentation
Panduan resmi untuk memastikan aplikasi bebas bug dan siap rilis!

---

## 📋 Tentang Dokumen Ini
Dokumen ini membantu kamu untuk:
1. Menjalankan pengujian otomatis dan manual untuk meminimalkan bug
2. Deploy backend Django ke server production (contoh: PythonAnywhere)
3. Build dan deploy frontend Next.js web dan Flutter mobile app

---

## 🛠️ Tech Stack yang Digunakan
| Komponen | Teknologi Utama |
|----------|------------------|
| Frontend (Web) | **Next.js 14+** (App Router), React, Tailwind CSS, JavaScript |
| Frontend (Mobile) | **Flutter** (untuk Android/iOS, folder `jbook_mobile/`) |
| Backend | **Django 5+**, Django Ninja REST API |
| Database | **SQLite** (dev), **PostgreSQL** (prod) |
| Hosting (Rekomendasi) | Backend: PythonAnywhere / Vercel Functions / Railway, Frontend: Vercel / Netlify |

---

## 1. Rencana Pengujian (Testing Plan & QA)

### 🧪 Unit Testing (Backend)
Pengujian fungsi logika inti secara otomatis!

#### Contoh Test Cases (Tabel)
| Komponen | File Sumber | Skenario Tes | Input | Hasil yang Diharapkan |
|----------|-------------|--------------|-------|------------------------|
| Konjugasi Kata Kerja | `utils/conjugation.py` | Konjugasi Ichidan verb (taberu) ke masu-form | `word="食べる", reading="taberu", word_type="ichidan"` | Hasil `forms[0].variants.formal.kana` = "たべます" |
| Dekonjugasi | `utils/conjugation.py` | Dekonjugasi "tabemasu" ke bentuk dasar | `input_str="tabemasu"` | Kandidat harus termasuk "taberu" |
| Login | `users/api.py` | Login dengan email dan password benar | `email="test@example.com", password="test123"` | Return JWT access+refresh token dan user data |
| Login (Gagal) | `users/api.py` | Login dengan password salah | `email="test@example.com", password="salah"` | Return error 400 |
| Pencarian dengan Dekonjugasi | `content/api.py` | Cari "tabemasu" → harus menemukan vocab dasar "taberu" | `search="tabemasu"` | Vocab dengan `word="食べる"` atau `reading="taberu"` muncul di hasil |
| Generate Soal | `learning/api.py` | Generate soal latihan level N5 | `level=5, type="kanji", limit=5` | Return 5 soal kanji level N5 |
| Export CSV | `content/admin_api.py` | Export kanji N5 | `level=5` | File CSV dengan header "Character,Meaning,Onyomi,..." |

#### Cara Menjalankan Unit Testing (Backend)
Masuk ke direktori backend, lalu jalankan:
```bash
cd /home/imron/jbook/backend
source venv/bin/activate  # Aktifkan virtual environment
python manage.py test users content learning  # Jalankan semua test
python manage.py test content.tests  # Atau test module tertentu saja
```

#### Menambah Unit Test Baru
Buat file di `[app]/tests.py` (contoh `content/tests.py`):
```python
from django.test import TestCase
from utils.conjugation import deconjugate_verb, conjugate_verb_complete

class ConjugationTests(TestCase):
    def test_deconjugate_masu_form(self):
        candidates = deconjugate_verb("tabemasu")
        self.assertIn("taberu", candidates)
    
    def test_conjugate_ichidan(self):
        result = conjugate_verb_complete("食べる", "taberu", "ichidan")
        self.assertIsNotNone(result)
        forms = {f["name"] for f in result["forms"]}
        self.assertTrue({"Indikatif", "Progresif"}.issubset(forms))
```

---

### 🖥️ UI & Integration Testing (Frontend)
Pastikan interaksi pengguna berjalan lancar!

#### Checklist Manual Testing
- [ ] **Autentikasi**: Bisa register, login (email/password dan Google), logout
- [ ] **Navigasi**: Semua menu di navbar berfungsi (Home, Kanji, Kotoba, Bunpo, Practice)
- [ ] **Pencarian Global**: Cari "tabemasu" → menemukan vocab "食べる"
- [ ] **Detail Kanji**: Buka halaman kanji, klik karakter → animasi stroke berjalan
- [ ] **Latihan**: Jawab soal, lihat skor, buka halaman analitik
- [ ] **Responsive**: Buka di HP (portrait/landscape) dan laptop → semua teks terlihat, tombol bisa diklik
- [ ] **Dark/Light Mode**: Toggle tema → warna berubah sesuai
- [ ] **Offline Mode**: Matikan internet, buka halaman vocab → data cache muncul
- [ ] **Admin Panel**: Login sebagai admin → bisa tambah/edit/hapus kanji/vocab/bunpo

#### Automated Integration Testing (Frontend)
Kamu bisa menambahkan **Playwright** untuk testing otomatis:
```bash
cd /home/imron/jbook/frontend-web
npm install -D @playwright/test
npx playwright install  # Install browser untuk testing
```
Buat test file di `tests/` folder, contoh `tests/home.spec.js`:
```javascript
import { test, expect } from '@playwright/test';

test('homepage has search bar', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await expect(page.getByPlaceholder('Cari topik bahasa Jepang')).toBeVisible();
});
```

---

## 2. Panduan Deployment Backend (Server Rilis)
Contoh deployment ke **PythonAnywhere** (hosting Django yang ramah pemula)!

---

### 📝 Langkah 1: Siapkan Server Production
1. Buat akun di [PythonAnywhere](https://www.pythonanywhere.com/)
2. Buka **Consoles** → Buat **Bash Console**
3. Clone repositori kode kamu ke server:
   ```bash
   git clone https://github.com/[username]/jbook.git  # Ganti dengan repo kamu
   cd jbook/backend
   ```

---

### 🔐 Langkah 2: Konfigurasi Environment (Penting!)
**JANGAN LEWATKAN LANGKAH INI!** Keamanan aplikasi kamu bergantung padanya.

1. Buat virtual environment:
   ```bash
   mkvirtualenv jbook-venv --python=/usr/bin/python3.11
   workon jbook-venv
   ```

2. Install dependensi:
   ```bash
   pip install -r /home/imron/jbook/backend/requirements.txt
   # Tambahkan dependensi production jika perlu:
   pip install gunicorn psycopg2-binary python-dotenv
   ```

3. Buat file `.env` di direktori `backend/` (**JANGAN commit file ini ke Git!**):
   ```env
   # .env (contoh)
   DEBUG=False  # PENTING: Matikan DEBUG di production!
   SECRET_KEY=generate_random_secret_key_here_kurang_dari_50_karakter
   ALLOWED_HOSTS=.pythonanywhere.com,.yourdomain.com
   DATABASE_URL=postgres://username:password@host:port/dbname  # Atau tetap SQLite untuk testing
   CORS_ALLOWED_ORIGINS=https://yourfrontend.vercel.app,https://yourdomain.com
   GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
   ```

   Cara generate `SECRET_KEY`:
   ```bash
   python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
   ```

---

### 🗄️ Langkah 3: Setup Database Production
Gunakan **PostgreSQL** untuk production (lebih stabil dibanding SQLite):
1. Di PythonAnywhere, buka **Databases** → Buat database Postgres baru
2. Update `DATABASE_URL` di `.env` sesuai kredensial yang diberikan
3. Jalankan migrasi database:
   ```bash
   cd /home/imron/jbook/backend
   workon jbook-venv
   python manage.py migrate
   python manage.py createsuperuser  # Buat akun admin pertama
   ```

---

### 🚀 Langkah 4: Konfigurasi Web App di PythonAnywhere
1. Buka **Web** → **Add a new web app**
2. Pilih **Manual configuration** → Pilih versi Python yang sama dengan virtualenv kamu
3. Di bagian **Code**:
   - **Source code**: `/home/[username]/jbook/backend`
   - **Working directory**: `/home/[username]/jbook/backend`
4. Di bagian **Virtualenv**: Masukkan path ke virtualenv kamu (contoh: `/home/[username]/.virtualenvs/jbook-venv`)
5. Di bagian **WSGI configuration file**: Klik link, edit file menjadi seperti ini:
   ```python
   import os
   import sys

   path = '/home/[username]/jbook/backend'
   if path not in sys.path:
       sys.path.append(path)

   os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

   from django.core.wsgi import get_wsgi_application
   application = get_wsgi_application()
   ```
6. Di bagian **Static files**: Tambahkan mapping untuk `/static/` ke path static kamu (contoh: `/home/[username]/jbook/backend/static`)
7. Jalankan `python manage.py collectstatic` di Bash Console untuk menyalin file static ke folder yang benar
8. Klik tombol **Reload** di halaman Web PythonAnywhere!

Backend kamu sekarang bisa diakses di `https://[username].pythonanywhere.com/`!

---

## 3. Panduan Build & Deployment Frontend

---

### 🌐 Frontend Web (Next.js)
Deploy ke **Vercel** (mudah dan gratis untuk Next.js)!

#### Langkah 1: Siapkan Environment Frontend
1. Buat file `.env.production` di `frontend-web/`:
   ```env
   NEXT_PUBLIC_API_URL=https://[username].pythonanywhere.com/api  # Ganti dengan URL backend kamu
   ```
2. Pastikan `NEXT_PUBLIC_` prefix untuk variabel yang bisa diakses di browser!

#### Langkah 2: Deploy ke Vercel (Cara Termudah!)
1. Push kode kamu ke GitHub/GitLab/Bitbucket
2. Buka [Vercel](https://vercel.com/), login, pilih **New Project** → Import repo kamu
3. Di bagian **Environment Variables**, tambahkan semua variabel dari `.env.production`
4. Klik **Deploy**! Tunggu beberapa menit → aplikasi kamu live!

#### Atau Build Manual
Untuk build file production lokal:
```bash
cd /home/imron/jbook/frontend-web
npm install
npm run build  # Menghasilkan folder .next/
npm start  # Jalankan server production di localhost:3000
```

---

### 📱 Frontend Mobile (Flutter)
Build file APK untuk Android!

#### Langkah 1: Setup Environment Flutter
1. Pastikan kamu sudah install Flutter SDK: [Panduan Install Flutter](https://docs.flutter.dev/get-started/install)
2. Buka direktori `jbook_mobile/`:
   ```bash
   cd /home/imron/jbook/jbook_mobile
   flutter doctor  # Cek apakah semua dependensi terinstall
   ```

#### Langkah 2: Konfigurasi Sebelum Build
1. Edit file `jbook_mobile/lib/constants/api_constants.dart` (jika ada):
   ```dart
   class ApiConstants {
     // Ganti dari localhost ke URL production backend kamu!
     static const String baseUrl = 'https://[username].pythonanywhere.com/api';
   }
   ```
2. Edit `pubspec.yaml` → Naikkan versi aplikasi (contoh: `version: 1.0.1+2`):
   ```yaml
   version: 1.0.0+1  # format: [versionName]+[versionCode]
   ```
3. Untuk Android, pastikan `AndroidManifest.xml` di `android/app/src/main/` memiliki permission yang dibutuhkan (contoh: internet):
   ```xml
   <uses-permission android:name="android.permission.INTERNET"/>
   ```

#### Langkah 3: Build APK Release
Jalankan perintah ini di terminal:
```bash
cd /home/imron/jbook/jbook_mobile
flutter clean  # Bersihkan cache build lama
flutter pub get  # Install dependensi
flutter build apk --release  # Build APK release (file di build/app/outputs/flutter-apk/)
```

Untuk build **App Bundle** (untuk upload ke Google Play Store):
```bash
flutter build appbundle --release
```

---

## ✅ Final Checklist Sebelum Rilis!
Pastikan semua ini dicek **sebelum** deploy ke production:
- [ ] `DEBUG=False` di `settings.py`
- [ ] `SECRET_KEY` diubah ke string acak dan aman
- [ ] `ALLOWED_HOSTS` diisi dengan domain production kamu
- [ ] Database sudah di-migrate dan diisi data awal (jika perlu)
- [ ] `CORS_ALLOWED_ORIGINS` di-set dengan URL frontend kamu
- [ ] Semua file static sudah di-collect (di Django: `collectstatic`)
- [ ] Base URL API di frontend sudah diubah ke production URL
- [ ] Logging di-set ke level yang sesuai (tidak debug)
- [ ] Testing manual semua fitur utama (login, search, practice, admin)
- [ ] Backup database sebelum deploy perubahan besar!

---

## 📞 Troubleshooting Umum
| Masalah | Solusi |
|---------|--------|
| Error 500 di PythonAnywhere | Lihat log error di **Web** tab → **Error log** |
| Frontend tidak bisa akses backend | Cek setting CORS di `core/settings.py` dan tambahkan domain frontend ke `CORS_ALLOWED_ORIGINS` |
| Halaman Admin Django CSS hilang | Jalankan `python manage.py collectstatic` dan pastikan path static di PythonAnywhere sudah benar |
| Flutter build gagal | Coba `flutter clean`, lalu `flutter pub get`, lalu build ulang |

---

Selamat mencoba! 🚀 Jika ada masalah, cek dokumentasi resmi framework yang kamu gunakan atau tanyakan di komunitas!
