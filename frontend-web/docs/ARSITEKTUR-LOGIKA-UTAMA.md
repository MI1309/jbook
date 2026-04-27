# Arsitektur & Logika Utama JBook Frontend

> **Dokumen ini adalah referensi teknis lengkap** untuk semua logika, algoritma, dan alur kerja pada aplikasi JBook (frontend-web Next.js). Diperbarui terakhir: April 2026.

---

## Daftar Isi

1. [Stack Teknologi](#1-stack-teknologi)
2. [Struktur Direktori](#2-struktur-direktori)
3. [Sistem Autentikasi (AuthContext)](#3-sistem-autentikasi-authcontext)
4. [Sistem Tema (ThemeContext)](#4-sistem-tema-themecontext)
5. [Konteks Latihan (PracticeContext)](#5-konteks-latihan-practicecontext)
6. [Lapisan Data & API (lib/api.js)](#6-lapisan-data--api-libapiJS)
7. [Sistem Cache (lib/cache-store.js)](#7-sistem-cache-libcache-storeJS)
8. [Database Offline (lib/offline-db.js + IndexedDB)](#8-database-offline-liboffline-dbjs--indexeddb)
9. [Download Offline (lib/offline-download.js)](#9-download-offline-liboffline-downloadjs)
10. [Antrean Offline (lib/offline-queue.js)](#10-antrean-offline-liboffline-queuejs)
11. [Analitik Tamu (lib/local-analytics.js)](#11-analitik-tamu-liblocal-analyticsjs)
12. [Utilitas Teks Jepang (lib/utils.js)](#12-utilitas-teks-jepang-libutilsjs)
13. [Modul Latihan (PracticeRunner)](#13-modul-latihan-practicerunner)
14. [Routing & Halaman Utama](#14-routing--halaman-utama)
15. [Ketergantungan Data Antar Modul](#15-ketergantungan-data-antar-modul)
16. [Alur Prioritas Data (Online vs Offline)](#16-alur-prioritas-data-online-vs-offline)
17. [PWA & Service Worker](#17-pwa--service-worker)

---

## 1. Stack Teknologi

| Layer | Teknologi |
|---|---|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS v4 |
| State Management | React Context API |
| Auth Token | `js-cookie` (HttpOnly-like via Lax SameSite) |
| Offline DB | IndexedDB via custom wrapper (`lib/offline-db.js`) |
| Offline Cache | `localStorage` via `lib/cache-store.js` |
| PWA | `@ducanh2912/next-pwa` + Workbox |
| Auth Sosial | Google OAuth via `@react-oauth/google` |
| Wanakana | `wanakana` untuk konversi romaji ↔ hiragana/katakana |
| Backend API | Django REST Framework (PythonAnywhere) |

---

## 2. Struktur Direktori

### 2.1 Dokumentasi Spesifik (Deep Dive)
Untuk pemahaman mendalam pada sistem tertentu, silakan baca dokumen berikut:

- 📊 **[Sistem Rating Kesalahan](file:///home/imron/jbook/frontend-web/docs/SISTEM-RATING-KESALAHAN.md)**: Logika penentuan status "Perbaiki/Cukup/Lumayan".
- 💡 **[Logika Saran Belajar](file:///home/imron/jbook/frontend-web/docs/LOGIKA-SARAN-BELAJAR.md)**: Bagaimana algoritma memberikan rekomendasi langkah belajar.
- 📝 **[Logika Sistem Latihan](file:///home/imron/jbook/frontend-web/docs/LOGIKA-SISTEM-LATIHAN.md)**: Alur kuis dari pemilihan soal hingga pengiriman hasil.
- 🔗 **[Logika Relasi Data](file:///home/imron/jbook/frontend-web/docs/LOGIKA-RELASI-DATA.md)**: Mekanisme "Bedah Kanji" dan keterhubungan antar materi.
- 📦 **[Logika Pengelolaan Data](file:///home/imron/jbook/frontend-web/docs/LOGIKA-PENGELOLAAN-DATA-LATIHAN.md)**: Arsitektur penyatuan data untuk efisiensi impor/ekspor.
- 📥 **[Logika Download Offline](file:///home/imron/jbook/frontend-web/docs/LOGIKA-DOWNLOAD-OFFLINE.md)**: Proses sinkronisasi database massal ke IndexedDB.
- ⚙️ **[Logika Sistem Admin](file:///home/imron/jbook/frontend-web/docs/LOGIKA-SISTEM-ADMIN.md)**: Pusat kendali keamanan, manajemen konten, dan ekspor data.

---

## 2. Struktur Direktori

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
│   ├── offline/            → Halaman fallback saat offline
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
│   ├── OfflineDownloadModal.jsx → Modal unduh konten untuk offline
│   ├── OfflineIndicator.jsx→ Indikator status koneksi
│   └── ResetProgressButton.jsx → Tombol reset progres latihan
│
├── context/
│   ├── AuthContext.js      → State auth global (login, logout, refresh token)
│   ├── ThemeContext.js     → State tema global (light/dark)
│   └── PracticeContext.js  → Flag sedang-latihan global
│
└── lib/
    ├── api.js              → Semua pemanggilan API (dengan fallback offline)
    ├── cache-store.js      → Cache localStorage dengan TTL
    ├── offline-db.js       → IndexedDB wrapper (CRUD)
    ├── offline-download.js → Download semua konten ke IndexedDB
    ├── offline-queue.js    → Antrean sinkronisasi hasil latihan saat offline
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
**Base URL:** `process.env.NEXT_PUBLIC_API_URL` (default: `https://imronm.pythonanywhere.com/api`)

### Pola Prioritas Data

Hampir semua fungsi API mengikuti pola ini:

```
Panggil fungsi (misal getKanjiList)
    │
    ├─ Online (navigator.onLine = true)?
    │   ├─ Ya → fetchWithCache(cacheKey, fetchFn)
    │   │           ├─ Berhasil → cache ke localStorage, return data
    │   │           └─ Gagal → coba serveFromDb (IndexedDB)
    │   │                       └─ Masih gagal → throw error
    │   │
    │   └─ Tidak (Offline) → serveFromDb(storeName, filters)
    │                         ├─ Ada data → return data (filtered + paginated)
    │                         └─ Tidak ada → throw / return empty
    │
    └─ Di SSR (typeof window === 'undefined') → fetch API langsung (no cache)
```

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
| `findIdByString(storeName, value)` | Cari ID di IndexedDB berdasarkan `character`, `word`, atau `title` |
| `suggestContent(payload)` | Kirim saran konten ke admin |

### `serveFromDb()` — Client-Side Filter & Pagination

Fungsi private yang memproses data IndexedDB secara manual di browser:
- Filter: `level`, `search`, `chapter`, `word_type`, `radical`
- Pencarian cerdas Kanji: jika cari "hari", cari di vocab meanings → ekstrak Kanji dari vocab yang cocok → tambahkan ke hasil
- Paginasi: `slice((page-1)*limit, page*limit)`

---

## 7. Sistem Cache (lib/cache-store.js)

**File:** `lib/cache-store.js`  
**Storage:** `localStorage` dengan prefix `jbook_cache:`

### Skema Entry Cache
```json
{
  "data": { ... },
  "expires": 1234567890000  // timestamp Unix ms
}
```

### TTL Default
- **7 hari** untuk list API (kanji, vocab, grammar)
- **24 jam** untuk soal latihan (`getPracticeQuestions`)

### Fungsi
| Fungsi | Deskripsi |
|---|---|
| `cacheSet(key, data, ttlMs)` | Simpan data + expiry ke localStorage |
| `cacheGet(key)` | Baca data, hapus otomatis jika expired |
| `cacheClear(key)` | Hapus entry spesifik |
| `fetchWithCache(key, fn, ttl)` | Fetch data + auto-cache dengan fallback ke cache jika network error |

---

## 8. Database Offline (lib/offline-db.js + IndexedDB)

**File:** `lib/offline-db.js`  
**DB Name:** `jbook-offline` (IndexedDB)  
**DB Version:** 1

### Object Stores
| Store | KeyPath | Isi |
|---|---|---|
| `vocab` | `id` | Semua data kosakata |
| `kanji` | `id` | Semua data kanji |
| `grammar` | `id` | Semua data tata bahasa |
| `practice` | `id` | Soal latihan yang di-cache |
| `meta` | `id` | Metadata: `downloadedAt`, `version` |

### Proteksi Error Fatal
```
openDB()
    │
    ├─ _isDBBroken = true? → Reject langsung (cegah loop)
    ├─ UnknownError / QuotaExceededError / VersionError → set _isDBBroken = true
    └─ Berhasil → cache _db instance (singleton)
```

### Fungsi CRUD
| Fungsi | Deskripsi |
|---|---|
| `dbPutAll(store, items)` | Hapus semua + simpan array baru (atomic replace) |
| `dbGetAll(store)` | Ambil semua item dari store |
| `dbGet(store, id)` | Ambil satu item by ID |
| `dbHasData(store)` | Cek apakah store memiliki data (boolean) |
| `dbCount(store)` | Hitung jumlah item |
| `dbSetMeta(key, val)` | Simpan metadata key-value |
| `dbGetMeta(key)` | Baca metadata |
| `dbClearAll()` | Hapus semua data di semua store |
| `dbGetStats()` | Ringkasan: jumlah vocab, kanji, grammar + timestamp download |

---

## 9. Download Offline (lib/offline-download.js)

**File:** `lib/offline-download.js`

### Alur `downloadAllForOffline(onProgress)`

```
1. Request persistent storage dari browser (navigator.storage.persist)
2. Untuk setiap step [vocab, kanji, grammar]:
   a. Panggil onProgress({ step, total, label, percent })
   b. fetch(url?limit=BESAR)
   c. Ekstrak array items dari response
   d. Normalisasi: pastikan setiap item punya 'id'
   e. dbPutAll(storeName, normalized) → simpan ke IndexedDB
   f. Panggil onProgress (selesai step)
3. Simpan metadata: downloadedAt, version
4. Return dbGetStats()
```

### Limit Download
| Konten | Limit |
|---|---|
| Vocab | 10.000 item |
| Kanji | 5.000 item |
| Grammar | 2.000 item |

### `isOfflineDataStale()`
```
downloadedAt tersimpan di meta?
    ├─ Tidak → return false (belum pernah download)
    └─ Ya → (now - downloadedAt) > 60 hari? → return true/false
```

---

## 10. Antrean Offline (lib/offline-queue.js)

**File:** `lib/offline-queue.js`  
**Storage Key:** `offline_practice_queue` (localStorage)

### Alur Saat Offline

```
User selesai kuis (offline, sudah login)
    │
    └─ enqueueResults(results)
        │
        └─ queue.push({ results, timestamp }) → simpan ke localStorage
```

### Alur Sinkronisasi Saat Online Kembali

```
navigator 'online' event fired (atau mount saat already online)
    │
    └─ syncPendingResults(submitFn)
        │
        ├─ Baca queue dari localStorage
        ├─ Untuk setiap batch:
        │   ├─ submitFn(batch.results) → coba submit ke server
        │   ├─ Berhasil → catat sebagai synced
        │   └─ Gagal → simpan ke array 'failed'
        └─ Tulis kembali hanya batch yang masih gagal ke localStorage
```

---

## 11. Analitik Tamu (lib/local-analytics.js)

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

### Alur Lengkap Kuis

#### 1. Inisialisasi Soal

```
Mount PracticeContent
    │
    ├─ Baca URL params: limit, level, type, timer
    ├─ Cek cache version di sessionStorage ('practice_cache_version')
    │   └─ Jika versi lama → hapus session cache
    ├─ Ada savedSession di sessionStorage?
    │   ├─ Ya + valid (< 1 jam, belum selesai) → restore session (soal, index, skor, timer)
    │   └─ Tidak → loadQuestions() dari API/IndexedDB
    └─ setIsPracticing(true)
```

#### 2. generateOfflineQuestions (mode offline)

```
Input: { limit, level, type }
    │
    ├─ Split 'type' by comma (support mixed types: "kanji,grammar")
    ├─ Untuk setiap type:
    │   ├─ Ambil pool data dari IndexedDB (storeName: kanji, vocab, grammar)
    │   ├─ Filter by level(s) jika ada (support "4,5")
    │   └─ Tag setiap item dengan properti 'type' aslinya
    ├─ Gabungkan semua pool menjadi pool raksasa
    ├─ Minimal 4 item → shuffle pool → pilih 'limit' item
    ├─ Untuk setiap item:
    │   ├─ Pilih 3 distractor acak dari context pool aslinya (type yang sama)
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
| `/kanji/[id]` | Public | Detail Kanji (via URL langsung) |
| `/kotoba` | Public | Daftar + filter Kosakata |
| `/kotoba/[id]` | Public | Detail Kosakata |
| `/bunpo` | Public | Daftar + filter Tata Bahasa |
| `/bunpo/[id]` | Public | Detail Tata Bahasa |
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
| `/offline` | Public | Fallback PWA ketika navigasi offline |
| `/admin/*` | Admin Only | Panel administrasi konten |

### Modal Detail (Client-Side Navigation)

Kanji, Kotoba, dan Bunpo detail diimplementasikan sebagai **modal overlay** (bukan navigasi halaman penuh) di 3 konteks:

1. **Dari halaman daftar** → push URL ke `/kanji/[id]` (intercept dengan modal)
2. **Dari hasil kuis** → state `detailView` di `PracticeRunner` → modal tanpa navigasi
3. **Dari dashboard** → state `detailView` di `DashboardPage` → modal tanpa navigasi
4. **Dari halaman history** → state `detailView` di `HistoryPage` → modal tanpa navigasi

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
    ├── cache-store.js  (fetchWithCache)
    ├── offline-db.js   (serveFromDb, findIdByString)
    └── offline-queue.js (enqueue jika offline)

PracticeRunner
    ├── lib/api.js          (getPracticeQuestions, submitPracticeResults)
    ├── lib/offline-queue.js (enqueueResults, syncPendingResults)
    └── lib/local-analytics.js (saveGuestResults jika tamu)

KotobaDetailUI
    ├── lib/api.js      (findIdByString → navigasi ke detail Kanji)
    └── lib/offline-db.js (dbGetAll('kanji') → data bedah kanji penyusun)
```

---

## 16. Alur Prioritas Data (Online vs Offline)

### Diagram Keputusan Fetch Data

```
                    ┌─────────────────────────────┐
                    │  Request Data (misal Kanji)  │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │   navigator.onLine = true?   │
                    └──────────┬──────────┬────────┘
                               │ Ya       │ Tidak
                    ┌──────────▼──┐  ┌────▼──────────────┐
                    │ fetchWithCache│  │  serveFromDb()    │
                    │ (localStorage)│  │  (IndexedDB)      │
                    └──────┬───────┘  └────────┬──────────┘
                           │ Berhasil           │ Ada data
                    ┌──────▼───────┐   ┌────────▼──────────┐
                    │ Simpan cache │   │ Filter + Paginate  │
                    │ 7 hari       │   │ Lokal (manual)     │
                    └──────┬───────┘   └────────┬──────────┘
                           │ Gagal              │ Tidak ada data
                    ┌──────▼───────┐   ┌────────▼──────────┐
                    │ Fallback ke  │   │  Return empty /    │
                    │ IndexedDB    │   │  throw error       │
                    └──────────────┘   └───────────────────┘
```

### Tiga Lapis Penyimpanan

| Layer | Storage | TTL | Kapan Dipakai |
|---|---|---|---|
| 1. Cache API | `localStorage` (jbook_cache:*) | 7 hari | Fallback online cepat, navigasi berulang |
| 2. IndexedDB | Browser DB permanen | ∞ (dihapus manual) | Mode offline penuh, setelah download |
| 3. Session | `sessionStorage` | 1 jam / per sesi | Restore kuis yang terinterupsi |

---

## 17. PWA & Service Worker

**File:** `next.config.mjs`  
**Library:** `@ducanh2912/next-pwa` + Workbox

### Strategi Caching Workbox

| Route Pattern | Strategi | Expiry |
|---|---|---|
| `/blog/*` | NetworkFirst (timeout 3s) | 1 menit, max 10 entries |
| Halaman non-blog/non-api | NetworkFirst (timeout 10s) | 30 hari, max 32 entries |
| `/api/*` (same-origin) | NetworkFirst (timeout 10s) | 30 hari, max 64 entries |
| `imronm.pythonanywhere.com/api/*` | NetworkFirst (timeout 10s) | 30 hari, max 128 entries |

### Offline Fallback
- Jika navigasi ke halaman apapun gagal saat offline → redirect ke `/offline`
- Konfigurasi: `fallbacks.document: "/offline"`

### PWA On/Off
- Di **development**: PWA dinonaktifkan (`disable: NODE_ENV === 'development'`)
- Di **production** (Vercel): PWA aktif, generate `sw.js` di `/public`

---

## Panduan Debugging Cepat

### Masalah Auth / Tidak Login
1. Cek cookie `access_token` dan `refresh_token` di DevTools → Application → Cookies
2. Cek console untuk log `[AuthContext]`
3. Jika `401`: refresh token mungkin expired → harus login ulang

### Masalah Data Offline Tidak Muncul
1. DevTools → Application → IndexedDB → `jbook-offline`
2. Cek apakah store `vocab/kanji/grammar` ada isinya
3. Jika kosong → buka modal Download Offline dan download ulang

### Masalah Cache Lama / Data Stale
1. DevTools → Application → Local Storage
2. Cari key dengan prefix `jbook_cache:`
3. Hapus manual atau tunggu TTL 7 hari berlalu

### Masalah Hasil Latihan Tidak Tersync
1. Cek `localStorage` key `offline_practice_queue`
2. Pastikan user sudah login kembali dan koneksi online
3. Sync terjadi otomatis saat event `online` terdeteksi

### Masalah Flash of Wrong Theme (FOWT)
1. Pastikan semua komponen menggunakan pola `!mounted ? 'default' : (theme === 'dark' ? ... : ...)`
2. JANGAN gunakan Tailwind `dark:` class untuk elemen kritis text/background
3. `mounted` hanya menjadi `true` setelah `useEffect` pertama berjalan di client

---

*Dokumen ini mencerminkan state kode per April 2026. Perbarui setiap ada perubahan arsitektur signifikan.*
