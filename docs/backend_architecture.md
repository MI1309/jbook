# Arsitektur Backend dan SOLID

Dokumen ini mencatat kondisi backend yang teramati, bukan target ideal atau sertifikasi kepatuhan. Penilaian terakhir: 6 November 2026.

## Cakupan dan Kesimpulan

Backend berada di `backend/` dan menggunakan Django serta Django Ninja. `core/api.py` merakit router domain `users`, `content`, `learning`, dan admin; tiap app juga memiliki model, schema, dan sebagian helper atau view sendiri.

**Kesimpulan:** backend memiliki fondasi modular yang layak, tetapi belum bisa disebut solid secara menyeluruh. Pemisahan app domain, schema, management command, dan beberapa service sudah nyata. Yang masih rapuh adalah workflow penting yang besar dan bercabang, serta skrip operasional yang tersebar antara root backend dan `scripts/`. Jadi: cukup solid untuk dikembangkan dengan pola Django saat ini, belum cukup konsisten untuk menyatakan batas aplikasi dan tanggung jawabnya sudah rapi.

## Penilaian Prinsip

| Prinsip | Status saat ini | Bukti dan batasan |
|---|---|---|
| **S — Single Responsibility** | Sebagian, membaik pada quiz, reset, dan analytics | Router dipisah menurut domain; [grammar_relations.py](../backend/content/grammar_relations.py) memusatkan serialisasi grammar; [learning/quiz/strategies.py](../backend/learning/quiz/strategies.py) memisahkan pembangkitan per tipe. Endpoint reset di [users/api.py](../backend/users/api.py) mendelegasikan lookup, pemilihan URL, dan pengiriman ke `request_password_reset` di [users/services.py](../backend/users/services.py). Analytics wrong stats kini dihitung per sumber oleh modul di [learning/analytics/](../backend/learning/analytics/), sedangkan aggregator menjaga total, level, dan kakitori. |
| **O — Open/Closed** | Belum konsisten, membaik pada quiz generation dan analytics | Jenis quiz kanji, vocab, grammar, dan kana dipetakan di [learning/quiz/registry.py](../backend/learning/quiz/registry.py), sehingga pembangkitan tidak lagi memiliki cabang per tipe di `learning/api.py`. Analytics memusatkan sumber wrong stats lewat modul tersendiri, tetapi sumber tetap didaftarkan eksplisit di [learning/analytics/aggregator.py](../backend/learning/analytics/aggregator.py) dan [learning/analytics/other.py](../backend/learning/analytics/other.py). `submit_quiz` masih memiliki pemetaan per tipe materi. |
| **L — Liskov Substitution** | Belum cukup bukti | Ada subclass autentikasi seperti `AuthBearer` di `users/api.py` dan `content/api.py`, tetapi sampel ini belum menunjukkan kumpulan implementasi alternatif atau kontrak perilaku yang cukup untuk menilai substitusi secara sistematis. Tidak ditemukan dasar kuat untuk menyatakan ada atau tidak ada pelanggaran LSP. |
| **I — Interface Segregation** | Cukup baik pada schema; selain itu belum cukup bukti | Schema request/response di [learning/serializers.py](../backend/learning/serializers.py) umumnya spesifik pada kebutuhan endpoint, bukan satu schema besar untuk semua operasi. Namun application service interface yang sempit belum tampak sebagai pola umum. Karena Django banyak memakai model dan framework secara langsung, bukti pelanggaran ISP yang spesifik masih terbatas. |
| **D — Dependency Inversion** | Belum konsisten | `request_password_reset` dan `send_reset_email` di [users/services.py](../backend/users/services.py) dapat diuji terpisah dari HTTP, tetapi service masih menggunakan ORM, cache, settings, dan email Django secara langsung. Handler learning juga bekerja langsung dengan model/ORM. Belum ada kontrak infrastruktur yang dipakai konsisten lintas use case. Pemakaian ORM langsung sendiri adalah pola Django yang wajar; perhatian utamanya adalah workflow bisnis yang rapat dengan efek eksternal dan sulit diuji terpisah. |

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
- Pembangkitan quiz menggunakan kontrak `generate(level, count, options)` pada strategi; alias `kotoba`/`vocab` dan `bunpo`/`grammar` berbagi strategi. Test strategi berada di [learning/test_quiz_strategies.py](../backend/learning/test_quiz_strategies.py). Particle tetap dikecualikan dari practice karena itulah perilaku endpoint yang sudah ada.
- Workflow reset password di [users/services.py](../backend/users/services.py) mengembalikan `ResetOutcome`; URL Origin/Referer/konfigurasi dan hasil tidak ditemukannya akun/email gagal diuji di `users/tests.py`. Response HTTP lama dipertahankan.
- Analytics endpoint di [learning/api.py](../backend/learning/api.py) mendelegasikan ke aggregator; kanji, vocab, grammar, serta particle/minna dihitung terpisah. Perhitungan kakitori berada di modul tersendiri. Response analytics dan schema endpoint tidak berubah.

## Arah Perbaikan Bertahap

1. Quiz generation telah diekstrak ke strategi dan registry tanpa mengubah schema endpoint; perubahan berikutnya perlu mempertahankan perilaku visibility, sampling, aliases, dan unit filter.
2. Service reset sudah menangani lookup dan pemilihan URL; isolasi provider cache/email dari service dapat dipertimbangkan kelak bila kebutuhan provider atau test menuntutnya.
3. Analytics wrong stats telah dipisah per sumber dan aggregator mempertahankan total, level, serta kakitori. Perubahan berikutnya perlu menambah sumber di modul dan aggregator dengan test response yang setara.
4. Inventarisasi skrip operasional sebelum memigrasikan operasi berulang ke management command. Jangan memindahkan entry point yang mungkin dipakai deployment sebelum dependensinya diperiksa.
5. Biarkan ORM digunakan untuk operasi Django biasa. Tambahkan repository abstraction hanya jika ada kebutuhan nyata. Pertahankan schema endpoint yang spesifik dan constraint database.

Penerapan SOLID sebaiknya dilakukan bertahap pada titik perubahan yang memang mahal atau rawan, bukan sebagai refactor menyeluruh tanpa kebutuhan fitur.
