# Arsitektur & Logika Utama JBook Frontend

> **Dokumen ini adalah referensi teknis lengkap** untuk semua logika, algoritma, dan alur kerja pada aplikasi JBook (frontend-web Next.js). Diperbarui terakhir: November 2026.

---

## Daftar Isi

1. [Stack Teknologi](#1-stack-teknologi)
2. [Struktur Direktori](#2-struktur-direktori)
3. [Sistem Autentikasi (AuthContext)](#3-sistem-autentikasi-authcontext)
4. [Sistem Tema (ThemeContext)](#4-sistem-tema-themecontext)
6. [Konteks Latihan (PracticeContext)](#6-konteks-latihan-practicecontext)
7. [Lapisan Data & API (lib/api.js)](#7-lapisan-data--api-libapi-js)
10. [Analitik Tamu (lib/local-analytics.js)](#10-analitik-tamu-liblocal-analyticsjs)
11. [Utilitas Teks Jepang (lib/utils.js)](#11-utilitas-teks-jepang-libutilsjs)
13. [Modul Latihan (PracticeRunner)](#13-modul-latihan-practicerunner)
14. [Routing & Halaman Utama](#14-routing--halaman-utama)
15. [Ketergantungan Data Antar Modul](#15-ketergantungan-data-antar-modul)
16. [Alur Data Online](#16-alur-data-online)
17. [Admin Bunpo & Data Editorial](#17-admin-bunpo--data-editorial)

---

## 1. Stack Teknologi

| Layer | Teknologi |
|---|---|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS v4 |
| State Management | React Context API |
| Auth Token | `js-cookie` (HttpOnly-like via Lax SameSite) |
| Data konten | Diambil langsung dari backend; tidak tersedia offline |
| Auth Sosial | Google OAuth via `@react-oauth/google` |
| Wanakana | `wanakana` untuk konversi romaji ↔ hiragana/katakana |
| Backend API | Django Ninja (PythonAnywhere) |

---

## 2. Struktur Direktori

### 2.1 Dokumentasi Spesifik (Deep Dive)
Untuk pemahaman mendalam pada sistem tertentu, silakan baca dokumen berikut:

- 📊 **[Sistem Rating Kesalahan](file:///home/imron/jbook/frontend-web/docs/SISTEM-RATING-KESALAHAN.md)**: Logika penentuan status "Perbaiki/Cukup/Lumayan".
- 💡 **[Logika Saran Belajar](file:///home/imron/jbook/frontend-web/docs/LOGIKA-SARAN-BELAJAR.md)**: Bagaimana algoritma memberikan rekomendasi langkah belajar.
- 📝 **[Logika Sistem Latihan](file:///home/imron/jbook/frontend-web/docs/LOGIKA-SISTEM-LATIHAN.md)**: Alur kuis dari pemilihan soal hingga pengiriman hasil.
- 🔗 **[Logika Relasi Data](file:///home/imron/jbook/frontend-web/docs/LOGIKA-RELASI-DATA.md)**: Mekanisme "Bedah Kanji" dan keterhubungan antar materi.
- 📦 **[Logika Pengelolaan Data](file:///home/imron/jbook/frontend-web/docs/LOGIKA-PENGELOLAAN-DATA-LATIHAN.md)**: Arsitektur penyatuan data untuk efisiensi impor/ekspor.
- ⚙️ **[Logika Sistem Admin](file:///home/imron/jbook/frontend-web/docs/LOGIKA-SISTEM-ADMIN.md)**: Pusat kendali keamanan, manajemen konten, dan ekspor data.

---

### Struktur Folder Frontend

```
frontend-web/
├── app/                    → Route pages (Next.js App Router)
│   ├── layout.jsx          → Root layout: ThemeProvider, AuthProvider, PracticeProvider, ClientShell
│   ├── page.jsx            → Halaman home
│   ├── kanji/              → Halaman daftar & detail Kanji
│   ├── kotoba/             → Halaman daftar & detail Kosakata
│   ├── bunpo/              → Halaman daftar & detail Tata Bahasa
│   ├── practice/           → Halaman konfigurasi + kuis latihan
│   ├── dashboard/          → Dashboard analitik latihan user
│   │   └── history/        → Halaman histori kesalahan lengkap
│   ├── blog/               → Blog artikel
│   ├── login/              → Halaman login
│   ├── register/           → Halaman daftar akun
│   ├── forgot-password/    → Halaman lupa password
│   ├── reset-password/     → Halaman reset password
│   ├── kana/               → Referensi tabel Hiragana/Katakana
│   └── admin/              → Panel admin (akses terbatas)
│
├── components/             → Komponen React reusable
│   ├── Navbar.jsx          → Navigasi utama (Mobile + Desktop)
│   ├── Footer.jsx          → Footer premium (theme-aware)
│   ├── ClientShell.jsx     → Wrapper layout client-side (Navbar + Footer)
│   ├── KanjiCard.jsx       → Kartu item di daftar Kanji
│   ├── KanjiFilter.jsx     → Filter + daftar Kanji dengan paginasi
│   ├── KanjiDetailUI.jsx   → UI detail Kanji (karakter besar, onyomi, kunyomi, contoh)
│   ├── KanjiDetailModal.jsx→ Modal wrapper untuk KanjiDetailUI
│   ├── KotobaFilter.jsx    → Filter + daftar Kosakata
│   ├── KotobaDetailUI.jsx  → UI detail Kosakata (bedah kanji, arti, JLPT)
│   ├── KotobaDetailModal.jsx→ Modal wrapper untuk KotobaDetailUI
│   ├── GrammarCard.jsx     → Kartu item di daftar Bunpo
│   ├── BunpoFilter.jsx     → Filter + daftar Tata Bahasa
│   ├── BunpoDetailUI.jsx   → UI detail Tata Bahasa (struktur, penjelasan, contoh)
│   ├── BunpoDetailModal.jsx→ Modal wrapper untuk BunpoDetailUI
│   ├── PracticeConfig.jsx  → Konfigurasi kuis latihan
│   ├── PracticeRunner.jsx  → Mesin kuis latihan (soal, timer, hasil)
│   └── ResetProgressButton.jsx → Tombol reset progres latihan
│
├── context/
│   ├── AuthContext.js      → State auth global (login, logout, refresh token)
│   ├── ThemeContext.js     → State tema global (light/dark)
│   └── PracticeContext.js  → Flag sedang-latihan global
│
└── lib/
    ├── api.js              → Pemanggilan API online dan normalisasi response
    ├── local-analytics.js  → Analitik latihan untuk mode tamu (localStorage)
    └── utils.js            → Deteksi & ekstraksi karakter Jepang (Kanji, Hiragana, Katakana)
```

---

## 3. Sistem Autentikasi (AuthContext)

**File:** `context/AuthContext.js`

### Token Storage
- Token disimpan di **Cookie** (bukan localStorage) dengan skema:
  - `access_token` → expires 90 hari
  - `refresh_token` → expires 90 hari
  - `SameSite: Lax`, `Secure: true` di production

### Alur `checkUser()` saat aplikasi mount

```
App Mount
    │
    ▼
Ada access_token di Cookie?
    ├─ Ya → fetchUserWithToken(access_token)
    │           ├─ 200 OK → setUser(data) ✓
    │           └─ 401 Expired → refreshAccessToken()
    │                           ├─ Berhasil → fetchUserWithToken(newToken)
    │                           └─ Gagal → doLogout(false) [silent]
    │
    └─ Tidak → Ada refresh_token?
                ├─ Ya → refreshAccessToken() → fetchUserWithToken(newToken)
                └─ Tidak → setLoading(false), user = null [mode tamu]
```

### Metode Auth yang Tersedia

| Fungsi | Endpoint | Deskripsi |
|---|---|---|
| `login(email, password)` | `POST /auth/login` | Login dengan email+password |
| `register(username, email, password)` | `POST /auth/register` | Daftar akun baru |
| `googleLogin(credentialResponse)` | `POST /auth/google` | Login via Google OAuth |
| `forgotPassword(email)` | `POST /auth/password-reset` | Kirim email reset password |
| `resetPassword(uid, token, newPwd)` | `POST /auth/password-reset-confirm` | Konfirmasi reset password |
| `logout()` | — | Hapus cookie, dispatch `auth:logout` event, redirect `/login` |
| `refreshAccessToken()` | `POST /auth/token/refresh` | Refresh access token silently |

### Event Global
- `window.dispatchEvent(new Event('auth:logout'))` — dipakai oleh `PracticeRunner` untuk mencegah session kuis tersimpan saat user logout.

---

## 4. Sistem Tema (ThemeContext)

**File:** `context/ThemeContext.js`

### Logika Inisialisasi

```
useEffect (mount, run sekali)
    │
    ├─ Baca localStorage('theme')
    ├─ Baca system preference: window.matchMedia('prefers-color-scheme: dark')
    ├─ Priority: localStorage > system preference
    ├─ setTheme(initialTheme)
    ├─ toggle class 'dark' di <html>
    └─ setMounted(true)   ← KRITIS: cegah hydration mismatch
```

### `mounted` State

> **Aturan penting:** Selalu cek `mounted` sebelum menerapkan warna berbasis tema.

```jsx
// Pattern yang digunakan di seluruh komponen:
const textColor = !mounted
    ? 'text-black'          // SSR/Hydration default
    : (theme === 'dark' ? 'text-white' : 'text-black');  // Client-side
```

Jika `mounted = false`, komponen merender warna default (light) untuk menghindari flash of wrong theme (FOWT).

### `toggleTheme()`
```
Klik tombol tema
    │
    ├─ Hitung newTheme (kebalikan dari current)
    ├─ setTheme(newTheme)
    ├─ localStorage.setItem('theme', newTheme)
    └─ document.documentElement.classList.toggle('dark', newTheme === 'dark')
```

### F. Sistem Tema (Hitam-Putih)
Dark Mode premium dengan efek Glassmorphism.
- **File Kunci**:
  - `context/ThemeContext.js` (Penyimpan state tema)
  - `app/globals.css` (Definisi variabel warna & animasi premium)

---

## 6. Konteks Latihan (PracticeContext)

**File:** `context/PracticeContext.js`

Menyimpan state global `isPracticing` (boolean). Digunakan untuk menyembunyikan elemen UI tertentu saat kuis sedang berjalan (misal: menyembunyikan tombol navbar tertentu).

---

## 7. Lapisan Data & API (lib/api.js)

**File:** `lib/api.js`  
**Base URL:** `process.env.NEXT_PUBLIC_API_URL` (default: `https://japan.pythonanywhere.com/api`)

### Akses Konten Online

Data Kanji, vocab, grammar, dan latihan diminta langsung dari API. Cache IndexedDB/localStorage untuk penyediaan konten offline dan fallback client-side telah dihapus. Cache in-memory singkat untuk request visibility hanya menghindari request berulang selama sesi; itu bukan penyimpanan offline.

### Fungsi-Fungsi API

#### Konten
| Fungsi | Endpoint | Keterangan |
|---|---|---|
| `getKanjiList(params)` | `GET /content/kanji` | Filter: level, search, radical, limit, page |
| `getKanjiDetail(id)` | `GET /content/kanji/:id` | `null` jika 404 |
| `getGrammarList(params)` | `GET /content/grammar` | Filter: level, search, chapter, limit, page |
| `getGrammarDetail(id)` | `GET /content/grammar/:id` | `null` jika 404 |
| `getVocabList(params)` | `GET /content/vocab` | Filter: level, search, word_type, limit, page |
| `getVocabDetail(id)` | `GET /content/vocab/:id` | `null` jika 404 |
| `getBlogList()` | `GET /content/blog` | Selalu online, no cache |
| `getBlogDetailBySlug(slug)` | `GET /content/blog/:slug` | Selalu online, no cache |

#### Latihan
| Fungsi | Endpoint | Keterangan |
|---|---|---|
| `getPracticeQuestions(params)` | `GET /learning/practice/generate` | Param: limit, level, type |
| `submitPracticeResults(results)` | `POST /learning/practice/submit` | Butuh token auth |
| `getUserAnalytics()` | `GET /learning/practice/analytics` | Butuh token auth (Hingga 50 kesalahan teratas) |
| `resetPracticeProgress()` | `POST /learning/practice/reset` | Butuh token auth |
| `exportPracticeData()` | `GET /learning/practice/export` | Export sebagai JSON |
| `importPracticeData(data)` | `POST /learning/practice/import` | Import dari JSON |

#### Utilitas
| Fungsi | Deskripsi |
|---|---|
| `resolveContentId(type, character)` | Mencari ID kanji/vocab/grammar melalui API untuk navigasi relasi konten |
| `suggestContent(payload)` | Kirim saran konten ke admin |

---

### Data Online

Data materi, detail, latihan, dan analitik akun diambil langsung dari API. API response tidak disimpan di browser untuk penggunaan offline; hasil latihan akun harus berhasil dikirim ke server.

Cache IndexedDB/API persisten dan antrean submit latihan telah dihapus. Browser yang pernah memakai versi lama membersihkan service worker/cache/data legacy saat dibuka; submit latihan akun yang gagal perlu dicoba ulang saat koneksi tersedia.

---

## 10. Analitik Tamu (lib/local-analytics.js)

**File:** `lib/local-analytics.js`  
**Storage Key:** `guest_practice_analytics` (localStorage)

### Struktur Data Tersimpan
```json
{
  "total_attempts": 50,
  "accuracy": 76.4,
  "wrong_stats": [
    { "character": "日", "count": 3, "right_count": 1, "type": "kanji", "status": "Cukup" },
    { "character": "食べる", "count": 2, "count": 1, "type": "vocab", "status": "Lumayan" }
  ]
}
```

### Logika Evaluasi Status (Mistake Priority)
Sistem memberikan label otomatis pada daftar kesalahan untuk membantu user menentukan prioritas belajar:

| Kondisi Salah | Kondisi Benar | Label | Warna |
|---|---|---|---|
| ≥ 4 kali | — | **Perbaiki** | Merah |
| 3 kali | — | **Cukup** | Oranye |
| 2 kali | — | **Lumayan** | Emerald |
| 1 kali | 0 kali | **Lumayan** | Emerald |
| 1 kali | ≥ 1 kali | (Kosong) | — |

> ℹ️ **Note**: Logika ini diimplementasikan identik di backend (`learning/api.py`) untuk user login dan di frontend (`lib/local-analytics.js`) untuk tamu.

### Algoritma `saveGuestResults(newResults)`

```
1. Baca data analytics saat ini (atau default 0)
2. Hitung:
   - prevCorrect = round((accuracy/100) * total_attempts)  [rekonstruksi dari persentase]
   - newTotal = prevTotal + newResults.length
   - newCorrect = prevCorrect + newResults.filter(is_correct).length
   - newAccuracy = (newCorrect / newTotal) * 100
3. Update wrong_stats:
   - Buat Map keyed by "character|type"
   - Hydrate dari wrong_stats lama (termasuk right_count lama)
   - Untuk setiap hasil baru: 
      - Jika benar: Increment right_count
      - Jika salah: Increment count (salah)
   - Hitung 'status' untuk setiap entry berdasarkan tabel evaluasi di atas
   - Konversi Map → Array → sort by count DESC → slice top 50
4. Migrasi Data Lama:
   - Jika ditemukan entry dengan type: 'bunpo', otomatis diubah menjadi 'grammar' (sinkronisasi).
5. Simpan ke localStorage


> ⚠️ **Catatan**: Akurasi disimpan sebagai persentase (bukan raw count), sehingga rekonstruksi `prevCorrect` bersifat aproksimasi (ada kemungkinan rounding error kecil setelah banyak sesi).

---

## 12. Utilitas Teks Jepang (lib/utils.js)

**File:** `lib/utils.js`

### Unicode Ranges
| Karakter | Range Unicode |
|---|---|
| Kanji (CJK Unified) | `U+4E00–U+9FAF` |
| Kanji (Extension A) | `U+3400–U+4DBF` |
| Hiragana | `U+3040–U+309F` |
| Katakana | `U+30A0–U+30FF` |

### Fungsi

| Fungsi | Input | Output | Contoh |
|---|---|---|---|
| `hasKanji(text)` | String | Boolean | `hasKanji("食べる") → true` |
| `extractKanji(text)` | String | `string[]` (unique) | `extractKanji("東京都") → ['東','京','都']` |
| `getScriptTypes(text)` | String | `string[]` | `getScriptTypes("食べる") → ['kanji','hiragana']` |

---

## 13. Modul Latihan (PracticeRunner)

**File:** `components/PracticeRunner.jsx`

### 13.1 Tipe Soal yang Didukung

| Tipe | Mode Param | Sumber Data | UI |
|------|-----------|-------------|-----|
| Pilihan Ganda | `choice` | API `/practice/generate` atau `/minna/generate` | 4 opsi, pilih 1 |
| Kakitori | `kakitori` | API `/practice/generate` | Input ketik |
| Doukai | `doukai` | API `/minna/generate` | 2 tombol Benar/Salah (Benar/Salah) |
| Fill in the Blank | `fill_blank` | API `/minna/generate` | 4 opsi kata/partikel |
| Context Match | `context_match` | API `/minna/generate` | 4 kalimat JP |

### 13.2 Alur Soal Minna (Doukai / Fill Blank / Context Match)
Sumber data kuis Minna dilayani secara terpisah dari latihan standar JLPT melalui endpoint `/minna/generate` dengan query params pendukung:
- `book` (1, 2, atau 1,2)
- `chapter` (range bab yang dipilih, e.g., 1-25)
- `type` (mode soal)

### 13.3 Alur Lengkap Kuis

#### 1. Inisialisasi Soal

```
Mount PracticeContent
    │
    ├─ Baca URL params: limit, level, type, timer
    ├─ Cek cache version di sessionStorage ('practice_cache_version')
    │   └─ Jika versi lama → hapus session cache
    ├─ Ada savedSession di sessionStorage?
    │   ├─ Ya + valid (< 1 jam, belum selesai) → restore session (soal, index, skor, timer)
    │   └─ Tidak → loadQuestions() dari API
    └─ setIsPracticing(true)
```

#### 2. Pembuatan Soal

Soal latihan dibuat oleh backend melalui `GET /learning/practice/generate`. Frontend menormalisasi pilihan level/tipe, lalu menata alokasi hasil untuk UI. Tidak ada generator soal lokal berbasis IndexedDB.
    │   ├─ Buat options: [correct, ...3 wrong] → shuffle
    │   └─ Format: { id, character, type, options, reading, meaning }
    └─ Return array soal
```

#### 2.1 Normalisasi Tipe Data
Saat merekam attempt, sistem menormalkan tipe data untuk sinkronisasi histori:
- Input `bunpo` → Output `grammar`
- Input `kotoba` → Output `vocab`
- Hal ini memastikan tidak ada data yang terpecah di histori kesalahan.


#### 3. Menjawab Soal

```
User pilih opsi
    │
    ├─ setSelectedOption(option)
    ├─ setIsAnswered(true)
    ├─ Jika benar → increment score
    ├─ Rekam attempt: { question_id, type, character, is_correct, answer_given,
    │                   correct_meaning, correct_answer }
    ├─ Tambah ke results[]
    └─ Timeout 2500ms → auto-advance ke soal berikutnya
        └─ Jika soal terakhir → handleFinish(newResults)
```

#### 4. handleFinish

```
handleFinish(results)
    │
    ├─ Sudah login + Offline → enqueueResults (antrean offline)
    ├─ Sudah login + Online
    │   ├─ submitPracticeResults(results) → POST ke server
    │   └─ Jika gagal → enqueueResults (fallback)
    ├─ Tamu → saveGuestResults(results) → localStorage
    └─ setFinished(true), hapus session cache
```

#### 5. Session Persistence

Setiap perubahan state disimpan ke sessionStorage (key: `guest_practice_session`):
```json
{
  "questions": [...],
  "currentIndex": 3,
  "score": 2,
  "results": [...],
  "timeLeft": 245,
  "timestamp": 1712345678000,
  "finished": false
}
```

Session invalid jika: sudah selesai (`finished: true`) atau lebih dari 1 jam.

#### 6. Timer

```
initialTimer (dari URL param 'timer', dalam detik)
    │
    ├─ Setiap detik: setTimeLeft(prev - 1)
    ├─ timeLeft <= 0 → handleFinish() otomatis
    └─ finished || loading → timer berhenti
```

---

## 14. Routing & Halaman Utama

### Daftar Route

| Route | Tipe | Deskripsi |
|---|---|---|
| `/` | Public | Halaman home |
| `/kanji` | Public | Daftar + filter Kanji |
| `/kanji/[level]/[slug]` | Public | Detail Kanji melalui level dan slug |
| `/kotoba` | Public | Daftar + filter Kosakata |
| `/kotoba/[id]` | Public | Detail Kosakata |
| `/bunpo` | Public | Daftar + filter Tata Bahasa |
| `/bunpo/[id]` | Public | Detail Tata Bahasa |
| `/bunpo/[level]/[slug]` | Public | Detail Bunpo dengan slug tersimpan dan fallback editorial pilot |
| `/kana` | Public | Tabel Hiragana/Katakana referensi |
| `/practice` | Public | Konfigurasi + Runner kuis latihan |
| `/dashboard` | Login Required | Statistik + kesalahan teratas |
| `/dashboard/history` | Login Required | Histori kesalahan lengkap |
| `/blog` | Public | Daftar artikel blog |
| `/blog/[slug]` | Public | Detail artikel |
| `/login` | Public | Halaman login |
| `/register` | Public | Halaman daftar |
| `/forgot-password` | Public | Lupa password |
| `/reset-password` | Public | Reset password via link email |
| `/admin/bunpo` | Admin Only | Daftar Bunpo, visibilitas, form satuan, dan bulk JSON import |
| `/admin/*` | Admin Only | Panel administrasi konten lainnya |

### Detail Bunpo

Route `/bunpo/[level]/[slug]` memuat record grammar dari catalog dan detail API. Slug `Grammar.slug` menjadi kunci URL utama; mapping judul lama masih dipakai sebagai fallback untuk record yang belum memiliki slug. Detail publik menggunakan `sections` dari database bila terisi, dan memakai `BUNPO_SECTIONS_PILOT` sebagai fallback sementara bila sections database kosong.

Record `Grammar` menyimpan field legacy (`title`, `structure`, `explanation`, `chapter`, `jlpt_level`, `sentences`) bersama `slug` unik nullable, `sections` JSON nullable, dan `tags` JSON. Serializer grammar menyertakan field editorial tersebut pada response publik dan admin.

### Import Konten Bunpo Admin

`app/admin/bunpo/page.jsx` menampilkan [`BunpoImportPanel.jsx`](../app/admin/bunpo/BunpoImportPanel.jsx), dengan form satuan dan bulk JSON/file. Frontend memeriksa array, field wajib, section wajib, dan key tidak dikenal sebelum mengirim request ke `POST /api/content/grammar/bulk-import` dengan Bearer token.

Endpoint di `backend/content/api.py` menggunakan schema Pydantic strict (`extra="forbid"`) untuk record dan 10 section editorial. Semua item divalidasi terlebih dahulu; error menyebut indeks data, field/key yang salah, dan saran typo bila tersedia. Batch valid (maksimum 500 record) disimpan secara atomik menggunakan `update_or_create` berdasarkan slug. Endpoint hanya mengizinkan staff/superuser dan sections/tags ikut disimpan ke model `Grammar`.

### Export CSV (Direct)
Halaman Histori menyediakan tombol **Ekspor Csv Histori** yang merender data tabel langsung di client-side menjadi format CSV, mencakup:
- Karakter/Judul materi
- Tipe (Kanji/Kotoba/Bunpo)
- Jumlah Salah (cumulative)
- Status Evaluasi (Lumayan/Cukup/Perbaiki)

---

## 15. Ketergantungan Data Antar Modul

```
AuthContext ──────────────────────→ PracticeRunner
    │           (user state)            (submit results)
    │
    └──────────────────────────────→ DashboardPage
                                        (fetch analytics)

ThemeContext ─────────────────────→ SEMUA komponen
    │           (theme, mounted)        (styling)
    │
PracticeContext ──────────────────→ Navbar
    │           (isPracticing)          (sembunyikan elemen)
    │
lib/api.js
    ├── Backend content API (Kanji, Kotoba, Bunpo)
    └── Backend learning API (latihan dan analytics)

PracticeRunner
    ├── lib/api.js          (getPracticeQuestions, submitPracticeResults)
    └── lib/local-analytics.js (saveGuestResults jika tamu)

KotobaDetailUI
    └── lib/api.js      (resolveContentId → cari detail Kanji melalui API)

Bunpo admin
    ├── app/admin/bunpo/BunpoImportPanel.jsx
    └── POST /api/content/grammar/bulk-import (Bearer JWT admin)
```

---

## 16. Alur Data Online

Data materi dan latihan diminta langsung dari backend. Jika request gagal, UI menampilkan kondisi gagal atau meminta pengguna mencoba lagi; konten API tidak dipulihkan dari IndexedDB/cache offline. Hasil latihan akun juga tidak diantrekan secara lokal ketika submit gagal. `sessionStorage` masih dipakai secara terbatas untuk memulihkan sesi latihan yang sedang berlangsung.

---

## 17. Admin Bunpo & Data Editorial

### Model dan response

`content.Grammar` menyimpan field legacy (`title`, `structure`, `explanation`, `chapter`, `jlpt_level`, `sentences`) serta:

| Field | Bentuk | Kegunaan |
|---|---|---|
| `slug` | Slug unik, nullable | URL publik `/bunpo/<level>/<slug>` dan kunci upsert import. |
| `sections` | JSON nullable | Isi editorial 10 bagian materi Bunpo. |
| `tags` | JSON array | Tag editorial pola Bunpo. |

Migration `0027_grammar_sections_grammar_slug_grammar_tags` menambahkan field tersebut. `serialize_grammar()` menyertakan slug, sections, dan tags pada response content/admin.

### Payload editorial

Setiap `sections` berisi `mainFunction`, `sentencePattern`, `examples`, `comparison`, `nuance`, `coreExplanation`, `commonMistakes`, `faq`, `miniPractice`, dan `conceptMap`. Bentuk field per bagian didokumentasikan dan dinormalisasi di `lib/bunpo-schema.js`. Route detail memakai data database jika tersedia; `BUNPO_SECTIONS_PILOT` menjadi fallback untuk pola pilot lama yang sections-nya belum tersimpan.

### Alur bulk import

1. Admin membuka `/admin/bunpo`; akses halaman diperiksa oleh `app/admin/layout.jsx`.
2. `BunpoImportPanel.jsx` menerima satu record lewat form atau array JSON melalui textarea/file.
3. Frontend memeriksa JSON, array, field wajib, nama section, dan key yang tidak dikenal.
4. Panel mengirim Bearer token ke `POST /api/content/grammar/bulk-import`.
5. Backend memakai Pydantic strict schemas (`extra="forbid"`) dan autentikasi staff/superuser. Maksimum 500 record per batch.
6. Backend memvalidasi semua item sebelum transaksi. Jika ada satu invalid, HTTP 422 mengembalikan error per indeks dan tidak ada record yang berubah.
7. Batch valid dijalankan atomik dengan `update_or_create` berdasarkan slug. Respons berisi jumlah serta status created/updated per slug.

Endpoint bulk berada di `backend/content/api.py`; schema model publik/admin dan serializer juga mengirim field editorial. Panel tetap menggunakan endpoint ini untuk input satuan maupun bulk agar validasi server konsisten.

---

## Panduan Debugging Cepat

### Masalah Auth / Tidak Login
1. Cek cookie `access_token` dan `refresh_token` di DevTools → Application → Cookies
2. Cek console untuk log `[AuthContext]`
3. Jika `401`: refresh token mungkin expired → harus login ulang

### Masalah Request Konten Bunpo
1. Periksa response `GET /api/content/grammar` dan `GET /api/content/grammar/<id>`.
2. Pastikan record memiliki `slug` yang sesuai level; record legacy tanpa slug memakai mapping judul frontend.
3. Jika record belum memiliki `sections`, halaman pilot dapat memakai fallback `BUNPO_SECTIONS_PILOT`.

### Masalah Import Bunpo
1. Pastikan user memiliki `is_staff=True` atau `is_superuser=True` dan cookie `access_token` masih valid.
2. Periksa format JSON serta pesan error per indeks dari `POST /api/content/grammar/bulk-import`.
3. Pastikan semua 10 section ada dan key-nya tepat; satu error membatalkan seluruh batch.

### Masalah Flash of Wrong Theme (FOWT)
1. Pastikan semua komponen menggunakan pola `!mounted ? 'default' : (theme === 'dark' ? ... : ...)`
2. JANGAN gunakan Tailwind `dark:` class untuk elemen kritis text/background
3. `mounted` hanya menjadi `true` setelah `useEffect` pertama berjalan di client

---

*Dokumen ini mencerminkan state kode per November 2026. Perbarui setiap ada perubahan arsitektur signifikan.*
