# Dokumentasi JBook

Pintu masuk dokumentasi JBook: arsitektur sistem, rincian fitur, panduan operasional, keamanan, dan referensi API. Dokumen mencatat implementasi yang teramati; verifikasi source tetap diperlukan sebelum mengubah perilaku.

Terakhir diperbarui: 2026-11

## Navigasi

| Area | Isi |
|---|---|
| Arsitektur | [Overview](architecture/overview.md), [frontend](architecture/frontend.md), [backend](architecture/backend.md), [integrasi API](architecture/api-integration.md), [schema database](architecture/database-schema.md), dan [relasi database](architecture/database-relationships.md). |
| Fitur | [Inventaris](features/overview.md), [detail latihan](features/frontend-logic-reference.md), [analitik](features/data-insights.md), [Bunpo](features/bunpo-schema.md), [relasi Kanji–Kotoba](features/kanji-kotoba-relations.md), [Doukai](features/doukai.md), serta dokumentasi fitur lain. |
| Panduan | [Pengembangan](guides/development.md), [setup backend](guides/backend-setup.md), [testing](guides/testing.md), [deployment](guides/testing-deployment.md), logging, SEO, dan design system. |
| Keamanan | [Audit](security/audit-report.md), [CIA](security/cia.md), enkripsi email, dan catatan perbaikan. |
| Arsip | [Catatan logika backend lama](archive/legacy-backend-logic.md) dan [progres proyek](archive/progress.md); periksa tanggal dan klaim sebelum digunakan. |
| [Referensi API](#referensi-api) | Ringkasan endpoint Django Ninja di bawah. |

Backend juga memiliki [backend/scripts/README.md](../backend/scripts/README.md), yang tetap berada di dekat skripnya.

## Referensi API

API JBook dibangun menggunakan **Django Ninja** untuk validasi tipe data dan penyusunan endpoint.

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

## 4. Minna Practice API (`/learning`)

Digunakan untuk kuis latihan terstruktur berbasis buku Minna no Nihongo 1 & 2.

*   `GET /learning/practice/minna/generate`
    *   **Deskripsi**: Membuat kuis terstruktur berdasarkan buku Minna no Nihongo.
    *   **Query Params**:
        *   `book`: Nomor buku Minna (misal: `1`, `2`, atau `1,2`).
        *   `chapter`: Nomor bab (bisa range atau koma separated, misal `1,2,3,4,5`).
        *   `type`: Jenis kuis (`choice`, `fill_blank`, `context_match`).
        *   `limit`: Batas jumlah kuis (default: 10, maks: 50).
        *   `level`: Tingkat JLPT jika relevan.
    *   **Response (per soal)**:
        *   `id` (str): UUID soal.
        *   `character` (str): Soal bahasa Jepang (atau arti bahasa Indonesia untuk context_match).
        *   `type` (str): Selalu `"minna"`.
        *   `question_type` (str): Jenis kuis (`doukai`, `fill_blank`, dst).
        *   `shown_translation` (str): Terjemahan khusus untuk kuis Doukai.
        *   `is_translation_correct` (bool): Kunci jawaban untuk kuis Doukai.
        *   `correct_answer` (str): Teks jawaban yang benar.
        *   `options` (array of objects): Pilihan jawaban dengan properti `text` dan `is_correct`.
        *   `explanation` (str): Penjelasan setelah soal dijawab.

---

## 5. Doukai API (`/learning/doukai`)

Modul latihan pemahaman bacaan (Reading Comprehension).

*   `GET /learning/doukai/count`
    *   **Deskripsi**: Mengecek jumlah total teks cerita yang tersedia.
*   `GET /learning/doukai/passages`
    *   **Deskripsi**: Mengambil daftar teks cerita.
    *   **Query Params**: `book`, `chapter`.
*   `GET /learning/doukai/passages/{uuid}`
    *   **Deskripsi**: Detail cerita beserta daftar soal Benar/Salah (Maru/Batsu).

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
