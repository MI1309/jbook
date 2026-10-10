# JBook - Aplikasi Belajar Bahasa Jepang

Aplikasi ini adalah platform belajar bahasa Jepang yang mencakup Kanji, Bunpo (Tata Bahasa), dan Kotoba (Kosakata), lengkap dengan dukungan PWA (Progressive Web App).

## Struktur Proyek

- **backend/**: DJango + Django Ninja (API Server)
- **frontend-web/**: Next.js + TailwindCSS (Web Client & PWA)
- **mobile-app/**: Expo (React Native) - *Dalam pengembangan*

## Cara Menjalankan Aplikasi

Panduan lengkap setup backend, termasuk perintah Windows CMD, tersedia di [docs/backend_setup.md](docs/backend_setup.md).

### Prasyarat
- Python 3.12 ke atas
- Node.js 18 ke atas
- PostgreSQL (Opsional, saat ini menggunakan SQLite default)

### 1. Menjalankan Backend (API)

Ikuti [Panduan Setup Backend](docs/backend_setup.md) untuk membuat virtual environment, menyiapkan `backend/.env` (termasuk Windows CMD), memasang dependencies, menjalankan migrasi, dan memulai server.

Server backend lokal berjalan di `http://localhost:8000`; dokumentasi API (Swagger UI) ada di `http://localhost:8000/api/docs`.

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
