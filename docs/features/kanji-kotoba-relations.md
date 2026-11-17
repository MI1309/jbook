# Logika Relasi Data: Integrasi Kanji & Kotoba

Dokumen ini menjelaskan pemecahan Kanji dari Kotoba serta pembentukan contoh kosakata pada detail Kanji.

Terakhir diperbarui: 2026-11

Dokumen ini menjelaskan dua arah keterkaitan Kanji dan Kotoba yang saat ini digunakan JBook: pemecahan karakter Kanji dari sebuah kata di frontend, serta pemuatan contoh Kotoba saat detail Kanji diminta.

## 1. File Terkait

### Frontend
- [frontend-web/components/kotoba/KotobaDetailUI.jsx](../../frontend-web/components/kotoba/KotobaDetailUI.jsx): Memecah kata dan memuat detail untuk setiap Kanji penyusunnya.
- [frontend-web/components/kanji/KanjiDetailUI.jsx](../../frontend-web/components/kanji/KanjiDetailUI.jsx): Menampilkan `examples` dari respons detail Kanji dan menyediakan tautan pencarian Kotoba jika contoh kosong.
- [frontend-web/components/kotoba/KotobaDetailModal.jsx](../../frontend-web/components/kotoba/KotobaDetailModal.jsx) dan [frontend-web/components/kanji/KanjiDetailModal.jsx](../../frontend-web/components/kanji/KanjiDetailModal.jsx): Memuat data detail melalui helper API lalu meneruskannya ke UI.
- [frontend-web/lib/utils.js](../../frontend-web/lib/utils.js): Implementasi `extractKanji`, `hasKanji`, dan `isKanjiChar`.
- [frontend-web/lib/api.js](../../frontend-web/lib/api.js): Helper API, termasuk `getKanjiDetail`, `getVocabDetail`, dan `resolveContentId`.

### Backend
- [backend/content/models.py](../../backend/content/models.py): Model `Kanji` dan `Vocab` (Kotoba). `Vocab.kanji_rel` menyediakan relasi many-to-many opsional.
- [backend/content/api.py](../../backend/content/api.py): Endpoint detail Kanji membentuk contoh dinamis dengan mencocokkan karakter pada kolom `Vocab.word`.

## 2. Pembedahan Kata (Kanji Dissection)
Saat menampilkan detail Kotoba, `KotobaDetailUI` mengambil karakter dari `vocab.word` dan memuat detail Kanji melalui API.

1. Kata dinormalisasi dengan Unicode NFKC.
2. `extractKanji` mengambil karakter pada rentang `U+4E00–U+9FAF` dan `U+3400–U+4DBF`, lalu menggunakan `Set` untuk menghapus duplikat.
3. Untuk setiap karakter, frontend memanggil `resolveContentId('kanji', char)`. Jika ID ditemukan, detail diambil dari endpoint detail Kanji; bila tidak, frontend mencoba pencarian Kanji dengan `search` dan `limit=1`.
4. Permintaan detail dijalankan secara paralel. Hasil yang tersedia ditampilkan sebagai detail Kanji terkait pada UI Kotoba.

## 3. Pemetaan Contoh Kata (Example Mapping)
Saat detail Kanji diminta melalui endpoint `/content/kanji/{kanji_id}`, backend membentuk daftar contoh untuk ditampilkan di `KanjiDetailUI`.

1. Backend mengambil hingga 10 baris `Vocab` dengan pencocokan substring pada kolom `word` (`word__contains=kanji.character`). Pencarian dinamis ini tidak memeriksa kolom `reading`.
2. Hasil dinamis dipetakan ke `word`, `reading`, `meaning`, dan `type`.
3. Hasil tersebut digabung setelah `Kanji.examples` yang tersimpan. Kata yang sudah ada pada contoh tersimpan tidak ditambahkan lagi.
4. Pengambilan ini tidak mengurutkan berdasarkan level JLPT Kanji. Daftar Kotoba pada endpoint pencarian terpisah memiliki pengurutan dan filter sendiri.
5. Jika tidak ada contoh pada detail Kanji, UI menyediakan tautan untuk mencari karakter tersebut di halaman Kotoba. Tautan itu bukan sumber daftar contoh yang dimuat otomatis.

## 4. Keuntungan Arsitektur Ini
- **Contoh dinamis**: Kotoba yang cocok dengan karakter dapat ditambahkan ke respons detail Kanji tanpa menyimpan ulang daftar tersebut ke `Kanji.examples`.
- **Data statis dan dinamis**: `Kanji.examples` dapat menyimpan contoh pilihan, sedangkan backend melengkapi respons dengan hasil pencocokan dari `Vocab`.
- **Relasi eksplisit tersedia**: Model `Vocab` memiliki field many-to-many `kanji_rel`, tetapi pembentukan contoh dinamis pada endpoint detail Kanji saat ini menggunakan pencocokan teks pada `word`, bukan field tersebut.
- **Keterbatasan offline**: Pemecahan karakter berjalan di frontend, tetapi pemuatan detail Kanji dan Kotoba menggunakan API jaringan. Kode yang didokumentasikan di sini tidak menunjukkan lookup detail melalui IndexedDB, sehingga keseluruhan fitur relasi ini tidak dijamin berfungsi saat offline.

---
Dokumen ini mengikuti implementasi saat ini; perubahan pada endpoint atau model perlu diikuti pembaruan bagian terkait.
