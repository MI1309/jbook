# Logika Relasi Data: Integrasi Kanji & Kotoba

Dokumen ini menjelaskan mekanisme teknis yang digunakan untuk menghubungkan karakter Kanji dengan kosa kata secara relasional di dalam aplikasi JBook.

## 1. File Terkait

### Frontend (Logika Pembedahan)
- **[components/KotobaDetailModal.jsx](file:///home/imron/jbook/frontend-web/components/KotobaDetailModal.jsx)**: Lokasi utama fungsi `extractKanji` yang membedah kata menjadi karakter kanji penyusun.
- **[components/KanjiDetailModal.jsx](file:///home/imron/jbook/frontend-web/components/KanjiDetailModal.jsx)**: Menampilkan kosa kata yang menggunakan Kanji tersebut sebagai contoh kata (Examples).
- **[lib/db.js](file:///home/imron/jbook/frontend-web/lib/db.js)**: Menyediakan akses cepat ke IndexedDB untuk mencocokkan karakter yang ditemukan dengan database detail Kanji.

### Backend (Struktur Data)
- **[backend/content/models.py](file:///home/imron/jbook/backend/content/models.py)**: Definisi model `Kanji` dan `Kotoba`. Hubungan antara keduanya bersifat implisit (melalui pencocokan string) untuk fleksibilitas database.

## 2. Pembedahan Kata (Kanji Dissection)
Saat menampilkan sebuah kosa kata (Kotoba), sistem melakukan pembedahan melalui algoritma berikut:

### Langkah-langkah Teknis:
1.  **Regex Filtering**: Menggunakan regex `[\u4e00-\u9faf]` untuk mendeteksi karakter yang masuk kategori Kanji dari sebuah string kosa kata.
2.  **Unification**: Menggunakan `Set` untuk memastikan karakter yang sama tidak muncul dua kali dalam daftar bedah kanji (misal: kata `人々` akan hanya menampilkan satu entitas `人`).
3.  **Local Lookup**: Setiap karakter yang ditemukan dikirim ke fungsi `getKanjiByChar(char)` di `lib/db.js` untuk mengambil makna (meaning) dan cara baca (onyomi/kunyomi).
4.  **Rendering**: Menampilkan kartu kecil di bawah detail Kotoba yang memungkinkan user "masuk" ke detail Kanji penyusun tersebut tanpa meninggalkan konteks.

## 3. Pemetaan Contoh Kata (Example Mapping)
Sebaliknya, saat menampilkan detail Kanji, sistem mencari kosa kata yang mengandung karakter tersebut.

### Alur Pencarian:
1.  **Backend Filter**: API `/api/content/kotoba?search=X` (di mana X adalah Kanji tersebut) dipanggil.
2.  **Strict Matching**: Backend mencari di kolom `word` dan `reading` yang mengandung karakter tersebut.
3.  **Categorization**: Contoh kata diurutkan berdasarkan level JLPT yang sama dengan Kanji tersebut untuk memastikan relevansi kesulitan materi.

## 4. Keuntungan Arsitektur Ini
- **Data Integrity**: Tidak perlu mendefinisikan *Many-to-Many relationship* secara manual di database yang akan memperberat migrasi data.
- **Dynamic Linking**: Jika ada penambahan kosa kata baru di database, secara otomatis kosa kata tersebut akan muncul sebagai contoh di halaman Kanji yang bersangkutan.
- **Offline Capability**: Karena pembedahan dilakukan di frontend, fitur ini tetap berjalan 100% meskipun user sedang offline (menggunakan data dari IndexedDB).

---
*Relasi data yang cerdas memungkinkan pengalaman belajar yang terhubung dan komprehensif.*
