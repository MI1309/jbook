# JBook - Folder Structure & Architecture Documentation
Cetak biru standar susunan direktori dan file untuk proyek JBook!

---

## 📋 Tentang Dokumen Ini
Dokumen ini menjelaskan struktur folder proyek JBook secara detail agar kode tetap **modular, scalable, dan mudah dipahami**. Semua pengembang (termasuk AI!) wajib mematuhi standar ini!

---

## 🛠️ Arsitektur Proyek (Overview)
Proyek JBook menggunakan **Client-Server Architecture** dengan pendekatan **Clean/Modular**:
- **Frontend Web**: Next.js 14+ (App Router), React, Tailwind CSS
- **Frontend Mobile**: Flutter (Android/iOS)
- **Backend**: Django 5+ dengan Django Ninja REST API
- **Database**: SQLite (dev) / PostgreSQL (prod)

---

## 1. Pohon Direktori Proyek (Project Directory Tree)
Berikut adalah struktur folder utama untuk seluruh proyek!

```text
jbook/                           # Root proyek utama
├── docs/                        # 📚 Semua dokumentasi proyek (wajib update!)
│   ├── UI.md                    # Dokumentasi UI & Flow
│   ├── logic_app.md             # Logika backend & review kode
│   ├── testing_deployment.md    # Panduan testing & deploy
│   ├── api_integration.md       # Kontrak API
│   └── folder_structure.md      # Dokumen ini (folder structure)
│
├── backend/                      # 🔙 Backend Django REST API
│   ├── content/                  # 📚 Modul konten (Kanji, Kotoba, Bunpo, Blog)
│   │   ├── migrations/           # Migrasi database Django
│   │   ├── management/           # Custom Django commands (seed data, import)
│   │   │   └── commands/
│   │   ├── admin.py              # Admin site Django (untuk CMS)
│   │   ├── api.py                # Public API endpoints (untuk user biasa)
│   │   ├── admin_api.py          # Admin-only API endpoints
│   │   ├── models.py             # Definisi model database (ORM Django)
│   │   ├── tests.py              # Unit tests untuk modul content
│   │   ├── utils.py              # Helper khusus modul content
│   │   └── views.py              # (Opsional) View non-API
│   │
│   ├── learning/                 # 📝 Modul latihan & kuis
│   │   ├── migrations/
│   │   ├── admin.py
│   │   ├── api.py                # Endpoint latihan, progress, analytics
│   │   ├── models.py
│   │   ├── tests.py
│   │   ├── tts_logic.py          # Logika TTS & Crossword generator
│   │   └── views.py
│   │
│   ├── users/                    # 🔐 Modul autentikasi & pengguna
│   │   ├── migrations/
│   │   ├── admin.py
│   │   ├── api.py                # Endpoint login, register, reset password
│   │   ├── models.py
│   │   ├── tests.py
│   │   └── views.py
│   │
│   ├── utils/                    # 🛠️ Helper & library umum (shared)
│   │   ├── __init__.py
│   │   ├── conjugation.py        # Logika konjugasi & dekonjugasi kata kerja
│   │   ├── kana.py               # Konversi Romaji ↔ Kana
│   │   └── kotoba_sync.py        # Sync data vocab dari file eksternal
│   │
│   ├── core/                     # ⚙️ Konfigurasi utama Django project
│   │   ├── __init__.py
│   │   ├── settings.py           # Konfigurasi Django (dev/prod)
│   │   ├── urls.py               # Routing utama project
│   │   ├── asgi.py
│   │   └── wsgi.py
│   │
│   ├── static/                   # 🖼️ File static (CSS, JS, images) [collectstatic]
│   ├── media/                    # 📁 File upload pengguna (jika ada)
│   ├── manage.py                 # Script manajemen Django
│   ├── requirements.txt          # Daftar dependensi Python (pip install)
│   └── [venv]/                   # Virtual environment (JANGAN commit ke Git!)
│
├── frontend-web/                 # 🖥️ Frontend Next.js (Web App)
│   ├── app/                      # 📄 App Router Next.js
│   │   ├── layout.jsx            # Root layout (Navbar, Footer, ClientShell)
│   │   ├── page.jsx              # Halaman Home
│   │   ├── globals.css           # Global styles (Tailwind config)
│   │   │
│   │   ├── kanji/                # Halaman & routes untuk Kanji
│   │   │   ├── page.jsx          # List kanji
│   │   │   └── [id]/
│   │   │       └── page.jsx      # Detail kanji
│   │   │
│   │   ├── kotoba/               # Halaman untuk Vocab
│   │   ├── bunpo/                # Halaman untuk Grammar
│   │   ├── practice/             # Halaman untuk Latihan
│   │   ├── login/                # Halaman login
│   │   ├── register/             # Halaman register
│   │   └── admin/                # Halaman admin (hanya untuk staff)
│   │
│   ├── components/               # 🧩 Komponen React reusable
│   │   ├── common/               # Komponen umum (shared across app)
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── ClientShell.jsx
│   │   │   ├── OfflineIndicator.jsx
│   │   │   ├── AnnouncementPopup.jsx
│   │   │   ├── ConfirmationModal.jsx
│   │   │   └── SakuraBackground.jsx
│   │   │
│   │   ├── kanji/                # Komponen khusus Kanji
│   │   │   ├── KanjiCard.jsx
│   │   │   ├── KanjiDetailUI.jsx
│   │   │   ├── KanjiFilter.jsx
│   │   │   ├── KanjiDetailModal.jsx
│   │   │   └── KanjiStrokeViewer.jsx
│   │   │
│   │   ├── kotoba/               # Komponen khusus Vocab
│   │   │   ├── KotobaCard.jsx
│   │   │   ├── KotobaDetailUI.jsx
│   │   │   └── KotobaFilter.jsx
│   │   │
│   │   ├── bunpo/                # Komponen khusus Grammar
│   │   ├── practice/             # Komponen khusus Latihan
│   │   └── crossword/            # Komponen permainan Crossword
│   │
│   ├── context/                  # 🧠 Context API React (state global)
│   │   ├── AuthContext.js
│   │   ├── ThemeContext.js
│   │   └── PracticeContext.js
│   │
│   ├── lib/                      # 📚 Helper & utility function (shared)
│   │   ├── api.js                # Wrapper fetch API & helper request
│   │   ├── cache-store.js        # Logika IndexedDB (offline cache)
│   │   ├── local-analytics.js    # Analytics untuk tamu
│   │   └── utils.js              # Fungsi helper umum
│   │
│   ├── stores/                   # 📦 State management (jika menggunakan Zustand dll)
│   │   └── gameStore.js
│   │
│   ├── data/                     # 📄 Data statis (jika ada)
│   │   └── kana.js
│   │
│   ├── public/                   # 🖼️ Aset publik (images, icons, manifest)
│   │   ├── icon.svg
│   │   ├── icon-192.png
│   │   ├── manifest.json
│   │   └── [other assets]
│   │
│   ├── next.config.mjs           # Konfigurasi Next.js
│   ├── tailwind.config.js        # Konfigurasi Tailwind CSS
│   ├── postcss.config.mjs
│   ├── package.json              # Daftar dependensi NPM
│   ├── package-lock.json
│   └── eslint.config.mjs
│
├── jbook_mobile/                 # 📱 Frontend Flutter (Mobile App)
│   ├── android/                  # Konfigurasi native Android
│   ├── ios/                      # Konfigurasi native iOS
│   ├── lib/                      # Kode utama Flutter
│   │   ├── main.dart             # Entry point aplikasi
│   │   ├── constants/            # Konstanta (warna, teks, URL API)
│   │   ├── models/               # Model data (mirip Django models, untuk serialisasi JSON)
│   │   ├── screens/              # Halaman UI (Screens/Pages)
│   │   ├── widgets/              # Komponen reusable Flutter
│   │   ├── providers/            # State management (Provider, Riverpod, dll)
│   │   ├── services/             # API calls & layanan (http, local storage)
│   │   └── utils/                # Helper function
│   │
│   ├── assets/                   # Aset (images, fonts, icon)
│   ├── test/                     # Unit test & widget test Flutter
│   ├── pubspec.yaml              # Konfigurasi dependensi Flutter
│   └── [other Flutter files]
│
├── data_proses/                  # 📊 File sementara untuk proses data (JANGAN commit ke Git!)
│   └── [script processing data lokal]
│
├── .gitignore                    # File/folder yang diabaikan Git (venv, node_modules, .env, dll)
├── README.md                     # Deskripsi singkat proyek (untuk GitHub)
└── TESTING.md                    # (Opsional) Catatan testing manual
```

---

## 2. Penjelasan Fungsi Folder (Directory Breakdown)

### 📂 `docs/`
Semua dokumentasi proyek **wajib** diletakkan di sini! Update setiap kali ada perubahan besar fitur/arsitektur!

✅ **Boleh**: File Markdown (`.md`), gambar diagram (jika dibutuhkan)<br>
❌ **Tidak**: File kode, aset aplikasi

---

### 📂 `backend/content/`
Modul inti untuk manajemen konten (kanji, vocab, bunpo, blog). Semua yang berhubungan dengan "apa yang dipelajari" ada di sini!

✅ **Boleh**: Models, API endpoints, admin site<br>
❌ **Tidak**: Logika latihan (masuk ke `learning/`), logika autentikasi (masuk ke `users/`)

---

### 📂 `backend/learning/`
Modul untuk fitur **pembelajaran & kuis**: generate soal, simpan progress, analytics, minna no nihongo, doukai (membaca).

✅ **Boleh**: Models QuizAttempt, UserProgress, endpoint generate soal<br>
❌ **Tidak**: Definisi kanji/vocab (masuk ke `content/`)

---

### 📂 `backend/utils/`
Library helper **shared** yang bisa dipakai oleh semua modul backend!

✅ **Boleh**: Fungsi konjugasi, konversi kana, sync data (tanpa state spesifik)<br>
❌ **Tidak**: Logika yang spesifik hanya untuk satu modul (misal: hanya untuk `content/`)

---

### 📂 `frontend-web/app/`
Semua **halaman dan routing** Next.js (App Router). Struktur folder di dalam `app/` menentukan URL website!

✅ **Boleh**: `page.jsx`, `layout.jsx`, `loading.jsx`, `error.jsx`, route groups (`(auth)/`, `(dashboard)/`)<br>
❌ **Tidak**: Komponen reusable (masuk ke `components/`), state global (masuk ke `context/`)

---

### 📂 `frontend-web/components/`
Komponen React **reusable** yang bisa dipakai di banyak halaman! Pisahkan menjadi sub-folder berdasarkan kategori (misal `common/`, `kanji/`, `practice/`).

✅ **Boleh**: Tombol, kartu, modal, filter, widget khusus<br>
❌ **Tidak**: Seluruh halaman (masuk ke `app/`), logika bisnis kompleks (masuk ke `lib/` atau custom hooks)

---

### 📂 `frontend-web/context/`
State **global** React Context yang dibutuhkan banyak komponen (contoh: Auth, Theme, Practice session).

✅ **Boleh**: Provider dan custom hook untuk akses context<br>
❌ **Tidak**: State lokal komponen (gunakan `useState` langsung di komponen)

---

### 📂 `frontend-web/lib/`
Helper function dan library **shared** untuk frontend!

✅ **Boleh**: Wrapper API call (`api.js`), cache IndexedDB, fungsi validasi input, konversi data<br>
❌ **Tidak**: Komponen React, state global

---

### 📂 `jbook_mobile/lib/`
Struktur utama Flutter! Gunakan **Clean Architecture** di sini!

| Folder | Fungsi |
|--------|--------|
| `screens/` | Halaman penuh (contoh: `HomeScreen`, `LoginScreen`) |
| `widgets/` | Komponen kecil reusable (contoh: `CustomButton`, `KanjiCardWidget`) |
| `providers/` | State management (Provider/Riverpod/Bloc) |
| `services/` | Panggilan API, local storage (Hive/SharedPreferences), TTS |
| `models/` | Class model untuk serialisasi JSON (dari backend API) |
| `utils/` | Helper function (contoh: `formatDate()`, `convertRomaji()`) |
| `constants/` | Warna, teks statis, URL API, asset path |

---

## 3. Konvensi Penamaan (Naming Conventions)
Semua pengembang **WAJIB** mengikuti aturan ini agar nama file dan variabel konsisten!

---

### 🐍 Backend (Python/Django)
| Tipe | Aturan | Contoh |
|------|--------|--------|
| **Folder/File** | `snake_case` | `content/admin_api.py`, `utils/conjugation.py` |
| **Class/Model** | `PascalCase` | `class Kanji(models.Model):`, `class CustomModule(models.Model):` |
| **Fungsi/Variabel** | `snake_case` | `def deconjugate_verb():`, `user_profile = ...` |
| **Field Model** | `snake_case` | `jlpt_level = models.IntegerField()`, `word_type = ...` |
| **URL Endpoint** | `kebab-case` (dipisah `-`) | `/api/content/kanji/`, `/api/learning/practice/generate/` |

---

### ⚛️ Frontend Web (JavaScript/Next.js)
| Tipe | Aturan | Contoh |
|------|--------|--------|
| **Folder/File JS/JSX** | `PascalCase` untuk komponen, `camelCase` untuk lainnya | `components/kanji/KanjiCard.jsx`, `lib/api.js` |
| **File CSS/Asset** | `kebab-case` | `globals.css`, `sakura-background.png` |
| **Komponen React** | `PascalCase` | `export default function KanjiCard() { ... }` |
| **Fungsi/Variabel** | `camelCase` | `const [isMenuOpen, setIsMenuOpen] = useState();`, `function formatReading() { ... }` |
| **Hook Custom** | `use[Nama]` (prefix `use`) | `function useAuth() { ... }`, `function useTheme() { ... }` |

---

### 🐦 Frontend Mobile (Dart/Flutter)
| Tipe | Aturan | Contoh |
|------|--------|--------|
| **Folder/File** | `snake_case` | `screens/home_screen.dart`, `widgets/custom_button.dart` |
| **Class/Widget** | `PascalCase` | `class HomeScreen extends StatelessWidget { ... }` |
| **Variabel/Fungsi** | `camelCase` | `bool isLoggedIn = false;`, `void fetchKanjiList() { ... }` |
| **Constanta** | `SCREAMING_SNAKE_CASE` | `const Color primaryColor = Color(0xFFE53935);`, `const String apiBaseUrl = ...;` |

---

## 4. Alur Pembuatan File Baru (Workflow Rule)
Berikut adalah panduan **langkah demi langkah** ketika ingin menambah fitur baru! Contoh kasus: **Fitur "Profil Pengguna" (User Profile)**.

---

### Contoh 1: Menambah Fitur di Backend (API Profil Pengguna)
1. **Model**: Jika butuh field baru di database, edit `users/models.py` → Jalankan `makemigrations` dan `migrate`!
2. **API**: Tambahkan endpoint di `users/api.py` (contoh: `GET /users/profile/` dan `PUT /users/profile/`)
3. **Test**: Tambahkan unit test di `users/tests.py`
4. **Dokumentasi**: Update `api_integration.md` di folder `docs/`!

---

### Contoh 2: Menambah Fitur di Frontend Web (Halaman Profil)
1. **Halaman**: Buat file `app/dashboard/profile/page.jsx`
2. **Komponen**: Jika butuh komponen baru, buat di `components/common/` atau `components/profile/` (jika khusus)
3. **Context**: Jika butuh state global, edit `context/AuthContext.js` atau buat context baru
4. **API Call**: Tambahkan helper function di `lib/api.js`
5. **UI Test**: Coba jalankan di browser, pastikan responsive di mobile dan laptop!

---

### Contoh 3: Menambah Fitur di Flutter Mobile
1. **Model**: Buat class di `lib/models/user_profile.dart`
2. **Service**: Tambahkan API call di `lib/services/api_service.dart`
3. **Provider**: Buat state management di `lib/providers/user_profile_provider.dart`
4. **Screen**: Buat halaman di `lib/screens/profile_screen.dart`
5. **Widget**: Tambahkan komponen di `lib/widgets/` jika dibutuhkan
6. **Test**: Jalankan `flutter test` dan coba di emulator!

---

## 📌 Aturan Penting Tambahan
1. **JANGAN commit**: `venv/`, `node_modules/`, `.env`, `*.sqlite3`, file build, file log! Pastikan ini masuk ke `.gitignore`!
2. **Satu file, satu tanggung jawab**: Jangan buat file super panjang yang mengerjakan segalanya! Pisahkan menjadi fungsi/kode kecil.
3. **Komentar**: Tambahkan komentar hanya jika kode terlalu rumit untuk dimengerti tanpa penjelasan (kode yang bersih seharusnya sudah "berbicara" sendiri!).
4. **Pull Request**: Sebelum merge ke branch utama, pastikan semua test berjalan dan dokumentasi di-update!

---

Selamat menjaga kode tetap bersih dan rapi! 🧹✨
