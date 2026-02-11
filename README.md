# JBook - Aplikasi Belajar Bahasa Jepang

Aplikasi ini adalah platform belajar bahasa Jepang yang mencakup Kanji, Bunpo (Tata Bahasa), dan Kotoba (Kosakata), lengkap dengan dukungan PWA (Progressive Web App).

## Struktur Proyek

- **backend/**: DJango + Django Ninja (API Server)
- **frontend-web/**: Next.js + TailwindCSS (Web Client & PWA)
- **mobile-app/**: Expo (React Native) - *Dalam pengembangan*

## Cara Menjalankan Aplikasi

### Prasyarat
- Python 3.10 ke atas
- Node.js 18 ke atas
- PostgreSQL (Opsional, saat ini menggunakan SQLite default)

### 1. Menjalankan Backend (API)

```bash
cd backend

# 1. Buat virtual environment (jika belum)
python3 -m venv venv

# 2. Aktifkan virtual environment
# Linux/Mac:
source venv/bin/activate
# Windows:
# venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Jalankan migrasi database
python manage.py migrate

# 5. Jalankan server
python manage.py runserver
```

Server backend akan berjalan di `http://localhost:8000`.
Dokumentasi API (Swagger UI) dapat diakses di `http://localhost:8000/api/docs`.

### 2. Menjalankan Frontend (Web)

```bash
cd frontend-web

# 1. Install dependencies
npm install

# 2. Jalankan mode development
npm run dev
```

Aplikasi web akan berjalan di `http://localhost:3000`.

### 3. Build untuk Production (PWA)

Untuk menguji fitur PWA (Install & Offline), Anda harus menjalankan build production:

```bash
cd frontend-web
npm run build
npm run start
```

## Populasi Data Dummy

Jika database masih kosong, Anda bisa mengisi data awal (Kanji & Bunpo) dengan script berikut:

```bash
cd backend
source venv/bin/activate
python populate_kanji_standalone.py
python populate_bunpo.py
```
