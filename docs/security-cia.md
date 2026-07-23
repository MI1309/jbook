# Keamanan Aplikasi: CIA Triad

Dokumentasi implementasi **C**onfidentiality (Kerahasiaan), **I**ntegrity (Integritas), dan **A**vailability (Ketersediaan) pada aplikasi JBook.

---

## 1. Confidentiality (Kerahasiaan)
Hanya pihak yang berwenang yang bisa mengakses data latihan user.

### Implementasi:
- **Backend**:
  - Semua endpoint `/api/learning/practice/*` (submit, analytics, export, import, reset) dilindungi dengan `JWTAuth()` → hanya user yang login bisa akses
  - Semua query `QuizAttempt` dan `UserProgress` selalu filter `user=user` → user hanya bisa melihat/memodifikasi data sendiri

- **Frontend**:
  - Data guest disimpan di `localStorage` → hanya user itu sendiri yang bisa akses di browser yang sama (Same Origin Policy)

---

## 2. Integrity (Integritas)
Data tidak bisa dimanipulasi secara tidak sah dan tetap konsisten.

### Implementasi:
- **Backend**:
  - Endpoint import `/api/learning/practice/import` pakai `transaction.atomic()` → jika ada error, rollback semua perubahan (tidak data setengah terimpor)
  - Validasi existence ID sebelum import → hanya import item yang memang ada di database (kanji, vocab, grammar, particle, minna_question)
  - Cek duplikasi sebelum import → tidak bisa double import attempt yang sama (berdasarkan target_id, is_correct, dan timestamp ±1 detik)

- **Frontend**:
  - `localStorage` diproteksi Same Origin Policy → script dari domain lain tidak bisa baca/ubah data

---

## 3. Availability (Ketersediaan)
Data dan layanan bisa diakses kapanpun dibutuhkan, termasuk fitur backup manual.

### Implementasi:
- **Backup Manual**:
  - Fitur **Export** di Dashboard → user bisa export semua data latihan (attempts + progress, termasuk data Kakitori)
  - Fitur **Import** di Dashboard → user bisa import kembali data yang sudah diexport
  - Format export: JSON yang mudah dibaca dan dipindahkan

- **Guest Mode**:
  - Data guest disimpan di `localStorage` → bisa diakses tanpa koneksi internet (kecuali untuk fitur yang butuh backend)

- **Server**:
  - Database terpisah → layanan masih bisa berjalan jika frontend down, dan sebaliknya

---

## Ringkasan Fitur Keamanan
| Prinsip       | Implementasi Utama                                                                 |
|----------------|-------------------------------------------------------------------------------------|
| Confidentiality | JWT Auth untuk user login; Filter user di semua query; localStorage untuk guest    |
| Integrity       | Transaction atomic di import; Validasi ID existence; Cek duplikasi                 |
| Availability    | Export/Import data; Guest mode dengan localStorage; Arsitektur terpisah FE-BE       |
