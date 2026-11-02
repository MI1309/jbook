# AI Handoff: JBook Progress dan Crossword TTS

> Dokumen ini adalah titik masuk praktis bagi agen AI yang meneruskan pengembangan. Periksa file dan status Git terkini sebelum mengedit; deskripsi di bawah menangkap kondisi repo saat 2 November 2026.

## Status Singkat

- Backend memakai Django 6 + Django Ninja + `django-ninja-jwt`. Jangan menambahkan `APIView` DRF untuk fitur yang sudah berada di router Ninja tanpa alasan migrasi yang jelas.
- Frontend web memakai Next.js App Router, React, Tailwind CSS, dan Zustand.
- Dashboard personal dan API statistiknya sudah ada. Permintaan dashboard sebelumnya tidak memerlukan implementasi duplikat; komponen dan endpoint ditemukan dalam repo lalu divalidasi.
- Commit TTS terbaru adalah `9ccb097` (`perbaikan tts logic`), yang mengacak kata awal di generator Python.
- Isu variasi kata awal pada halaman game `/tts` belum terbukti selesai oleh perubahan backend: game utama membuat grid di JavaScript frontend.
- Tes regresi lokal `backend/learning/test_tts_logic.py` dibuat setelah commit tersebut. Pada pemeriksaan saat penulisan, file ini belum terlacak Git. Jangan menghilangkan atau menganggap sudah dikomit; periksa `git status --short`.

## Peta Repo yang Relevan

| Area | File | Tanggung jawab |
|---|---|---|
| Registrasi API | `backend/core/api.py` | Membuat `NinjaAPI` dan memasang router learning pada prefix `/learning`. |
| URL root Django | `backend/core/urls.py` | Memasang Ninja API pada `/api/`; bukan lokasi route dashboard individual. |
| API learning | `backend/learning/api.py` | Router utama latihan; memasang `learning.views.router` di akhir file. Endpoint TTS Python lama ada di sini. |
| API SRS/dashboard | `backend/learning/views.py` | Route koleksi kosakata, roadmap, dan `/dashboard/stats`. File ini memakai router Django Ninja. |
| Schema response | `backend/learning/serializers.py` | Schema Ninja untuk dashboard, roadmap, SRS, serta vocabulary. |
| Model belajar | `backend/learning/models.py` | `UserVocabulary`, `LearningPathStage`, `UserStageProgress`, `StudyLog`, dan model latihan lainnya. |
| Model poin/profil | `backend/users/models.py` | `UserProfile.total_tts_points`, `User.tts_points`, dan `TTSPointSession`. |
| Halaman overview | `frontend-web/app/dashboard/page.jsx` | Menggabungkan analitik umum dan komponen dashboard personal untuk user login. |
| Widget dashboard personal | `frontend-web/app/dashboard/Dashboard.jsx` | Fetch API JWT, header poin, kartu metrik, roadmap, loading/error/retry. |
| Game route | `frontend-web/app/tts/page.jsx` | Menyusun layar game dari Zustand store dan komponen crossword. |
| Pemilihan materi game | `frontend-web/stores/gameStore.js` | Mengambil vocab/kanji, menyaring mode, lalu meminta generator membuat grid. |
| Generator grid frontend | `frontend-web/utils/gridGenerator.js` | Membentuk word graph, memilih connected component dan seed, mencari penempatan silang. |
| Tes generator frontend | `frontend-web/utils/gridGenerator.test.mjs` | Tes graph, persilangan, mode hiragana, minimum jumlah kata, dan choice bank. |
| Generator legacy backend | `backend/learning/tts_logic.py` | `CrosswordGenerator` untuk endpoint `/learning/tts/generate`. |
| Tes generator backend | `backend/learning/test_tts_logic.py` | Tes regresi pilihan kata pembuka random Python yang baru dibuat. |

## Dashboard Personal

### Route dan autentikasi

Endpoint aktif adalah `GET /api/learning/dashboard/stats`. Implementasi berada di `backend/learning/views.py`, memakai `auth=JWTAuth()`, dan memperoleh pemilik data dari `request.auth`. Router `views.py` digabungkan ke router learning pada akhir `backend/learning/api.py`; seluruh API kemudian dipasang pada `/api/` oleh `backend/core/urls.py`.

Jangan menerima user ID dari query/body sebagai identitas untuk statistik ini. Setiap query status user harus tetap dibatasi pada `request.auth`.

### Bentuk data response

Response schema `UserDashboardStatsSchema` mencakup:

- `username`
- `total_tts_points`: dari `request.auth.profile.total_tts_points`, fallback ke `request.auth.tts_points` bila profile tidak tersedia
- `tts_games_played`: jumlah `request.auth.tts_point_sessions`
- `total_saved`, `mastered`, `learning`, `new`: agregat model `UserVocabulary` milik user
- `daily_activity`: ringkasan 30 hari terakhir
- `activity_breakdown`
- `roadmap`: `stage_code`, `title`, `is_available`, `completion_percentage`

Di database nama kolom progress adalah `UserStageProgress.completion_percent`; API memetakan nilai itu ke `completion_percentage`. Availability stage memakai `LearningPathStage.Availability.AVAILABLE`; stage `beta` tampil tidak tersedia. Migration `learning/migrations/0010_learningpathstage_userstageprogress.py` membuat Hiragana, Katakana, N5, N4, N3, N2, N1; N3-N1 ditandai beta.

### Frontend

`Dashboard.jsx` melakukan fetch ke `${API_URL}/learning/dashboard/stats` dengan `Authorization: Bearer ...`, tanpa cache, menangani 401, error, loading, dan retry. AuthContext saat ini membersihkan access token lama dari localStorage dan memakai cookie `access_token`; widget membaca localStorage sebagai fallback dan cookie sebagai sumber praktis yang sedang digunakan. Jangan ubah penyimpanan token tanpa menyelaraskan `frontend-web/context/AuthContext.js` dan seluruh alur auth.

Widget menampilkan sambutan, poin TTS, koleksi kosakata, jumlah sesi, serta roadmap dengan progress bar untuk stage tersedia dan label “Coming Soon” untuk stage yang belum aktif. Halaman overview memuat widget ini ketika user terautentikasi; overview juga mempunyai analitik latihan terpisah.

### Cakupan test yang sudah ada

`backend/learning/tests.py` memverifikasi user scope, total kosakata, username, poin dan sesi TTS, roadmap, serta aktivitas harian. Jangan memindahkan implementasi ke DRF atau mengubah field response tanpa memperbarui schema, frontend, dan tes bersamaan.

## Crossword TTS: Dua Jalur Generator

Jangan menyamakan dua jalur berikut.

### Jalur halaman game yang dipakai frontend

`frontend-web/app/tts/page.jsx` memakai `useGameStore`. `startGame()` di `frontend-web/stores/gameStore.js` mengambil vocab dan, untuk mode kanji, daftar kanji. Ia menormalisasi reading, memfilter kata berdasar mode, menghapus duplikat kata kanji, lalu memanggil `generateCrosswordGrid()` dari `frontend-web/utils/gridGenerator.js`.

Generator frontend membangun graf: dua kosakata terhubung bila jawabannya berbagi karakter. Ia mengambil connected component terbesar, mengurutkan node berdasarkan derajat koneksi, kemudian mencoba beberapa seed pertama. Seed ditempatkan mendatar di tengah. Dalam mode kanji grid berukuran 20x20 dan generator berhenti setelah minimum lima kata bila opsi `stopAtMinWords` aktif.

`gameStore.js` sudah mengacak pool dengan `validWords.sort(() => Math.random() - 0.5)`, tetapi kemudian pemilihan seed di `gridGenerator.js` memprioritaskan derajat koneksi tertinggi. Kata dengan derajat tertinggi yang unik dapat terus menjadi seed. Comparator random juga bukan algoritme shuffle seragam. Ini kandidat utama penyebab kata pertama terasa selalu sama, tetapi reproduksi pada dataset pengguna tetap perlu dipastikan.

**Pekerjaan lanjutan yang disarankan:** buat variasi seed yang terkontrol di generator frontend (misalnya pilih secara acak dari kelompok kandidat seed dengan skor/derajat dekat maksimum, jangan mengorbankan konektivitas), dan ganti shuffle dengan Fisher-Yates bila masih diperlukan. Tambahkan test di `gridGenerator.test.mjs` yang menunjukkan seed bisa berbeda pada input yang sama dengan RNG terkontrol, sementara grid tetap memiliki minimal lima kata valid dan persilangan nyata. Jangan hanya mengubah endpoint Python karena bukan jalur game utama.

### Endpoint legacy Python

`GET /api/learning/tts/generate` di `backend/learning/api.py` mengambil `Vocab` dengan random ordering, kemudian menjalankan `CrosswordGenerator` dari `backend/learning/tts_logic.py` beberapa kali untuk memilih grid yang paling padat. Commit `9ccb097` membuat generator ini menyaring kata kosong/lebih panjang dari grid serta memilih pembuka acak dari kandidat dengan panjang mendekati maksimum.

Tes `backend/learning/test_tts_logic.py` mengontrol `random.choice` untuk memverifikasi pilihan kata pertama. Tes ini hanya membuktikan perilaku Python; ia bukan tes untuk `/tts` frontend.

## Validasi yang Tercatat

Pada sesi pengembangan 2 November 2026:

```bash
cd backend
python manage.py test learning.test_tts_logic
python manage.py test learning.tests learning.test_tts_logic
```

Hasil terakhir: 13 tes lulus, termasuk tes endpoint dashboard dan tes regresi generator Python. ESLint terarah untuk `frontend-web/app/dashboard/Dashboard.jsx` juga lulus. Tes generator JavaScript belum dijalankan dalam sesi pencatatan ini; jalankan dari folder frontend:

```bash
cd frontend-web
npm run test:grid
npm run lint -- app/dashboard/Dashboard.jsx
```

Saat mengerjakan pemilihan seed frontend, jalankan `npm run test:grid` dan lint file JavaScript yang disentuh; jalankan build hanya jika perubahan berdampak pada integrasi yang lebih luas.

## Checklist Agen Berikutnya

1. Jalankan `git status --short` dan baca diff sebelum mengedit. Ada tes Python baru yang perlu dipertahankan.
2. Reproduksi keluhan kata awal di mode Kanji pada halaman `/tts`; identifikasi seed yang benar-benar ditampilkan pertama, bukan hanya clue list backend.
3. Implementasikan randomisasi yang tetap mempertahankan kualitas koneksi crossword di `frontend-web/utils/gridGenerator.js` dan/atau pemanggil `gameStore.js`.
4. Tambahkan tes frontend deterministik di `frontend-web/utils/gridGenerator.test.mjs`; pastikan variasi dan kualitas grid keduanya diuji.
5. Jalankan tes frontend terkait dan laporkan jelas apakah `/api/learning/tts/generate` masih dipakai oleh konsumen lain sebelum mengubah/menghapus jalur legacy.
6. Perbarui [catatan perkembangan](perkembangan.md) dan dokumentasi ini dengan hasil reproduksi, perubahan file, tes, serta status deploy. Jangan mengklaim deploy production tanpa bukti.

## Referensi Lanjutan

- [Panduan pengembangan](dev.md)
- [Dokumentasi dashboard pengguna](user_dashboard.md)
- [Dokumentasi API](README.md)
- [Kronologi perkembangan](perkembangan.md)