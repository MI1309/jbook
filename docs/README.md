# JBook API Documentation

Selamat datang di dokumentasi API JBook. API ini dibangun menggunakan **Django Ninja** untuk kecepatan dan validasi tipe data yang kuat.

## Base URL
Semua endpoint di bawah ini memiliki prefix:
`https://[domain-anda]/api`

---

## 1. Content API (`/content`)

Digunakan untuk mengambil data materi bahasa Jepang.

### **Kanji**
*   `GET /content/kanji`
    *   **Deskripsi**: Mengambil daftar Kanji.
    *   **Query Params**:
        *   `level`: Filter tingkat JLPT (1-5).
        *   `search`: Mencari karakter atau arti.
        *   `page`: Halaman ke-n.
*   `GET /content/kanji/{uuid}`
    *   **Deskripsi**: Detail spesifik satu Kanji beserta contoh kosakatanya.

### **Kotoba (Vocab)**
*   `GET /content/kotoba`
    *   **Deskripsi**: Mengambil daftar kosakata.
    *   **Query Params**: `level`, `search`, `word_type`, `page`.
*   `GET /content/kotoba/{uuid}`
    *   **Deskripsi**: Detail spesifik satu kosakata.
*   `GET /content/random-kotoba`
    *   **Deskripsi**: Mengambil satu kosakata acak (untuk fitur "Word of the Day").

### **Grammar (Bunpo)**
*   `GET /content/bunpo`
    *   **Deskripsi**: Mengambil daftar pola tata bahasa.
    *   **Query Params**: `level`, `chapter`, `search`.
*   `GET /content/bunpo/{uuid}`
    *   **Deskripsi**: Detail pola tata bahasa dan contoh kalimat.

---

## 2. Learning API (`/learning`)

Digunakan untuk fitur latihan dan statistik pengguna. Membutuhkan autentikasi (Bearer Token).

*   `GET /learning/practice/generate`
    *   **Deskripsi**: Membuat kuis acak.
    *   **Query Params**:
        *   `type`: `kanji`, `vocab`, `grammar`, atau `particle`.
        *   `level`: Tingkat JLPT (bisa koma separated, misal `4,5`).
*   `POST /learning/practice/submit`
    *   **Deskripsi**: Mengirim hasil jawaban kuis untuk disimpan ke progres pengguna.
*   `GET /learning/practice/analytics`
    *   **Deskripsi**: Mengambil data statistik (akurasi, daftar kata yang sering salah).

---

## 3. Auth API (`/auth`)

Manajemen pengguna dan token.

*   `POST /auth/register`: Pendaftaran pengguna baru.
*   `POST /auth/login`: Login tradisional (Username/Email + Password).
*   `POST /auth/google`: Login menggunakan Google OAuth Token.
*   `GET /auth/me`: Mengambil data profil pengguna yang sedang login.

---

## Format Response Umum
Semua list endpoint menggunakan format paginasi berikut:

```json
{
  "items": [...],
  "total": 125,
  "page": 1,
  "pages": 3
}
```

## Autentikasi
Gunakan header Authorization untuk endpoint yang dilindungi:
`Authorization: Bearer <your_access_token>`
