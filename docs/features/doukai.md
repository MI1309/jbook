# Fitur Doukai (読解) - Reading Comprehension

Dokumen ini menjelaskan model konten dan alur latihan pemahaman bacaan Doukai.

Terakhir diperbarui: 2026-11

Fitur Doukai adalah modul latihan pemahaman bacaan yang didesain ulang untuk memberikan pengalaman membaca teks cerita Jepang yang lebih terstruktur.

## Perubahan Utama (Redesign)
1. **Model Data Baru**: Menggunakan `DoukaiPassage` dan `DoukaiQuestion` alih-alih `MinnaQuestion` tipe `doukai`.
2. **Admin Only**: Konten Doukai hanya bisa ditambah/edit oleh admin melalui Django Admin.
3. **Struktur Konten**: Satu passage (cerita) dapat memiliki banyak pertanyaan Benar/Salah (Maru/Batsu).
4. **Read-only List**: Halaman `/doukai` menampilkan daftar cerita yang tersedia.
5. **Interactive Exercise**: Halaman `/doukai/[id]` memberikan antarmuka latihan interaktif.

## Backend (Django)
### Model: `backend/content/models.py`
- `DoukaiPassage`: Menyimpan judul, teks Jepang, terjemahan Indonesia (opsional), serta metadata (buku, bab, level JLPT).
- `DoukaiQuestion`: Menyimpan pernyataan terkait passage, kunci jawaban (Benar/Salah), penjelasan, dan urutan tampil.

### API Endpoints: `backend/learning/api.py`
- `GET /api/learning/doukai/count`: Mengembalikan jumlah total passage yang ada. Digunakan untuk menonaktifkan tombol di UI jika data kosong.
- `GET /api/learning/doukai/passages`: Mengambil daftar passage (bisa difilter berdasarkan `book` dan `chapter`).
- `GET /api/learning/doukai/passages/{id}`: Mengambil detail satu passage beserta daftar soalnya.

## Frontend (Next.js)
### API Wrapper: `frontend-web/lib/api.js`
- `getDoukaiPassages(params)`
- `getDoukaiPassage(id)`
- `getDoukaiCount()`

### Halaman Utama: `/doukai`
Menampilkan grid kartu cerita. Setiap kartu menunjukkan level JLPT dan Bab (jika ada).

### Halaman Latihan: `/doukai/[id]`
- **Tampilan Teks**: Menggunakan font Japanese yang nyaman dibaca dengan `line-height` yang lebar.
- **Toggle Terjemahan**: User bisa melihat terjemahan Indonesia jika disediakan oleh admin.
- **Kuis Interaktif**: Menampilkan satu pertanyaan per tahap dengan animasi transisi.
- **Hasil Akhir**: Menampilkan skor dan review penjelasan untuk setiap jawaban.

## Alur Penggunaan Admin
1. Masuk ke Django Admin.
2. Buka menu **Doukai Passages**.
3. Tambahkan cerita baru.
4. Tambahkan beberapa **Doukai Questions** melalui inline form di bawah cerita.
5. Simpan. Fitur akan otomatis muncul di frontend.

## Data Migration
Data lama di `MinnaQuestion` dengan `question_type='doukai'` telah dihapus dan harus dipindahkan secara manual ke model baru jika ingin dipertahankan.
