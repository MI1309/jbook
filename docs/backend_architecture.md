# Arsitektur Backend dan SOLID

Dokumen ini mencatat kondisi backend yang teramati, bukan target ideal atau sertifikasi kepatuhan. Penilaian terakhir: 6 November 2026.

## Cakupan dan Kesimpulan

Backend berada di `backend/` dan menggunakan Django serta Django Ninja. `core/api.py` merakit router domain `users`, `content`, `learning`, dan admin; tiap app juga memiliki model, schema, dan sebagian helper atau view sendiri.

**Kesimpulan:** backend sudah memiliki pemisahan modul berdasarkan domain dan beberapa helper yang terfokus, tetapi belum menerapkan SOLID secara konsisten di tingkat workflow. Pola yang paling kuat saat ini adalah pemisahan app dan schema. Gap yang paling terlihat ada pada handler yang menggabungkan beberapa tanggung jawab, branching lintas tipe fitur yang tersebar, dan ketergantungan workflow langsung pada infrastruktur Django. Ini penilaian arsitektur praktis, bukan alasan untuk memaksakan layer tambahan pada setiap endpoint.

## Penilaian Prinsip

| Prinsip | Status saat ini | Bukti dan batasan |
|---|---|---|
| **S — Single Responsibility** | Sebagian | Router dipisah menurut domain, dan [serializer grammar](../backend/content/grammar_relations.py) memusatkan pembentukan data response. Namun [permintaan reset password](../backend/users/api.py) juga mencari user, membuat token/OTP, memilih URL, mengelola cache, dan mengirim email. `generate_quiz` di [learning/api.py](../backend/learning/api.py) menggabungkan pemilihan sumber soal, aturan visibilitas, sampling, distractor, dan pembentukan response. `get_analytics` mengagregasi beberapa jenis materi sekaligus. |
| **O — Open/Closed** | Belum konsisten | Pemisahan helper dan serializer memberi beberapa tempat perubahan yang terlokalisasi. Sebaliknya, `generate_quiz`, `submit_quiz`, dan `get_analytics` memiliki cabang per tipe materi. Menambah tipe soal baru berpotensi mengharuskan perubahan di beberapa workflow tersebut. |
| **L — Liskov Substitution** | Belum cukup bukti | Ada subclass autentikasi seperti `AuthBearer` di `users/api.py` dan `content/api.py`, tetapi sampel ini belum menunjukkan kumpulan implementasi alternatif atau kontrak perilaku yang cukup untuk menilai substitusi secara sistematis. Tidak ditemukan dasar kuat untuk menyatakan ada atau tidak ada pelanggaran LSP. |
| **I — Interface Segregation** | Cukup baik pada schema; selain itu belum cukup bukti | Schema request/response di [learning/serializers.py](../backend/learning/serializers.py) umumnya spesifik pada kebutuhan endpoint, bukan satu schema besar untuk semua operasi. Namun application service interface yang sempit belum tampak sebagai pola umum. Karena Django banyak memakai model dan framework secara langsung, bukti pelanggaran ISP yang spesifik masih terbatas. |
| **D — Dependency Inversion** | Belum konsisten | Handler menggunakan ORM/queryset, cache Django, fungsi email, settings, dan integrasi eksternal secara langsung. Contohnya `password_reset_request` memanggil `cache` dan `send_mail`, sementara handler learning bekerja langsung dengan model. Test seperti [users/tests.py](../backend/users/tests.py) dapat mengganti email backend atau patch fungsi, tetapi seam tersebut terutama dipakai pada pengujian, bukan abstraction boundary aplikasi yang konsisten. Pemakaian ORM langsung sendiri adalah pola Django yang wajar; perhatian utamanya adalah workflow bisnis dan layanan infrastruktur yang terlalu rapat di satu handler. |

## Pola yang Sudah Membantu

- `core/api.py` menjadi composition root sederhana untuk memasang router domain.
- Schema Django Ninja/Pydantic memvalidasi kontrak endpoint dengan tipe dan batas nilai, termasuk schema pembaruan vocab di [learning/serializers.py](../backend/learning/serializers.py).
- Helper domain seperti [grammar_relations.py](../backend/content/grammar_relations.py) memisahkan serialisasi dari beberapa pemanggil.
- Model menggunakan constraint database untuk invariants yang perlu dijaga, misalnya keunikan vocab tersimpan per user dan batas `box_level` di [learning/models.py](../backend/learning/models.py).
- Test endpoint dan model memeriksa perilaku seperti otorisasi, validasi profile, privasi email, dan klaim poin TTS yang idempotent.

## Arah Perbaikan Bertahap

1. Pertahankan endpoint sebagai boundary HTTP: parsing request, auth, pemanggilan use case, dan pemetaan hasil ke response. Pisahkan workflow hanya ketika fungsi tumbuh atau perubahan bisnis mulai punya alasan berubah yang berbeda.
2. Mulai dari alur yang punya cabang berulang, seperti generate/submit/analytics quiz. Ekstrak strategi per tipe soal atau registry sederhana bila tipe baru memang sering ditambahkan; jangan membangun plugin framework sebelum ada kebutuhan.
3. Pisahkan efek eksternal yang berubah atau sulit diuji, seperti pengiriman email reset password, ke fungsi/service kecil dengan kontrak yang jelas. Mock atau fake kontrak itu pada test workflow.
4. Biarkan ORM tetap digunakan untuk operasi Django biasa. Tambahkan repository abstraction hanya jika ada kebutuhan nyata seperti beberapa sumber persistence, query kompleks yang dipakai lintas use case, atau pengujian yang perlu memisahkan aturan bisnis dari database.
5. Pertahankan schema request/response yang spesifik dan constraint database. Tambahkan test kontrak saat handler atau workflow dipisahkan agar perilaku API tetap stabil.

Penerapan SOLID sebaiknya dilakukan bertahap pada titik perubahan yang memang mahal atau rawan, bukan sebagai refactor menyeluruh tanpa kebutuhan fitur.