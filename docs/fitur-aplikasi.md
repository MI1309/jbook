# Inventaris Fitur JBook

Dokumen ini mencatat fitur yang ditemukan pada source code backend dan client JBook. Daftar ini adalah peta implementasi, bukan jaminan bahwa setiap fitur sedang aktif di production. Untuk endpoint yang perubahan autentikasinya berbeda, lihat catatan akses di bagian Backend.

## Arsitektur Singkat

- Backend: Django + Django Ninja. API utama dipasang di `/api/` dengan router `/auth`, `/content`, `/learning`, dan `/admin`; dokumentasi OpenAPI tersedia di `/api/docs`.
- Web: Next.js App Router di `frontend-web/`, termasuk PWA.
- Mobile Flutter: aplikasi di `jbook_mobile/` dengan layar materi, latihan, akun, dan sebagian panel admin.
- Expo React Native: `mobile-app/` masih berupa starter screen dan belum memiliki fitur JBook yang terimplementasi.

## Backend

### Akun dan autentikasi

- Registrasi akun dan login menggunakan username atau email beserta password.
- Login menggunakan Google ID token.
- Endpoint profil pengguna aktif (`/auth/me`).
- Reset password melalui tautan email dan alur OTP: meminta reset, verifikasi OTP, lalu menetapkan password baru.
- JWT access/refresh token dan rate limit pada endpoint autentikasi.
- Implementasi: [`backend/users/api.py`](../backend/users/api.py), konfigurasi: [`backend/core/settings.py`](../backend/core/settings.py).

### Materi publik

- Kanji: daftar berpaginasi, pencarian/filter (termasuk level JLPT dan radical), detail, sitemap, dan pengaturan visibilitas level.
- Kotoba/kosakata: daftar berpaginasi, pencarian/filter, detail, kosakata acak, audio per item, dan visibilitas level.
- Bunpo/grammar: daftar, pencarian/filter berdasarkan level atau chapter, serta detail pola dan contoh.
- Pengumuman: daftar pengumuman publik yang aktif.
- Blog: daftar dan detail artikel yang dipublikasikan.
- Text-to-speech dari teks serta terjemahan Jepang-Indonesia dan pembuatan furigana untuk kosakata.
- Saran konten, dengan tautan untuk menyetujui atau menolak saran.
- Modul latihan kustom yang dipublikasikan: daftar, detail, pertanyaan, dan pengiriman jawaban.
- Implementasi: [`backend/content/api.py`](../backend/content/api.py).

### Pembelajaran dan progres

- Generator soal latihan untuk Kanji, Kotoba, Bunpo, Kana, dan partikel, dengan pilihan level, jumlah, serta konfigurasi yang didukung API.
- Generator latihan Minna no Nihongo dengan pilihan buku, chapter, tipe soal, dan batas jumlah soal.
- Generator TTS grid/crossword.
- Doukai: jumlah passage, daftar passage, detail bacaan, dan data soal pemahaman.
- Pengiriman hasil latihan terautentikasi dan penyimpanan percobaan/progres.
- Analytics latihan, termasuk ringkasan akurasi, level, kesalahan, dan statistik Kakitori yang disediakan API.
- Reset progres/percobaan latihan.
- Ekspor dan impor data latihan pengguna.
- Implementasi: [`backend/learning/api.py`](../backend/learning/api.py), model: [`backend/learning/models.py`](../backend/learning/models.py).

### Operasi Kotoba tambahan

- Membuat, memperbarui, dan menghapus kosakata.
- Sinkronisasi kosakata batch dan impor JSON.
- Catatan akses: beberapa endpoint write di `content/api.py` menggunakan bearer authentication, tetapi bukan semuanya memeriksa role admin/staff. Periksa implementasi terbaru sebelum menganggap aksesnya admin-only.

### Administrasi konten

- Dashboard statistik admin dan pencarian lintas konten.
- CRUD Kanji, Kotoba, Bunpo/grammar, blog, pengumuman, modul kustom, dan pertanyaan modul.
- Upload Excel untuk memasukkan pertanyaan ke modul kustom.
- Pengelolaan lampiran/media: upload, daftar, dan hapus.
- Pengaturan visibilitas level Kanji dan Kotoba.
- Pencarian serta penghapusan data duplikat Kanji/Kotoba.
- Ekspor CSV Kanji, Bunpo/grammar, Kotoba, dan partikel.
- Implementasi: [`backend/content/admin_api.py`](../backend/content/admin_api.py). Endpoint admin menggunakan `AdminAuth`.

## Frontend Web

### Halaman publik dan belajar

- Home dengan pencarian/akses cepat ke materi.
- Katalog dan halaman detail Kanji, Kotoba, dan Bunpo.
- Form tambah Kanji dan Bunpo.
- Kana: tabel Hiragana/Katakana dan latihan/animasi penulisan yang tersedia di halaman Kana.
- Latihan umum dengan konfigurasi soal, pemilihan materi/level, pengerjaan, timer, dan pengiriman hasil.
- Latihan modul kustom: katalog dan halaman pengerjaan modul.
- Doukai: daftar bacaan dan halaman detail latihan pemahaman.
- TTS crossword/grid game.
- Blog: daftar artikel dan halaman artikel. (disable dulu)
- Halaman Tentang, Privasi & Keamanan, serta halaman offline.
- Implementasi halaman: folder [`frontend-web/app`](../frontend-web/app).

#### Peta route web

| Route | Fitur |
|---|---|
| `/` | Home dan pencarian/akses cepat materi |
| `/kanji`, `/kanji/[id]`, `/kanji/add` | Katalog, detail, dan form Kanji |
| `/kotoba`, `/kotoba/[id]` | Katalog dan detail kosakata |
| `/bunpo`, `/bunpo/[id]`, `/bunpo/add` | Katalog, detail, dan form Bunpo |
| `/kana` | Materi dan latihan Kana |
| `/practice`, `/practice/custom`, `/practice/custom/[id]` | Latihan umum dan modul kustom |
| `/doukai`, `/doukai/[id]` | Daftar bacaan dan latihan Doukai |
| `/tts` | Permainan TTS crossword/grid |
| `/blog`, `/blog/[slug]` | Daftar dan artikel blog |
| `/about`, `/privacy-security`, `/offline` | Informasi, privasi/keamanan, dan fallback offline |
| `/login`, `/register`, `/forgot-password`, `/reset-password` | Autentikasi dan pemulihan akun |
| `/dashboard`, `/dashboard/levels`, `/dashboard/kakitori`, `/dashboard/mistakes`, `/dashboard/history`, `/dashboard/data` | Ringkasan, analitik, kesalahan, riwayat, dan data latihan |
| `/admin`, `/admin/kanji`, `/admin/kanji/[id]`, `/admin/kotoba`, `/admin/kotoba/[id]` | Dashboard admin serta pengelolaan Kanji/Kotoba |
| `/admin/bunpo`, `/admin/bunpo/[id]`, `/admin/blog`, `/admin/announcements` | Pengelolaan Bunpo, blog, dan pengumuman |
| `/admin/custom-modules`, `/admin/custom-modules/[id]`, `/admin/export` | Modul kustom, soal, dan ekspor |
| `/api/upload` | Route server untuk upload media ke Vercel Blob |
| `/feed.xml` | RSS feed |

### Akun

- UI login, registrasi, lupa password, dan reset password.
- State autentikasi bersama melalui AuthContext; sesi menggunakan token yang dikelola client.
- Frontend: [`frontend-web/context/AuthContext.js`](../frontend-web/context/AuthContext.js), halaman ada di `frontend-web/app/login`, `register`, `forgot-password`, dan `reset-password`.

### Dashboard pengguna

- Ringkasan statistik latihan.
- Akurasi per level JLPT.
- Analisis Kakitori/dikte.
- Daftar kesalahan.
- Riwayat latihan.
- Manajemen data latihan, termasuk impor/ekspor JSON.
- Implementasi: [`frontend-web/app/dashboard`](../frontend-web/app/dashboard).

### Panel admin web

- Dashboard admin dan pencarian/statistik.
- Pengelolaan Kanji, Kotoba, dan Bunpo, termasuk detail/edit, filter, visibilitas, deteksi duplikat, serta ekspor yang tersedia pada halaman terkait.
- Pengelolaan blog dan pengumuman.
- Pengelolaan modul latihan kustom dan pertanyaan, termasuk upload file Excel.
- Ekspor data CSV melalui halaman ekspor.
- Upload media melalui route Next.js `/api/upload` yang memverifikasi pengguna admin/staff ke backend.
- Implementasi: [`frontend-web/app/admin`](../frontend-web/app/admin), route upload: [`frontend-web/app/api/upload/route.js`](../frontend-web/app/api/upload/route.js).

### PWA, cache, dan offline

- Installable web app dengan manifest, ikon, dan service worker.
- Fallback halaman `/offline` saat navigasi gagal.
- Cache API dan penyimpanan IndexedDB untuk fallback baca data yang sudah tersimpan.
- Antrean hasil latihan offline yang disinkronkan saat koneksi kembali.
- Indikator status koneksi.
- Unduhan massal materi offline melalui UI sudah dihapus; fitur ini tidak lagi ditawarkan.
- Implementasi: [`frontend-web/next.config.mjs`](../frontend-web/next.config.mjs), [`frontend-web/lib/offline-db.js`](../frontend-web/lib/offline-db.js), [`frontend-web/lib/offline-queue.js`](../frontend-web/lib/offline-queue.js), dan [`frontend-web/components/common/OfflineIndicator.jsx`](../frontend-web/components/common/OfflineIndicator.jsx).

### Fitur UI bersama

- Navigasi responsif, footer, theme context, konfirmasi navigasi saat latihan aktif, popup pengumuman, notifikasi toast, dan shell yang membedakan area publik dengan admin.
- Implementasi: [`frontend-web/components/common`](../frontend-web/components/common), [`frontend-web/app/layout.jsx`](../frontend-web/app/layout.jsx), dan [`frontend-web/context`](../frontend-web/context).

## Frontend Mobile

### Flutter (`jbook_mobile/`)

- Navigasi utama dengan Home/Dashboard, Kanji, Kotoba, Bunpo, dan Profil.
- Katalog Kanji, kosakata, dan grammar.
- Halaman Kana.
- Setup dan pengerjaan kuis latihan.
- Login, registrasi, lupa password, reset password, dan profil.
- Dashboard pengguna.
- Layar admin yang tersedia untuk dashboard, Kanji, Kotoba, dan Bunpo.
- Service API, sinkronisasi, dan penyimpanan lokal SQLite.
- Implementasi layar: [`jbook_mobile/lib/screens`](../jbook_mobile/lib/screens); service: [`jbook_mobile/lib/services`](../jbook_mobile/lib/services).

### Expo React Native (`mobile-app/`)

- Saat inventaris ini dibuat, `mobile-app/App.tsx` masih menampilkan starter screen Expo. Fitur JBook belum terimplementasi di client ini.

## Catatan Cakupan

- Backend dapat menyediakan fitur yang belum mempunyai halaman pada setiap client. Kehadiran endpoint tidak otomatis berarti tersedia UI web/mobile.
- Daftar ini disusun dari source code dan deklarasi route yang ada. Hak akses, deployment, integrasi pihak ketiga, dan ketersediaan data tetap perlu diverifikasi secara terpisah.
- Perbarui dokumen ini saat menambah atau menghapus kelompok fitur besar.