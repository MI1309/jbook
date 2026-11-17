# Arsitektur Backend dan SOLID

Dokumen ini menjelaskan pembagian modul backend Django dan kondisi penerapan prinsip SOLID yang teramati.

Terakhir diperbarui: 2026-11

Dokumen ini mencatat kondisi backend yang teramati, bukan target ideal atau sertifikasi kepatuhan. Penilaian terakhir: 6 November 2026.

## Cakupan dan Kesimpulan

Backend berada di `backend/` dan menggunakan Django serta Django Ninja. `backend/core/api.py` merakit router domain `users`, `content`, `learning`, dan admin; tiap app juga memiliki model, schema, dan sebagian helper atau view sendiri.

**Kesimpulan:** backend memiliki fondasi modular yang layak, tetapi belum bisa disebut solid secara menyeluruh. Pemisahan app domain, schema, management command, dan beberapa service sudah nyata. Yang masih rapuh adalah workflow penting yang besar dan bercabang, serta skrip operasional yang tersebar antara root backend dan `backend/scripts/`. Jadi: cukup solid untuk dikembangkan dengan pola Django saat ini, belum cukup konsisten untuk menyatakan batas aplikasi dan tanggung jawabnya sudah rapi.

## Penilaian Prinsip

| Prinsip | Status saat ini | Bukti dan batasan |
|---|---|---|
| **S — Single Responsibility** | Sebagian, membaik pada quiz, reset, dan analytics | Router dipisah menurut domain; [backend/content/grammar_relations.py](../../backend/content/grammar_relations.py) memusatkan serialisasi grammar; [backend/learning/quiz/strategies.py](../../backend/learning/quiz/strategies.py) memisahkan pembangkitan per tipe. Endpoint reset di [backend/users/api.py](../../backend/users/api.py) mendelegasikan lookup, pemilihan URL, dan pengiriman ke `request_password_reset` di [backend/users/services.py](../../backend/users/services.py). Analytics wrong stats kini dihitung per sumber oleh modul di [backend/learning/analytics](../../backend/learning/analytics), sedangkan aggregator menjaga total, level, dan kakitori. |
| **O — Open/Closed** | Belum konsisten, membaik pada quiz generation dan analytics | Jenis quiz kanji, vocab, grammar, dan kana dipetakan di [backend/learning/quiz/registry.py](../../backend/learning/quiz/registry.py), sehingga pembangkitan tidak lagi memiliki cabang per tipe di `backend/learning/api.py`. Analytics memusatkan sumber wrong stats lewat modul tersendiri, tetapi sumber tetap didaftarkan eksplisit di [backend/learning/analytics/aggregator.py](../../backend/learning/analytics/aggregator.py) dan [backend/learning/analytics/other.py](../../backend/learning/analytics/other.py). `submit_quiz` masih memiliki pemetaan per tipe materi. |
| **L — Liskov Substitution** | Belum cukup bukti | Ada subclass autentikasi seperti `AuthBearer` di `backend/users/api.py` dan `backend/content/api.py`, tetapi sampel ini belum menunjukkan kumpulan implementasi alternatif atau kontrak perilaku yang cukup untuk menilai substitusi secara sistematis. Tidak ditemukan dasar kuat untuk menyatakan ada atau tidak ada pelanggaran LSP. |
| **I — Interface Segregation** | Cukup baik pada schema; selain itu belum cukup bukti | Schema request/response di [backend/learning/serializers.py](../../backend/learning/serializers.py) umumnya spesifik pada kebutuhan endpoint, bukan satu schema besar untuk semua operasi. Namun application service interface yang sempit belum tampak sebagai pola umum. Karena Django banyak memakai model dan framework secara langsung, bukti pelanggaran ISP yang spesifik masih terbatas. |
| **D — Dependency Inversion** | Belum konsisten | `request_password_reset` dan `send_reset_email` di [backend/users/services.py](../../backend/users/services.py) dapat diuji terpisah dari HTTP, tetapi service masih menggunakan ORM, cache, settings, dan email Django secara langsung. Handler learning juga bekerja langsung dengan model/ORM. Belum ada kontrak infrastruktur yang dipakai konsisten lintas use case. Pemakaian ORM langsung sendiri adalah pola Django yang wajar; perhatian utamanya adalah workflow bisnis yang rapat dengan efek eksternal dan sulit diuji terpisah. |

## Penilaian Struktur Folder

Struktur domain utamanya sudah masuk akal: `users`, `content`, dan `learning` masing-masing memiliki model, API, test, dan migrasi; `backend/core/api.py` memasang router; command impor/pemeliharaan yang berulang sudah berada di `management/commands`. Helper bersama dikumpulkan dalam `backend/utils/`, sedangkan helper khusus konten tetap di `backend/content/`.

Skrip tetap tersebar di root `backend/` dan `backend/scripts/`; tidak ada entry point yang dipindah atau dihapus. [backend/scripts/README.md](../../backend/scripts/README.md) kini menginventarisasi 40 script di `backend/scripts/`, 8 script root, data pendukung, status dukungan, cara pakai, kepemilikan (belum diketahui), serta kandidat management command. Header skrip yang belum terkonfirmasi diberi label eksperimental. Peta struktur proyek yang lebih rinci ada di [overview repository](overview.md).

**Verdict:** fondasi domain solid; konsistensi workflow dan tata kelola tooling belum solid. Tidak disarankan memindahkan semua file sekaligus karena deployment atau skrip lama mungkin bergantung pada path sekarang.

## Pola yang Sudah Membantu

- `backend/core/api.py` menjadi composition root sederhana untuk memasang router domain.
- Schema Django Ninja/Pydantic memvalidasi kontrak endpoint dengan tipe dan batas nilai, termasuk schema pembaruan vocab di [backend/learning/serializers.py](../../backend/learning/serializers.py).
- Helper domain seperti [backend/content/grammar_relations.py](../../backend/content/grammar_relations.py) memisahkan serialisasi dari beberapa pemanggil.
- Model menggunakan constraint database untuk invariants yang perlu dijaga, misalnya keunikan vocab tersimpan per user dan batas `box_level` di [backend/learning/models.py](../../backend/learning/models.py).
- Test endpoint dan model memeriksa perilaku seperti otorisasi, validasi profile, privasi email, dan klaim poin TTS yang idempotent.
- Pembangkitan quiz menggunakan kontrak `generate(level, count, options)` pada strategi; alias `kotoba`/`vocab` dan `bunpo`/`grammar` berbagi strategi. Test strategi berada di [backend/learning/test_quiz_strategies.py](../../backend/learning/test_quiz_strategies.py). Particle tetap dikecualikan dari practice karena itulah perilaku endpoint yang sudah ada.
- Workflow reset password di [backend/users/services.py](../../backend/users/services.py) mengembalikan `ResetOutcome`; URL Origin/Referer/konfigurasi dan hasil tidak ditemukannya akun/email gagal diuji di `backend/users/tests.py`. Response HTTP lama dipertahankan.
- Analytics endpoint di [backend/learning/api.py](../../backend/learning/api.py) mendelegasikan ke aggregator; kanji, vocab, grammar, serta particle/minna dihitung terpisah. Perhitungan kakitori berada di modul tersendiri. Response analytics dan schema endpoint tidak berubah.

## Arah Perbaikan Bertahap

1. Quiz generation telah diekstrak ke strategi dan registry tanpa mengubah schema endpoint; perubahan berikutnya perlu mempertahankan perilaku visibility, sampling, aliases, dan unit filter.
2. Service reset sudah menangani lookup dan pemilihan URL; isolasi provider cache/email dari service dapat dipertimbangkan kelak bila kebutuhan provider atau test menuntutnya.
3. Analytics wrong stats telah dipisah per sumber dan aggregator mempertahankan total, level, serta kakitori. Perubahan berikutnya perlu menambah sumber di modul dan aggregator dengan test response yang setara.
4. Inventaris skrip tersedia di [backend/scripts/README.md](../../backend/scripts/README.md). Verifikasi pemilik, dependensi, dan cara deploy sebelum memindahkan atau mengganti entry point; migrasi management command belum dilakukan.
5. Biarkan ORM digunakan untuk operasi Django biasa. Tambahkan repository abstraction hanya jika ada kebutuhan nyata. Pertahankan schema endpoint yang spesifik dan constraint database.

Penerapan SOLID sebaiknya dilakukan bertahap pada titik perubahan yang memang mahal atau rawan, bukan sebagai refactor menyeluruh tanpa kebutuhan fitur.
