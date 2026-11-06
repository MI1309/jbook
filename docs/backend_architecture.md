# Arsitektur Backend dan SOLID

Dokumen ini mencatat kondisi backend yang teramati, bukan target ideal atau sertifikasi kepatuhan. Penilaian terakhir: 6 November 2026.

## Cakupan dan Kesimpulan

Backend berada di `backend/` dan menggunakan Django serta Django Ninja. `core/api.py` merakit router domain `users`, `content`, `learning`, dan admin; tiap app juga memiliki model, schema, dan sebagian helper atau view sendiri.

**Kesimpulan:** backend memiliki fondasi modular yang layak, tetapi belum bisa disebut solid secara menyeluruh. Pemisahan app domain, schema, management command, dan beberapa service sudah nyata. Yang masih rapuh adalah workflow penting yang besar dan bercabang, serta skrip operasional yang tersebar antara root backend dan `scripts/`. Jadi: cukup solid untuk dikembangkan dengan pola Django saat ini, belum cukup konsisten untuk menyatakan batas aplikasi dan tanggung jawabnya sudah rapi.

## Penilaian Prinsip

| Prinsip | Status saat ini | Bukti dan batasan |
|---|---|---|
| **S — Single Responsibility** | Sebagian | Router dipisah menurut domain, [serializer grammar](../backend/content/grammar_relations.py) memusatkan pembentukan data response, dan [users/services.py](../backend/users/services.py) menangani token serta efek email/OTP reset password. Endpoint reset masih melakukan lookup user dan pemilihan URL. `generate_quiz` di [learning/api.py](../backend/learning/api.py) menggabungkan pemilihan sumber soal, aturan visibilitas, sampling, distractor, dan pembentukan response. `get_analytics` mengagregasi beberapa jenis materi sekaligus. |
| **O — Open/Closed** | Belum konsisten | Pemisahan helper dan serializer memberi beberapa tempat perubahan yang terlokalisasi. Sebaliknya, `generate_quiz`, `submit_quiz`, dan `get_analytics` memiliki cabang per tipe materi. Menambah tipe soal baru berpotensi mengharuskan perubahan di beberapa workflow tersebut. |
| **L — Liskov Substitution** | Belum cukup bukti | Ada subclass autentikasi seperti `AuthBearer` di `users/api.py` dan `content/api.py`, tetapi sampel ini belum menunjukkan kumpulan implementasi alternatif atau kontrak perilaku yang cukup untuk menilai substitusi secara sistematis. Tidak ditemukan dasar kuat untuk menyatakan ada atau tidak ada pelanggaran LSP. |
| **I — Interface Segregation** | Cukup baik pada schema; selain itu belum cukup bukti | Schema request/response di [learning/serializers.py](../backend/learning/serializers.py) umumnya spesifik pada kebutuhan endpoint, bukan satu schema besar untuk semua operasi. Namun application service interface yang sempit belum tampak sebagai pola umum. Karena Django banyak memakai model dan framework secara langsung, bukti pelanggaran ISP yang spesifik masih terbatas. |
| **D — Dependency Inversion** | Belum konsisten | [users/services.py](../backend/users/services.py) sudah mengisolasi sebagian efek reset password, tetapi service itu sendiri menggunakan cache, settings, dan email Django secara langsung. Handler learning juga bekerja langsung dengan model/ORM. Belum ada kontrak infrastruktur yang dipakai konsisten lintas use case. Pemakaian ORM langsung sendiri adalah pola Django yang wajar; perhatian utamanya adalah workflow bisnis yang rapat dengan efek eksternal dan sulit diuji terpisah. |

## Penilaian Struktur Folder

Struktur domain utamanya sudah masuk akal: `users`, `content`, dan `learning` masing-masing memiliki model, API, test, dan migrasi; `core/api.py` memasang router; command impor/pemeliharaan yang berulang sudah berada di `management/commands`. Helper bersama dikumpulkan dalam `utils/`, sedangkan helper khusus konten tetap di `content/`.

Bagian yang belum rapi adalah lapisan skrip: selain `backend/scripts/`, masih ada skrip utilitas di root (`batch_translate.py`, `cleanup_vocab.py`, `sync_n5.py`, dan lainnya). Direktori `scripts/` sendiri mencampur importer, pemeriksaan, skrip temporer, dan data progres. Ini belum otomatis merusak runtime, tetapi menyulitkan penemuan entry point dan membedakan tooling yang didukung dari eksperimen. Peta struktur proyek yang lebih rinci dan sesuai kondisi aktual ada di [folder_structure.md](folder_structure.md).

**Verdict:** fondasi domain solid; konsistensi workflow dan tata kelola tooling belum solid. Tidak disarankan memindahkan semua file sekaligus karena deployment atau skrip lama mungkin bergantung pada path sekarang.

## Pola yang Sudah Membantu

- `core/api.py` menjadi composition root sederhana untuk memasang router domain.
- Schema Django Ninja/Pydantic memvalidasi kontrak endpoint dengan tipe dan batas nilai, termasuk schema pembaruan vocab di [learning/serializers.py](../backend/learning/serializers.py).
- Helper domain seperti [grammar_relations.py](../backend/content/grammar_relations.py) memisahkan serialisasi dari beberapa pemanggil.
- Model menggunakan constraint database untuk invariants yang perlu dijaga, misalnya keunikan vocab tersimpan per user dan batas `box_level` di [learning/models.py](../backend/learning/models.py).
- Test endpoint dan model memeriksa perilaku seperti otorisasi, validasi profile, privasi email, dan klaim poin TTS yang idempotent.

## Arah Perbaikan Bertahap

1. Pertahankan endpoint sebagai boundary HTTP: parsing request, auth, pemanggilan workflow, dan pemetaan hasil ke response. Pisahkan workflow saat fungsi tumbuh atau aturan bisnis punya alasan berubah yang berbeda.
2. Mulai dari quiz: satukan pemetaan tipe konten ke strategi/helper teruji hanya bila tipe baru atau perubahan lintas tipe sering terjadi. Hindari framework plugin prematur.
3. Pertahankan service reset password yang ada, lalu tambahkan test untuk kontraknya dan untuk pemilihan URL/lookup endpoint. Ekstraksi lanjutan harus mengikuti kebutuhan test atau perubahan provider.
4. Rapikan skrip bertahap: identifikasi pemilik dan pemakaian skrip root, pindahkan operasi berulang yang layak ke management command, dan pisahkan skrip sekali pakai/eksperimen agar tidak tampak sebagai interface yang didukung. Jangan memindahkan entry point yang mungkin dipakai deployment sebelum dependensinya diperiksa.
5. Biarkan ORM digunakan untuk operasi Django biasa. Tambahkan repository abstraction hanya jika ada kebutuhan nyata. Pertahankan schema endpoint yang spesifik dan constraint database.

Penerapan SOLID sebaiknya dilakukan bertahap pada titik perubahan yang memang mahal atau rawan, bukan sebagai refactor menyeluruh tanpa kebutuhan fitur.
