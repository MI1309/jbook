# Panduan Pengembangan JBook

Dokumen ini menjadi panduan kerja harian untuk memahami, menjalankan, mengubah, menguji, dan merilis sistem JBook. Untuk detail khusus, lihat dokumen terkait di bagian [Referensi](#referensi).

## 1. Gambaran Sistem

JBook menggunakan arsitektur frontend-backend terpisah:

| Bagian | Teknologi | Tanggung jawab |
|---|---|---|
| Backend API | Django 6, Django Ninja, Django Ninja JWT | API JSON, autentikasi, database, admin, materi dan aktivitas belajar |
| Web | Next.js App Router, React, Tailwind CSS | UI publik, halaman materi server-rendered, PWA, dashboard dan latihan |
| Mobile | Expo, React Native | Aplikasi mobile dalam `mobile-app/` |
| Database | SQLite lokal; database produksi berdasarkan `DATABASE_URL` | Menyimpan user, materi, kurikulum, latihan, dan koleksi belajar |
| Web hosting | Vercel | Menyajikan `frontend-web/` |
| Backend hosting | PythonAnywhere | Menjalankan Django melalui WSGI dan virtualenv |

Alur umum request:

```text
Browser / Mobile
      |
      | HTTPS + JSON; JWT untuk endpoint privat
      v
Next.js di Vercel / Expo
      |
      | NEXT_PUBLIC_API_URL
      v
Django Ninja API di PythonAnywhere
      |
      v
Database yang dikonfigurasi backend
```

Frontend web menggunakan `NEXT_PUBLIC_API_URL`, dengan fallback ke `https://japan.pythonanywhere.com/api`. API lokal berjalan di `http://localhost:8000/api`; halaman web lokal biasanya berjalan di `http://localhost:3000`.

## 2. Struktur Kode dan Kepemilikan Modul

### Backend (`backend/`)

- `core/`: settings, URL root, WSGI/ASGI, registrasi Django Ninja.
- `content/`: master konten Kanji, Vocab, Grammar, kurikulum, blog, admin dan API publik.
- `learning/`: generate latihan, attempt, progress, analitik, SRS koleksi vocab, dan StudyLog.
- `users/`: model user, login/register, JWT, profil, reset password, perlindungan email.
- `utils/`: helper bersama seperti konversi kana dan konjugasi.
- `*/migrations/`: perubahan skema yang harus dikomit bersama perubahan model.
- `*/management/commands/`: command operasional/import yang dijalankan eksplisit dengan `manage.py`.

API Django Ninja dirangkai di `core/api.py`, kemudian dipasang ke `/api/` oleh `core/urls.py`. Endpoint learning aktif ditambahkan melalui `learning/api.py`; router vocab SRS dihubungkan dari modul tersebut. `learning/views.py` berisi handler Ninja, bukan Django REST Framework. Proyek tidak memasang DRF sebagai dependency.

### Frontend web (`frontend-web/`)

- `app/`: route Next.js; folder route membentuk URL.
- `components/`: UI yang dikelompokkan per fitur, misalnya `kanji/`, `kotoba/`, `bunpo/`, `practice/`.
- `lib/api.js`: base URL API dan fungsi request/data.
- `lib/cache-store.js`, `lib/offline-db.js`: cache browser dan dukungan offline.
- `context/`, `stores/`: state aplikasi bersama.
- `public/`: gambar, icon, manifest, dan aset publik.

Halaman publik yang membutuhkan SEO sebaiknya memakai Server Component dan metadata Next.js. State interaktif, browser API, dan hooks tetap berada di Client Component.

### Mobile (`mobile-app/`)

Aplikasi Expo menggunakan React Native. Gunakan `npm run start`, `npm run android`, atau `npm run ios` dari direktori ini sesuai kebutuhan platform. Jaga kontrak JSON dan autentikasi API selaras dengan web; jangan mengasumsikan cookie browser tersedia pada aplikasi mobile.

## 3. Setup Lokal

### Backend

Python 3.12+ diperlukan oleh dependency backend saat ini. Jalankan dari root repo:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
cp .env.example .env
```

Isi `.env` lokal minimal:

```env
DEBUG=True
SECRET_KEY=secret-development-lokal
EMAIL_ENCRYPTION_KEY=kunci-development-lokal
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
CSRF_TRUSTED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
DATABASE_URL=
```

Django membaca `backend/.env`. Untuk development, settings menyediakan default lokal saat `DEBUG=True`, tetapi file `.env` lebih eksplisit. Jangan commit rahasia. Terapkan migrasi dan jalankan API:

```bash
python manage.py check
python manage.py migrate
python manage.py runserver
```

API docs tersedia di `http://localhost:8000/api/docs`. Root `/` mengarah ke dokumentasi API.

### Web

Di terminal lain:

```bash
cd frontend-web
npm install
```

Buat `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Jalankan development server:

```bash
npm run dev
```

Buka `http://localhost:3000`. Untuk mengecek build production/PWA lokal:

```bash
npm run build
npm run start
```

### Mobile

```bash
cd mobile-app
npm install
npm run start
```

Pilih target dari Expo CLI. Pastikan konfigurasi base URL API aplikasi mobile menunjuk ke host backend yang bisa dijangkau emulator/perangkat; `localhost` di perangkat fisik bukan komputer developer.

## 4. Pola Pengembangan Fitur

### Backend API

1. Tentukan pemilik data: master materi berada di `content`; status milik user/aktivitas berada di `learning`; akun berada di `users`.
2. Tambahkan atau ubah model di modul pemiliknya.
3. Buat migration dengan `python manage.py makemigrations <app>` dan tinjau file migration.
4. Buat schema request/response menggunakan Django Ninja `Schema` di modul API terkait. Nama file `learning/serializers.py` saat ini menyimpan schema Ninja untuk SRS; itu bukan DRF `ModelSerializer`.
5. Implementasikan route di router modul dan pastikan router terhubung dari `core/api.py` atau router utama yang sesuai.
6. Untuk endpoint privat, gunakan `auth=JWTAuth()` dan ambil identitas dari `request.auth`. Semua query data pribadi wajib difilter dengan user tersebut.
7. Tambahkan tes request sukses, validasi input, akses anonim, dan isolasi antar-user.
8. Jalankan `check`, tes terfokus, lalu `makemigrations --check --dry-run`.

Gunakan `get_object_or_404` untuk lookup detail, `transaction.atomic()` untuk perubahan berpasangan, dan query `select_related`/`prefetch_related` saat response membutuhkan relasi. Batasi panjang search input serta ukuran input list. Jangan menerima ID user dari payload sebagai sumber otoritatif.

### Web/frontend

- Gunakan wrapper request di `frontend-web/lib/api.js` jika tersedia, agar base URL, cache, fallback offline, dan error handling konsisten.
- Pertahankan pola fitur lokal: halaman route di `app/`, UI di `components/<fitur>/`, helper bersama di `lib/`.
- Komponen yang memakai `window`, `localStorage`, event browser, hooks, atau state interaktif harus menjadi Client Component (`'use client'`).
- Untuk halaman detail publik, ambil data pada server bila route sudah dirancang SSR, hasilkan metadata dinamis, dan sediakan keadaan 404 yang benar.
- Jangan simpan access token, password, key enkripsi, atau rahasia backend di variabel yang diawali `NEXT_PUBLIC_`; variabel tersebut dikirim ke browser.

## 5. SRS Flashcard dan Progress Tracker

Implementasi baru menggunakan `content.Vocab` sebagai master kosakata yang sudah ada; jangan membuat tabel master `Vocabulary` duplikat.

### Model data

- `learning.UserVocabulary`: hubungan user-kosakata dengan `status` (`new`, `learning`, `mastered`), `box_level` 0-5, `next_review_date`, `times_reviewed`, timestamps, unique constraint user + vocabulary, dan index user + tanggal review.
- `learning.StudyLog`: agregasi aktivitas per user, jenis aktivitas, dan tanggal. Constraint memastikan satu baris per user/activity/date; jumlah item bertambah secara atomik.
- Model lama `UserProgress` dan `QuizAttempt` tetap ada. SRS kosakata ini terpisah dari generic `UserProgress`; migrasi data lama tidak dilakukan otomatis.

### API SRS

Semua route di bawah memakai prefix `/api/learning`.

| Method | Path | Login | Fungsi |
|---|---|---:|---|
| GET | `/vocabulary?jlpt_level=5&search=...` | Tidak | Cari Vocab, filter JLPT N1-N5 dan word/reading/meaning |
| GET | `/my-vocabulary` | Ya | Daftar koleksi user yang login, detail vocab nested |
| POST | `/my-vocabulary` | Ya | Bookmark dengan body `{"vocabulary_id":"<uuid>"}` |
| PATCH | `/my-vocabulary/{entry_id}` | Ya | Update `status`, `box_level`, `next_review_date` |
| DELETE | `/my-vocabulary/{entry_id}` | Ya | Hapus bookmark milik sendiri |
| POST | `/my-vocabulary/{entry_id}/review` | Ya | Simpan hasil review dengan body `{"correct":true}` |
| GET | `/dashboard/stats` | Ya | Total disimpan, status, aktivitas per hari selama 30 hari |

Kirim token sebagai `Authorization: Bearer <access_token>`. Request dengan body memakai `Content-Type: application/json`. API mengembalikan 401 bila tidak autentikasi; resource koleksi user lain terlihat sebagai 404 untuk mencegah kebocoran keberadaan ID. Bookmark duplikat menghasilkan 409.

### Aturan SRS saat ini

Review benar menaikkan box maksimum 5 dan menjadwalkan interval bertingkat: box 1 = 1 hari, 2 = 3 hari, 3 = 7 hari, 4 = 14 hari, 5 = 30 hari. Pada box 5 status menjadi `mastered`; sebelum itu menjadi `learning`. Jawaban salah mengembalikan box ke 0, menetapkan status `learning`, dan menjadwalkan ulang keesokan harinya. Setiap review menambah `times_reviewed` dan aktivitas harian.

Menambahkan kosakata membuat status `new` dan mencatat satu aktivitas `vocabulary_added`. Update status manual tidak menambah StudyLog. Dashboard sekarang hanya menghitung event penambahan koleksi dan review dari fitur SRS. QuizAttempt lama belum otomatis disinkronkan ke StudyLog; jika tracker harus mencakup semua latihan, tambahkan agregasi dengan kebijakan dan tes yang eksplisit.

### Contoh request

```bash
curl -X POST http://localhost:8000/api/learning/my-vocabulary \
  -H 'Authorization: Bearer ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"vocabulary_id":"00000000-0000-0000-0000-000000000000"}'

curl -X POST http://localhost:8000/api/learning/my-vocabulary/1/review \
  -H 'Authorization: Bearer ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"correct":true}'

curl http://localhost:8000/api/learning/dashboard/stats \
  -H 'Authorization: Bearer ACCESS_TOKEN'
```

Ganti token dan UUID dengan nilai valid dari environment lokal; jangan commit token riil ke dokumentasi atau shell history bersama.

## 6. Database dan Migration

Setiap perubahan model wajib punya migration yang dikomit. Jangan mengedit migration yang sudah diterapkan di production; buat migration baru. Sebelum deployment:

```bash
python manage.py makemigrations --check --dry-run
python manage.py showmigrations
python manage.py migrate --plan
```

Setelah review migration, uji di database lokal/test. Deploy migration ke database yang benar sebelum reload aplikasi. Backup database sebelum migrasi berisiko atau migrasi data. Jangan menjalankan command migrasi terhadap production dari mesin lokal tanpa memastikan `.env`, `DATABASE_URL`, dan target database.

Untuk fitur SRS terkini, migration adalah `learning/migrations/0009_studylog_uservocabulary.py`. Terapkan dengan:

```bash
python manage.py migrate learning
```

atau `python manage.py migrate` untuk semua app yang pending.

## 7. Autentikasi dan Perlindungan Data

- Django custom user ada di `users.User`; autentikasi API memakai JWT dari `django-ninja-jwt`.
- Endpoint privat memakai `JWTAuth`; jangan mengandalkan UI untuk membatasi akses.
- Password di-hash Django (Argon2 tersedia sebagai hasher utama); jangan pernah menyimpan password plaintext.
- Email privat disimpan terenkripsi pada `email_ciphertext`; `email` adalah alias database dan `email_lookup_hash` dipakai untuk pencarian konsisten. `EMAIL_ENCRYPTION_KEY` harus tetap sama dan tersedia pada proses web maupun command.
- Jangan mencetak email, token, password, secret, atau isi payload privat ke log. Command `audit_email_storage` normal hanya menampilkan agregat. Mode `--username ... --reveal` sengaja menampilkan ciphertext dan hasil dekripsi satu akun untuk audit manual; jalankan hanya di console tepercaya.
- Gunakan HTTPS, `DEBUG=False`, `ALLOWED_HOSTS` eksplisit, CORS/CSRF origin allowlist, dan secret environment. Jangan membuka CORS wildcard di production.
- `DATABASE_URL` kosong membuat settings memilih SQLite lokal/default. Sebelum audit atau migrasi, pastikan database yang dipilih benar.

## 8. Testing dan Pemeriksaan Kualitas

### Backend

Jalankan dari `backend/` dengan virtualenv aktif:

```bash
python manage.py check
python manage.py test
python manage.py test learning.tests
python manage.py test learning.tests.VocabularySrsApiTests
python manage.py test users.tests.PrivateEmailTests
python manage.py makemigrations --check --dry-run
```

Tes SRS di `learning/tests.py` meliputi pencarian vocab, add/review, status auth, isolasi user, dan ringkasan 30 hari. Tes lama `learning` harus tetap lulus karena API latihan yang sudah ada tidak boleh terpengaruh.

### Frontend web

Jalankan dari `frontend-web/`:

```bash
npm run lint
npm run test:grid
npm run build
```

Jalankan validasi paling sempit terlebih dahulu saat mengubah fitur kecil; build Next.js dapat lebih mahal daripada lint atau unit test khusus.

### Mobile

Folder `mobile-app` saat ini menyediakan script Expo untuk start, Android, iOS, dan web. Tambahkan/ jalankan tes mobile bila perubahan menyentuh aplikasi ini; jangan menganggap tes web otomatis menguji tampilan native.

### Alur validasi PR/fitur

1. Tulis atau perbarui tes untuk perilaku baru dan batas permission.
2. Jalankan tes fokus pada app/file yang disentuh.
3. Jalankan pemeriksaan sistem serta migration drift bila perubahan menyentuh model.
4. Jalankan lint/build frontend bila mengubah web.
5. Periksa `git diff --check`, diff, dokumentasi, dan status file sebelum selesai.
6. Jangan menghapus perubahan user yang tidak terkait dan jangan commit kecuali diminta.

## 9. Frontend Web dan SEO

- URL halaman publik berada di Next.js; Django menyediakan data API. Jangan membuat halaman HTML materi kedua di Django tanpa keputusan arsitektur yang disengaja.
- Halaman detail materi menggunakan metadata server-side dan structured data; sitemap berada di `frontend-web/app/sitemap.js`, robots di `frontend-web/app/robots.js`.
- Sitemap memakai endpoint Django, termasuk paginasi vocab dan grammar. Setelah mengubah kontrak konten, cek kembali sitemap agar URL valid, tidak duplikat, dan status halaman 200.
- Private routes/dashboard tidak dimasukkan sitemap. `robots.txt` bukan pengganti autentikasi atau otorisasi server.
- Cek HTML response awal untuk title, description, canonical, H1, teks materi, dan JSON-LD sebelum menyatakan perubahan SEO selesai.

## 10. Deployment

### Backend PythonAnywhere

1. Masuk Bash console dan aktifkan virtualenv yang sama dengan konfigurasi **Web → Virtualenv**. Jalankan `which python` untuk memastikan interpreter berasal dari virtualenv, bukan Python system.
2. Dari `backend/`, pasang dependency dengan `python -m pip install -r requirements.txt`. Ini penting karena import `ninja_jwt` memerlukan package `django-ninja-jwt` di interpreter yang menjalankan WSGI.
3. Set `.env` production atau environment variables: `DEBUG=False`, `SECRET_KEY`, `EMAIL_ENCRYPTION_KEY`, host, CORS/CSRF, `FRONTEND_URL`, `BACKEND_URL`, dan `DATABASE_URL` sesuai target.
4. Pastikan virtualenv pada tab Web benar, WSGI path menunjuk ke folder `backend`, dan module WSGI adalah `core.wsgi`.
5. Backup database bila perlu, lalu jalankan `python manage.py check --deploy`, `python manage.py migrate`, dan `python manage.py collectstatic --noinput`.
6. Reload web app. Periksa `/api/ping`, `/api/docs`, CORS preflight, dan error log PythonAnywhere.
7. Untuk SRS, pastikan migration `learning.0009_studylog_uservocabulary` diterapkan.

Jangan mengandalkan shell biasa tanpa virtualenv yang benar. Error `ModuleNotFoundError: No module named 'ninja_jwt'` biasanya menunjukkan package belum dipasang pada interpreter aktif atau PythonAnywhere web app memilih virtualenv yang berbeda.

### Frontend Vercel

1. Deploy project root `frontend-web/` dan gunakan package scripts yang ada.
2. Atur `NEXT_PUBLIC_API_URL` ke base API backend production yang diakhiri `/api`, serta `NEXT_PUBLIC_APP_URL` ke domain frontend canonical.
3. Pastikan backend mengizinkan origin Vercel melalui CORS dan `ALLOWED_HOSTS` cocok dengan domain backend.
4. Setelah deploy, uji halaman, login/API, sitemap, canonical URL, dan browser console.

## 11. Troubleshooting Umum

| Gejala | Pemeriksaan |
|---|---|
| `No module named ninja_jwt` | Aktifkan virtualenv yang dipilih tab Web; jalankan `python -m pip show django-ninja-jwt` dan `python -c 'import ninja_jwt'` pada interpreter yang sama. |
| `EMAIL_ENCRYPTION_KEY` tidak tersedia | Periksa `.env` yang dimuat dan environment web/console; jangan ganti key lama karena email terenkripsi perlu didekripsi. |
| Tidak ada kolom tabel setelah model berubah | Periksa `showmigrations`, lalu jalankan migration pada database yang benar. |
| API 401 | Pastikan token access berlaku dan header memakai `Authorization: Bearer ...`. |
| API 404 pada item koleksi | ID mungkin tidak ada atau milik user berbeda; endpoint sengaja membatasi data ke pemilik token. |
| CORS error | Periksa origin browser persis sama dengan salah satu `CORS_ALLOWED_ORIGINS`, termasuk scheme dan port. |
| Data lokal tidak sama dengan production | Periksa `DATABASE_URL`, `.env`, direktori kerja, dan alias database sebelum audit/migrasi. |
| Frontend tidak terhubung API | Periksa `NEXT_PUBLIC_API_URL` dan restart dev server setelah mengubah `.env.local`. |
| Build/test tidak menemukan module | Pastikan perintah dijalankan di direktori project yang benar dan dependency terpasang untuk environment itu. |

## 12. Referensi

- [Setup backend](backend_setup.md)
- [API integration](api_integration.md)
- [Database schema](database_schema.md)
- [Testing dan deployment](testing_deployment.md)
- [SEO](seo-optimization.md)
- [Security CIA](security-cia.md)
- [Fitur aplikasi](fitur-aplikasi.md)
- [Struktur folder](folder_structure.md)
