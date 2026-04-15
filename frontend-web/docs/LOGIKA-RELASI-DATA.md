# Logika Relasi Data: Integrasi Kanji \u0026 Kotoba

Dokumen ini menjelaskan mekanisme teknis yang digunakan untuk menghubungkan karakter Kanji dengan kosa kata secara relasional di dalam aplikasi JBook.

## 1. Konsep Dasar "Deep Linking"
Aplikasi menggunakan data dari IndexedDB (Offline) sebagai sumber kebenaran utama untuk pemetaan relasi. Karena data mentah (raw data) sering kali tidak menyertakan ID relasi secara tertanam (embedded), sistem melakukan kalkulasi dinamis di sisi klien.

## 2. Pembedahan Kata (Kanji Dissection)
Saat menampilkan sebuah kosa kata (Kotoba), sistem melakukan dua tingkat pembedahan:

### A. Inline Interaction
String kata dipecah menjadi array karakter individu. Setiap karakter dicek menggunakan regex Kanji. Karakter yang terdeteksi sebagai Kanji dibungkus dengan komponen interaktif yang memungkinkan navigasi cepat.

### B. Unit Dissection (Visual Section)
Selain interaksi *inline*, sistem mengekstrak daftar unik karakter Kanji dari kata tersebut dan melakukan *prefetch* data detail dari database lokal. Karakter-karakter ini kemudian dirender dalam bagian "**Bedah Kanji (Karakter Penyusun)**" lengkap dengan:
- **Makna Dasar**: Arti Kanji tersebut dalam bahasa Indonesia.
- **Cara Baca**: On/Kunyomi utama untuk memberikan konteks bacaan dasar.
- **Navigasi Langsung**: Kartu detail mandiri yang menghubungkan ke halaman Kanji terkait.

## 3. Pemetaan Contoh Kata (Example Mapping)
Pada halaman detail Kanji, daftar contoh kata dihubungkan kembali ke database Kotoba:
- **Lookup**: Saat contoh kata diklik, sistem mencari di store `vocab` untuk menemukan entri yang memiliki field `word` yang sama.
- **Navigasi**: Jika ditemukan, sistem melakukan navigasi ke detail Kotoba tersebut. Jika tidak (misal data belum sinkron), sistem akan mengarahkan ke halaman pencarian Kotoba dengan query kata tersebut.

## 4. Penanganan Navigasi Modal (Modal-to-Modal)
Untuk menjaga konteks pencarian pengguna:
- Sistem mendukung transisi antar modal menggunakan URL query parameter `?detail=ID`.
- Hal ini memungkinkan pengguna untuk "melompat" dari Detail Kanji ke Detail Kotoba tanpa menutup modal utama, menjaga navigasi tetap *seamless*.

---
*Status: Terintegrasi via `api.js` dan `utils.js`*
