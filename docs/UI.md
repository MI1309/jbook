# JBook UI Documentation

Dokumentasi ini menjelaskan implementasi antarmuka pengguna (UI) untuk fitur-fitur baru dan perubahan yang telah diterapkan di JBook, baik di sisi **Frontend Web** (`frontend-web`) maupun **Mobile App** (`jbook_mobile`).

---

## 1. Halaman Latihan & Kuis Kanji

Perilaku kuis latihan Kanji telah disesuaikan agar proses belajar lebih menantang dan bersih:
* **Prinsip**: Cara baca Onyomi & Kunyomi dari Kanji tetap disimpan di database dan tetap muncul di halaman detail Kanji. Namun, pada antarmuka kuis/latihan saat menjawab soal, cara baca tersebut disembunyikan agar pengguna benar-benar fokus menebak arti dari Kanji tersebut.
* **Tipe Kuis**: Hanya berlaku untuk pertanyaan bertipe `'kanji'`.

### Implementasi Frontend Web (`frontend-web`)
* **File**: `frontend-web/components/practice/PracticeRunner.jsx`
* **Perubahan**:
  1. **Bantuan Bacaan (Furigana)**: Tag `<rt>` (ruby text) dinonaktifkan untuk kuis Kanji sehingga cara baca di atas huruf Kanji tidak muncul selama pengerjaan kuis.
  2. **Detail Jawaban**: Setelah kuis dijawab (`isAnswered` bernilai `true`), panel jawaban hanya merender arti kata (`currentQuestion.meaning`), dan secara eksplisit menyembunyikan string cara baca (`currentQuestion.reading`).

### Implementasi Mobile App (`jbook_mobile`)
* **File**: `jbook_mobile/lib/screens/practice_quiz_screen.dart`
* **Perubahan**:
  - Setelah kuis dijawab (`_isAnswered` bernilai `true`), widget `Text(question.reading ?? ...)` yang berisi cara baca Onyomi/Kunyomi disembunyikan jika tipe pertanyaannya adalah kuis Kanji (`question.type == 'kanji'`), sehingga hanya widget arti (`Text(question.meaning ?? ...)`) yang ditampilkan di bawah karakter Kanji.

---

## 2. Perubahan Bentuk Kata Kerja (9 Bentuk Conjugation)

Untuk membantu pengguna memahami perubahan kata kerja (verb conjugation) pada tingkat dasar (JLPT N5 dan N4), halaman detail kosakata (Kotoba) kini dilengkapi dengan panel informasi perubahan bentuk kata kerja secara otomatis.

### Kriteria Kosakata yang Memiliki Perubahan Bentuk:
1. Tergolong sebagai kata kerja (`word_type` bernilai `'godan'`, `'ichidan'`, atau `'suru'`).
2. Berada di tingkat JLPT N5 atau N4.

### 9 Bentuk Perubahan yang Ditampilkan:
1. **Kamus (Biasa / Kamus)**: Bentuk dasar/kamus (misal: `食べる`, `会う`, `勉強する`).
2. **Masu (Sopan)**: Bentuk sopan present (misal: `食べます`, `会います`, `します`).
3. **Te (Permohonan / Penghubung)**: Bentuk menyambung kalimat / permintaan (misal: `食べて`, `会って`, `して`).
4. **Ta (Masa Lalu Biasa)**: Bentuk lampau biasa/casual (misal: `食べた`, `会った`, `した`).
5. **Nai (Negatif Biasa)**: Bentuk tidak/casual (misal: `食べない`, `会わない`, `しない`).
6. **Nakatta (Negatif Lampau)**: Bentuk tidak lampau/casual (misal: `食べなかった`, `会わなかった`, `しなかった`).
7. **Volitional (Ajakan)**: Bentuk ajakan/maksud melakukan sesuatu (misal: `食べよう`, `会おう`, `しよう`).
8. **Conditional (Syarat)**: Bentuk pengandaian "jika..." (misal: `食べれば`, `会えば`, `すれば`).
9. **Potential (Bisa / Kemampuan)**: Bentuk kemampuan "bisa..." (misal: `食べられる`, `会える`, `できる`).

### Tampilan Desain UI (`frontend-web`)
* **File**: `frontend-web/components/kotoba/KotobaDetailUI.jsx`
* **Komponen**: Diletakkan secara dinamis tepat di bawah bagian "Bedah Kanji".
* **Visual**:
  - Menggunakan tata letak grid responsif (`grid-cols-1 sm:grid-cols-2`).
  - Setiap bentuk diletakkan dalam kartu kecil dengan gaya latar belakang yang menyesuaikan dengan tema terang/gelap (Dark Mode).
  - Teks bentuk menggunakan font berbobot hitam tebal (`font-black`), disertai dengan cara baca Hiragana kecil di sampingnya agar memudahkan pemula membaca kanji hasil konjugasi.
