# Setup Backend JBook

Panduan ini untuk menjalankan Django API JBook secara lokal. Backend berada di folder `backend/`, menggunakan Django Ninja, dan secara default memakai SQLite. Python 3.12 atau lebih baru direkomendasikan karena dependency proyek memakai Django 6.

## Prasyarat

- Python 3.12+
- Git (jika belum meng-clone repository)
- Terminal CMD, PowerShell, atau Bash

## 1. Buka Folder Backend

Dari folder repository:

```cmd
cd backend
```

Pastikan folder saat ini berisi `manage.py` dan `requirements.txt`:

```cmd
dir
```

## 2. Buat dan Aktifkan Virtual Environment

### Windows CMD

```cmd
py -3.12 -m venv venv
venv\Scripts\activate.bat
```

Jika perintah `py -3.12` tidak tersedia, gunakan `python` yang sudah menunjuk ke Python 3.12+:

```cmd
python -m venv venv
venv\Scripts\activate.bat
```

### Windows PowerShell

```powershell
py -3.12 -m venv venv
.\venv\Scripts\Activate.ps1
```

Jika PowerShell menolak aktivasi karena execution policy, gunakan CMD atau ikuti kebijakan keamanan komputer; jangan mengubah execution policy global hanya untuk setup ini.

### Linux / macOS

```bash
python3 -m venv venv
source venv/bin/activate
```

Setelah aktif, biasanya nama environment `(venv)` terlihat di awal prompt terminal. Aktifkan kembali environment ini setiap kali membuka terminal baru untuk bekerja di backend.

## 3. Install Dependencies

Semua platform:

```cmd
python -m pip install --upgrade pip
pip install -r requirements.txt
```

## 4. Buat Konfigurasi Lokal

Backend memuat file `backend/.env`. Salin template lalu buka file tersebut untuk diedit.

### Windows CMD

```cmd
copy .env.example .env
notepad .env
```

### PowerShell

```powershell
Copy-Item .env.example .env
notepad .env
```

### Linux / macOS

```bash
cp .env.example .env
nano .env
```

Ubah nilai terkait development lokal seperti di bawah. Pertahankan variabel lain dari template jika diperlukan.

```env
DEBUG=True
SECRET_KEY=isi_dengan_secret_key_lokal
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
CSRF_TRUSTED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
DATABASE_URL=
```

Generate nilai `SECRET_KEY` dari terminal backend:

```cmd
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Salin hasil command ke `SECRET_KEY` di `.env`. Untuk development, `SECRET_KEY` dapat memakai default lokal dari Django, tetapi lebih baik mengisi key yang dihasilkan sendiri. Jangan gunakan key development pada production dan jangan commit file `.env`.

Dengan `DATABASE_URL` kosong, Django memakai `backend/db.sqlite3`; tidak perlu memasang atau menjalankan PostgreSQL untuk setup lokal. SMTP dan Google OAuth juga opsional. Tanpa kredensialnya, email reset password dan Google sign-in tidak aktif, tetapi backend tetap dapat dijalankan.

## 5. Jalankan Pemeriksaan dan Migrasi

```cmd
python manage.py check
python manage.py migrate
```

Buat akun admin untuk panel Django jika diperlukan:

```cmd
python manage.py createsuperuser
```

## 6. Jalankan API

```cmd
python manage.py runserver
```

Backend berjalan di `http://127.0.0.1:8000`. Django Ninja Swagger UI tersedia di `http://127.0.0.1:8000/api/docs`.

Biarkan terminal backend tetap berjalan. Jalankan frontend di terminal kedua dari root repository:

```cmd
cd frontend-web
npm install
npm run dev
```

Frontend berjalan di `http://localhost:3000`. Pastikan `frontend-web/.env.local` memakai:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Restart server frontend setelah mengubah file env.

## Perintah Backend yang Sering Dipakai

Jalankan dari folder `backend/` dengan virtual environment aktif:

```cmd
python manage.py test
python manage.py test content.tests
python manage.py makemigrations --check --dry-run
python manage.py migrate
```

## Kendala Umum

- **`No module named django`**: aktifkan virtual environment dan jalankan `pip install -r requirements.txt`.
- **`You have unapplied migrations`** atau error tabel belum ada: jalankan `python manage.py migrate`.
- **Frontend mendapat CORS error**: periksa `DEBUG=True` dan `CORS_ALLOWED_ORIGINS` di `backend/.env`, pastikan origin tepat `http://localhost:3000`, lalu restart backend.
- **Port 8000 sedang dipakai**: jalankan `python manage.py runserver 8001`, lalu sesuaikan `NEXT_PUBLIC_API_URL` menjadi `http://localhost:8001/api` dan restart frontend.
- **Jangan jadikan konfigurasi contoh lokal sebagai konfigurasi production**: production wajib memakai `DEBUG=False`, secret key kuat, host eksplisit, dan origin CORS yang sesuai domain deployment. Ikuti [panduan testing dan deployment](testing_deployment.md) untuk deployment.