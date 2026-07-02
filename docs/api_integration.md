# JBook - API & Integration Documentation
Dokumentasi resmi "kontrak API" untuk sinkronisasi antara frontend dan backend JBook!

---

## 📋 Tentang Dokumen Ini
Dokumen ini menjelaskan secara detail semua endpoint API JBook, format request/response, dan cara autentikasi. Digunakan sebagai acuan utama untuk pengembangan frontend dan backend agar tetap sinkron!

---

## 1. Protokol & Konfigurasi Dasar (Base Configuration)

### 🔗 Base URL
| Environment | Base URL |
|-------------|----------|
| **Development (Lokal)** | `http://localhost:8000/api` |
| **Production (Server)** | `https://[username].pythonanywhere.com/api` (ganti sesuai domain kamu) |

### 📦 Format Data
Semua request dan response menggunakan **JSON** sebagai format data utama.

### 📌 Header Wajib
| Key | Value | Wajib? | Keterangan |
|-----|-------|--------|------------|
| `Content-Type` | `application/json` | ✅ | untuk request dengan body (POST/PUT) |
| `Authorization` | `Bearer <access_token>` | ⚠️ | untuk endpoint yang memerlukan autentikasi (lihat bagian 3) |

---

## 2. Daftar Endpoint API (API Endpoints Specs)

Berikut adalah endpoint utama yang digunakan di aplikasi JBook!

---

### 🔐 Authentication & Users (`/users/`)
Semua endpoint di bawah ini dikelola oleh modul `users/api.py`.

---

#### 📝 Register Pengguna Baru
- **Endpoint**: `/users/register/`
- **Method**: `POST`
- **Auth Required**: ❌ Tidak
- **Request Payload**:
  ```json
  {
    "username": "johndoe",
    "email": "johndoe@example.com",
    "password": "password123aman",
    "level_target": 5
  }
  ```
- **Response Success (201 Created)**:
  ```json
  {
    "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "johndoe@example.com",
      "level_target": 5,
      "is_staff": false
    }
  }
  ```
- **Response Error**:
  - `400 Bad Request`: Email sudah terdaftar / username sudah dipakai
    ```json
    { "detail": "Email already registered" }
    ```

---

#### 🔑 Login Pengguna
- **Endpoint**: `/users/login/`
- **Method**: `POST`
- **Auth Required**: ❌ Tidak
- **Request Payload**:
  ```json
  {
    "identifier": "johndoe@example.com",
    "password": "password123aman"
  }
  ```
  Catatan: `identifier` bisa berupa **email** atau **username**!
- **Response Success (200 OK)**: Sama dengan response register!
- **Response Error**:
  - `400 Bad Request`: User tidak ditemukan / password salah
    ```json
    { "detail": "User not found" }
    ```
    atau
    ```json
    { "detail": "Incorrect password" }
    ```

---

#### 🔑 Login dengan Google OAuth
- **Endpoint**: `/users/google/`
- **Method**: `POST`
- **Auth Required**: ❌ Tidak
- **Request Payload**:
  ```json
  {
    "token": "google_oauth_id_token_jwt"
  }
  ```
- **Response Success (200 OK)**: Sama dengan login biasa!
- **Response Error**:
  - `400 Bad Request`: Token Google tidak valid
    ```json
    { "detail": "Google auth failed: Invalid token" }
    ```

---

#### 👤 Dapatkan Profil Pengguna (Me)
- **Endpoint**: `/users/me/`
- **Method**: `GET`
- **Auth Required**: ✅ Ya
- **Response Success (200 OK)**:
  ```json
  {
    "id": 1,
    "username": "johndoe",
    "email": "johndoe@example.com",
    "level_target": 5,
    "is_staff": false
  }
  ```
- **Response Error**:
  - `401 Unauthorized`: Token tidak valid / tidak ada
  - `403 Forbidden`: Token kadaluarsa

---

#### 🔄 Refresh Token
- **Endpoint**: `/users/token/refresh/` (dari django-ninja-jwt)
- **Method**: `POST`
- **Auth Required**: ❌ Tidak (hanya butuh refresh token)
- **Request Payload**:
  ```json
  {
    "refresh": "refresh_token_jwt_disini"
  }
  ```
- **Response Success (200 OK)**:
  ```json
  {
    "access": "access_token_baru_disini"
  }
  ```

---

#### 📧 Request Reset Password
- **Endpoint**: `/users/password-reset/`
- **Method**: `POST`
- **Auth Required**: ❌ Tidak
- **Request Payload**:
  ```json
  {
    "email": "johndoe@example.com"
  }
  ```
- **Response Success (200 OK)**:
  ```json
  {
    "message": "If an account with that email exists, a reset link has been sent to your email.",
    "reset_link": "https://yourapp.com/reset-password?uid=...&token=..."
  }
  ```

---

#### ✅ Konfirmasi Reset Password
- **Endpoint**: `/users/password-reset-confirm/`
- **Method**: `POST`
- **Auth Required**: ❌ Tidak
- **Request Payload**:
  ```json
  {
    "uid": "base64_encoded_user_id",
    "token": "password_reset_token",
    "new_password": "password_baru123"
  }
  ```
- **Response Success (200 OK)**:
  ```json
  {
    "message": "Password has been reset with the new password."
  }
  ```
- **Response Error**:
  - `400 Bad Request`: Token tidak valid / kadaluarsa
    ```json
    { "detail": "Reset link is invalid or has expired." }
    ```

---

### 📚 Content & Kamus (`/content/`)
Endpoint untuk akses data Kanji, Vocab (Kotoba), Bunpo (Tata Bahasa), Blog!

---

#### 🀄 Daftar Kanji
- **Endpoint**: `/content/kanji/`
- **Method**: `GET`
- **Auth Required**: ❌ Tidak
- **Query Parameters (Opsional)**:
  | Parameter | Type | Deskripsi |
  |-----------|------|-----------|
  | `level` | Integer | Filter JLPT level (1-5) |
  | `search` | String | Cari kanji, arti, onyomi, atau kunyomi |
  | `radical` | String | Cari berdasarkan radikal |
  | `limit` | Integer | Batas hasil per halaman (default: 50) |
  | `page` | Integer | Halaman ke berapa (default: 1) |
- **Response Success (200 OK)**:
  ```json
  {
    "items": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "character": "日",
        "meaning": "hari",
        "onyomi": ["ニチ", "ジツ"],
        "kunyomi": ["ひ", "-び", "-か"],
        "strokes": 4,
        "jlpt_level": 5,
        "word_type": "noun",
        "examples": [],
        "svg_data": "<svg>...</svg>"
      }
    ],
    "total": 100,
    "page": 1,
    "pages": 2
  }
  ```

---

#### 🀄 Detail Kanji
- **Endpoint**: `/content/kanji/{id}/`
- **Method**: `GET`
- **Auth Required**: ❌ Tidak
- **Response Success (200 OK)**:
  ```json
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "character": "日",
    "meaning": "hari",
    "onyomi": ["ニチ", "ジツ"],
    "kunyomi": ["ひ", "-び", "-か"],
    "strokes": 4,
    "jlpt_level": 5,
    "word_type": "noun",
    "examples": [
      {
        "word": "日本",
        "reading": "にほん",
        "meaning": "Jepang"
      }
    ],
    "svg_data": "<svg>...</svg>"
  }
  ```
- **Response Error**:
  - `404 Not Found`: Kanji dengan ID tersebut tidak ada!

---

#### 🈶 Daftar Vocab (Kotoba)
- **Endpoint**: `/content/vocab/` (dan `/content/kotoba/`)
- **Method**: `GET`
- **Auth Required**: ❌ Tidak
- **Query Parameters (Opsional)**:
  | Parameter | Type | Deskripsi |
  |-----------|------|-----------|
  | `level` | Integer | Filter JLPT level (1-5) |
  | `search` | String | Cari kata, reading, arti, **dan mendukung dekonjugasi** (contoh: cari "tabemasu" → menemukan "taberu") |
  | `word_type` | String | Filter tipe kata (noun, godan, ichidan, dll) |
  | `limit` | Integer | Batas hasil per halaman (default: 50) |
  | `page` | Integer | Halaman ke berapa (default: 1) |
- **Response Success (200 OK)**:
  ```json
  {
    "items": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "word": "食べる",
        "reading": "たべる",
        "meaning": "makan",
        "word_type": "ichidan",
        "jlpt_level": 5,
        "examples": []
      }
    ],
    "total": 500,
    "page": 1,
    "pages": 10,
    "debug_level": 5,
    "debug_search": "tabemasu"
  }
  ```

---

#### 🈶 Detail Vocab (Kotoba) + Konjugasi
- **Endpoint**: `/content/vocab/{id}/` (dan `/content/kotoba/{id}/`)
- **Method**: `GET`
- **Auth Required**: ❌ Tidak
- **Response Success (200 OK)**:
  Jika kata kerja, akan ditambahkan field `conjugations_complete`:
  ```json
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "word": "食べる",
    "reading": "たべる",
    "meaning": "makan",
    "word_type": "ichidan",
    "jlpt_level": 5,
    "examples": [
      {
        "sentence": "リンゴを食べます。",
        "meaning": "Saya makan apel."
      }
    ],
    "conjugations": [ /* format lama, tetap ada untuk backward compatibility */ ],
    "conjugations_complete": {
      "forms": [
        {
          "name": "Indikatif",
          "variants": {
            "default": { "kanji": "食べる", "kana": "たべる" },
            "formal": { "kanji": "食べます", "kana": "たべます" },
            "negative": { "kanji": "食べない", "kana": "たべない" },
            "past": { "kanji": "食べた", "kana": "たべた" },
            "formal_negative": { "kanji": "食べません", "kana": "たべません" },
            "formal_past": { "kanji": "食べました", "kana": "たべました" },
            "negative_past": { "kanji": "食べなかった", "kana": "たべなかった" },
            "formal_negative_past": { "kanji": "食べませんでした", "kana": "たべませんでした" }
          }
        }
        /* ... 8 bentuk lainnya (Progresif, Imperatif, dll) ... */
      ]
    }
  }
  ```

---

#### 🎵 Dapatkan Audio TTS untuk Vocab
- **Endpoint**: `/content/vocab/{id}/audio/`
- **Method**: `GET`
- **Auth Required**: ❌ Tidak
- **Response**: File audio MP3 (streaming, dari Google Translate TTS)
- **Response Error**:
  - `404 Not Found`: Vocab tidak ada!

---

#### 📖 Daftar Bunpo (Tata Bahasa)
- **Endpoint**: `/content/grammar/` (dan `/content/bunpo/`)
- **Method**: `GET`
- **Auth Required**: ❌ Tidak
- **Query Parameters (Opsional)**:
  | Parameter | Type | Deskripsi |
  |-----------|------|-----------|
  | `level` | Integer | Filter JLPT level |
  | `search` | String | Cari judul, struktur, atau penjelasan |
  | `chapter` | Integer | Filter bab |
- **Response Success (200 OK)**:
  ```json
  {
    "items": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "title": "〜ます (Formal)",
        "structure": "Verb stem + ます",
        "explanation": "Digunakan untuk berbicara secara sopan...",
        "chapter": 1,
        "jlpt_level": 5,
        "sentences": [
          { "jp": "食べます", "id": "Saya makan" }
        ]
      }
    ],
    "total": 50,
    "page": 1,
    "pages": 1
  }
  ```

---

#### 📝 Detail Bunpo
- **Endpoint**: `/content/grammar/{id}/` (dan `/content/bunpo/{id}/`)
- **Method**: `GET`
- **Auth Required**: ❌ Tidak
- **Response Success**: Mirip dengan item di daftar bunpo!

---

#### 📢 Daftar Pengumuman Aktif
- **Endpoint**: `/content/announcements/`
- **Method**: `GET`
- **Auth Required**: ❌ Tidak
- **Cache**: Di-cache server selama 5 menit!
- **Response Success**:
  ```json
  [
    {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "title": "Pembaruan Fitur!",
      "content": "Kami menambahkan fitur dekonjugasi pada pencarian vocab!",
      "type": "info",
      "priority": 5,
      "is_active": true,
      "show_as_popup": true,
      "created_at": "2026-07-01T00:00:00Z"
    }
  ]
  ```

---

#### 📰 Daftar Post Blog
- **Endpoint**: `/content/blog/`
- **Method**: `GET`
- **Auth Required**: ❌ Tidak
- **Response Success**:
  ```json
  [
    {
      "id": "550e8400-e29b-41d4-a716-446655440004",
      "title": "Cara Cepat Hafal Kanji N5",
      "slug": "cara-cepat-hafal-kanji-n5",
      "content": "# Tips Hafal Kanji...",
      "tags": ["kanji", "tips"],
      "is_published": true,
      "created_at": "2026-07-01T00:00:00Z",
      "updated_at": "2026-07-01T00:00:00Z"
    }
  ]
  ```

---

#### ✉️ Kirim Saran Konten
- **Endpoint**: `/content/suggest/`
- **Method**: `POST`
- **Auth Required**: ❌ Tidak
- **Request Payload**:
  ```json
  {
    "type": "kanji",
    "data": { "character": "新", "meaning": "baru" }
  }
  ```
- **Response Success (200 OK)**:
  ```json
  {
    "message": "Saran kamu sudah dikirim ke admin untuk direview. Terima kasih!"
  }
  ```

---

### 📝 Learning & Latihan (`/learning/`)
Endpoint untuk fitur kuis, latihan, dan progress pengguna!

---

#### 🎲 Generate Soal Latihan
- **Endpoint**: `/learning/practice/generate/`
- **Method**: `GET`
- **Auth Required**: ❌ Tidak (bisa tamu)
- **Query Parameters**:
  | Parameter | Type | Deskripsi |
  |-----------|------|-----------|
  | `limit` | Integer | Jumlah soal (default: 10, max 2000) |
  | `level` | String | Level JLPT, bisa multiple (contoh: "5,4") |
  | `type` | String | Tipe soal: `kanji`, `vocab`, `grammar`, `particle`, `kana` (bisa multiple: "kanji,vocab") |
- **Response Success**:
  ```json
  [
    {
      "id": "kanji_550e8400...",
      "character": "日",
      "type": "kanji",
      "options": [
        { "text": "hari", "is_correct": true },
        { "text": "bulan", "is_correct": false },
        { "text": "tahun", "is_correct": false },
        { "text": "jam", "is_correct": false }
      ],
      "reading": "ニチ,ジツ",
      "meaning": "hari",
      "level": 5
    }
  ]
  ```

---

#### ✅ Submit Jawaban Latihan
- **Endpoint**: `/learning/practice/submit/`
- **Method**: `POST`
- **Auth Required**: ✅ Ya (untuk simpan progress; jika tamu, tidak disimpan)
- **Request Payload**:
  ```json
  {
    "results": [
      {
        "question_id": "550e8400-e29b-41d4-a716-446655440000",
        "type": "kanji",
        "is_correct": true,
        "answer_given": "hari",
        "mode": "choice"
      }
    ]
  }
  ```
- **Response Success (200 OK)**:
  ```json
  {
    "status": "success",
    "count": 1,
    "results": "saved"
  }
  ```

---

#### 📊 Dapatkan Analitik Pengguna
- **Endpoint**: `/learning/practice/analytics/`
- **Method**: `GET`
- **Auth Required": ✅ Ya
- **Response Success**:
  ```json
  {
    "total_attempts": 150,
    "accuracy": 85.3,
    "wrong_stats": [
      { "character": "月", "count": 5, "type": "kanji", "status": "Perbaiki", "level": 5 }
    ],
    "level_stats": [
      { "level": 5, "total": 100, "correct": 90, "accuracy": 90.0 }
    ],
    "kakitori_stats": { /* kakitori specific stats */ }
  }
  ```

---

#### 🔄 Reset Progress Pengguna
- **Endpoint**: `/learning/practice/reset/`
- **Method**: `POST`
- **Auth Required": ✅ Ya
- **Request Payload**: Kosong
- **Response Success**:
  ```json
  {
    "status": "success",
    "message": "Deleted 150 attempts",
    "deleted_count": 150
  }
  ```

---

#### 📤 Export Progress
- **Endpoint**: `/learning/practice/export/`
- **Method**: `GET`
- **Auth Required": ✅ Ya
- **Response Success**: File JSON berisi `attempts` dan `progress` pengguna!

---

#### 📥 Import Progress
- **Endpoint**: `/learning/practice/import/`
- **Method**: `POST`
- **Auth Required": ✅ Ya
- **Request Payload**: File JSON (content type `multipart/form-data`) dengan format sama seperti export!
- **Response Success**:
  ```json
  {
    "status": "success",
    "imported": 100,
    "skipped": 5,
    "progress_updated": 10,
    "message": "Berhasil mengimpor 100 data latihan."
  }
  ```

---

### 🛡️ Admin (`/admin/content/` & `/admin/learning/`)
Semua endpoint admin memerlukan autentikasi dan role `is_staff=True` atau `is_superuser=True`!
Untuk detail, lihat file `content/admin_api.py` dan `learning/api.py` di repositori kamu.

---

## 3. Alur Autentikasi & Keamanan (Authentication Flow)

JBook menggunakan **JWT (JSON Web Token)** dengan `django-ninja-jwt` untuk autentikasi!

### 🔄 Alur Login Lengkap
1. Frontend kirim request `POST /users/login/` dengan username/email dan password
2. Backend validasi, lalu kembalikan **Access Token** dan **Refresh Token**
3. Frontend **simpan kedua token** di:
   - **Web**: **HTTP-only cookies** (LEBIH AMAN, hindari XSS) – atau `localStorage`
   - **Flutter**: `flutter_secure_storage` untuk keamanan tambahan
4. Untuk setiap request ke endpoint yang memerlukan auth, frontend **sertakan header**:
   ```http
   Authorization: Bearer <access_token_disini>
   ```
5. **Access Token** biasanya kadaluarsa dalam 15-60 menit! Ketika menerima `401 Unauthorized`, frontend seharusnya:
   - Kirim refresh token ke `/users/token/refresh/` untuk dapatkan access token baru
   - Jika refresh token juga kadaluarsa → arahkan pengguna ke halaman login

---

## 4. Penanganan Error di Frontend (Error Handling Strategy)

Berikut adalah strategi rekomendasi untuk menangani error di frontend!

### 📋 Kode Error HTTP dan Penanganan
| Kode Error | Arti | Aksi Frontend |
|------------|------|----------------|
| `400 Bad Request` | Input pengguna tidak valid (misal: password kurang panjang) | Tampilkan pesan error dari field `detail` ke pengguna |
| `401 Unauthorized` | Token tidak ada / kadaluarsa | Refresh token jika bisa; jika tidak, redirect ke login |
| `403 Forbidden` | Tidak punya izin (misal: akses endpoint admin tapi bukan staff) | Tampilkan pesan "Anda tidak memiliki izin untuk mengakses halaman ini" |
| `404 Not Found` | Data tidak ditemukan (misal: kanji dengan ID tersebut tidak ada) | Tampilkan halaman "Tidak Ditemukan" / pesan error |
| `429 Too Many Requests` | Rate limit terlampaui (jika kamu menambahkannya) | Tampilkan pesan "Silakan coba lagi nanti" |
| `500 Internal Server Error` | Server mengalami masalah (bug di backend) | Tampilkan pesan "Terjadi kesalahan di server. Silakan coba lagi nanti" dan catat error ke logging service (misal Sentry) |
| **Network Error** | Tidak ada koneksi internet / server down | Tampilkan halaman offline / pesan "Periksa koneksi internet Anda" dan gunakan **cache offline** (IndexedDB) jika ada! |

### 💡 Contoh Implementasi Error Handling di Next.js
```javascript
// lib/api.js
import { toast } from 'react-toastify';

export async function apiFetch(url, options = {}) {
  const token = getAccessTokenFromCookie();
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { detail: 'Terjadi kesalahan' };
      }

      if (response.status === 401) {
        // Coba refresh token
        const refreshed = await refreshToken();
        if (refreshed) {
          return apiFetch(url, options); // Ulangi request dengan token baru
        } else {
          // Refresh gagal, logout
          logoutUser();
          router.push('/login');
          return;
        }
      }

      throw new Error(errorData.detail || `Error ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error.message.includes('Failed to fetch')) {
      toast.error('Periksa koneksi internet Anda!');
    } else {
      toast.error(error.message);
    }
    throw error;
  }
}
```

---

Selamat coding dan integrasi! 🚀 Jika ada perubahan endpoint, update dokumen ini agar tetap sinkron!
