# Perkembangan JBook

Dokumen ini merangkum perkembangan JBook berdasarkan riwayat Git yang tersedia saat dibuat. Riwayat mencakup **269 commit**, dari 11 Februari sampai 27 Oktober 2026. Hash dan pesan commit di bawah mengikuti Git; pesan yang terlalu umum seperti `update`, `modif`, atau `p` dipertahankan apa adanya dan tidak ditafsirkan sebagai rincian teknis. Untuk memeriksa rincian file pada commit tersebut, gunakan `git show <hash>`.

## Ringkasan Milestone

- **Februari 2026:** fondasi frontend JSX dan PWA dirapikan; materi Bunpo, pengalaman admin/offline, alur latihan dan analitik, data level, serta pemulihan kata sandi mulai dikembangkan.
- **Maret 2026:** latihan diperluas dengan impor/ekspor data, konfigurasi multi-tipe dan multi-level, serta materi Minna. Data Kotoba dan Kanji memperoleh jenis kata; daftar publik/admin mendapat filter dan paginasi. Ketahanan build dan pengalaman offline PWA juga diperbaiki.
- **April 2026:** analitik akurasi dan kesalahan latihan dikembangkan, beberapa masalah impor dan Bunpo diperbaiki, data Kanji N4/N5 dilengkapi, dan integrasi database Turso dihapus.
- **Mei 2026:** fitur pengumuman dan TTS ditambahkan; struktur backend/frontend ditata ulang. Data Kotoba, saran konten, dan visualisasi coretan Kanji turut dikembangkan.
- **Juni 2026:** pencarian diperbaiki, latihan Doukai ditambahkan, sinkronisasi data/UI dilakukan, dan modul latihan kustom mulai tersedia.
- **Juli 2026:** keamanan API dan sanitasi input diperbaiki; pencarian konjugasi, data Kanji, serta penggunaan logo dan favicon JBook diperbarui.
- **Agustus 2026:** fitur pemeriksaan duplikat konten dan pengelolaan data diperbaiki. Penanganan furigana, ruby, peta furigana, dan normalisasi Unicode disempurnakan.
- **September 2026:** perubahan berfokus pada keamanan, filter Kotoba, dependensi, dan migrasi jenis kata yang idempoten.
- **Oktober 2026:** konfigurasi domain API, keamanan email, dan alur latihan responsif diperbarui. Relasi ekspresi-Bunpo, soal partikel, Argon2id, foto profil, poin TTS, SRS flashcard, paginasi admin, impor Kanji OpenJLPT N3, status pengiriman email reset password, route detail Kanji berbasis judul, serta fondasi roadmap belajar personal dikembangkan.

## Riwayat Setiap Commit

Daftar berikut kronologis dari commit tertua ke terbaru. Pesan commit dipakai sebagai keterangan perubahan utama. Commit backup otomatis dan commit dengan pesan generik tetap dicantumkan agar indeks ini lengkap.

### Februari 2026

- `05afba2` (2026-02-11): `init`
- `080024f` (2026-02-11): `feat: Refactor Frontend to JSX, Add PWA & Bunpo Feature, Update Docs`
- `0546f10` (2026-02-14): `feat(admin): refactor bunpo page, offline login, and quiz improvements`
- `f1f5279` (2026-02-19): `Fix syntax error and duplicate declarations in practice pages`
- `d33e7ed` (2026-02-19): `feat: Add practice session context and analytics utilities`
- `db0dc95` (2026-02-19): `penambahan fitur kotoba dll`
- `779e501` (2026-02-23): `add dataset level`
- `26a0658` (2026-02-23): `add lupa pw`
- `3a92f54` (2026-02-23): `modif email smtp`

### Maret 2026

- `6543bae` (2026-03-10): `docs api`
- `a960fd6` (2026-03-11): `modif backend dan front end`
- `1b916e8` (2026-03-11): `modif ignore commit`
- `e145d06` (2026-03-11): `update backend`
- `f953b1b` (2026-03-16): `Remove OAuth client secret`
- `85477b1` (2026-03-16): `debug false`
- `be8cc41` (2026-03-16): `fix back end`
- `e8ab3cf` (2026-03-16): `fix back end`
- `6a52b8d` (2026-03-16): `fix back end`
- `ac15595` (2026-03-18): `modif`
- `5abb8d5` (2026-03-18): `modif`
- `e38ac4a` (2026-03-18): `backend modif`
- `519887d` (2026-03-18): `modif`
- `0b3787b` (2026-03-18): `modif`
- `1153824` (2026-03-18): `modif`
- `1f64ddb` (2026-03-18): `modif`
- `a656a41` (2026-03-18): `modif`
- `9d71a41` (2026-03-18): `modif`
- `95f8e2c` (2026-03-18): `tes`
- `bd86b55` (2026-03-19): `penambahan type di backend`
- `d03f851` (2026-03-19): `modif penambahan type`
- `e24a35c` (2026-03-19): `penambahan badge tipe`
- `3eb6bae` (2026-03-19): `fix`
- `26d5def` (2026-03-19): `fix: merge migration conflict for word_type field`
- `40d4ce9` (2026-03-21): `import kotoba n4`
- `f395aa6` (2026-03-21): `Add Export/Import practice data feature and Minna II vocabulary population scripts`
- `183bc72` (2026-03-21): `Update VocabSchema to include word_type and improve Minna II import fidelity`
- `4acd3f2` (2026-03-21): `Fix merge conflicts and remove duplicate Word Type selects in frontend`
- `95134a6` (2026-03-21): `Decrease font sizes for quiz questions for better responsiveness`
- `73295a6` (2026-03-21): `Improve error handling and provide detailed fallback messages in frontend`
- `c731326` (2026-03-21): `Enhance practice configuration with multi-type, multi-level and custom limits`
- `50bce7f` (2026-03-21): `Fix build failure by making API fetch resilient during prerendering`
- `bf89078` (2026-03-21): `Comprehensive build failure fix: renamed incorrect directory, added missing null checks, and unified API resiliency`
- `ef89c1f` (2026-03-21): `Cleanup duplicate null check in Kotoba detail page`
- `92c89f2` (2026-03-21): `Add suffix/word_type filtering for vocabulary`
- `22c6f9c` (2026-03-21): `Enhancement: Dynamic Kanji examples with correctly typed vocabulary (suffixes, nouns, etc.)`
- `e5c501f` (2026-03-21): `Add dynamic word_type attribute to Kanji API response`
- `3aaa769` (2026-03-21): `Frontend: Display Kanji word_type badge in list and detail views`
- `690c954` (2026-03-21): `Permanent Kanji word_type storage: added model field, migration, and population script`
- `7f4db4a` (2026-03-21): `Expand word types: added Conjunction, Interjection, Pronoun, and Counter to models, scripts, and UI`
- `086b05e` (2026-03-21): `UI Polish: Move Kanji character upward in list cards for better balance`
- `615a0a2` (2026-03-21): `UI Polish: Center Kanji header text vertically against filter box`
- `5b4434a` (2026-03-21): `Admin UI Refinement: Added JLPT filter and horizontal scroll to Kotoba Management`
- `0098531` (2026-03-21): `Admin UI: Implemented server-side pagination and fixed level filtering for Kotoba`
- `55fe7f3` (2026-03-21): `Admin UI: Added word_type dropdown to Kanji create/edit form`
- `324fbb5` (2026-03-21): `UI Resilience: Handle both list and object responses for admin vocab list`
- `e64272b` (2026-03-21): `UI: Synchronize filter state with URL and improve backend filtering robustness`
- `6c60265` (2026-03-21): `Debug UI: Add filter status indicator to Kotoba list`
- `895c40b` (2026-03-21): `Bugfix: Fix ReferenceError (isExporting, isImporting, timeLeft) on Dashboard and Practice pages`
- `4903112` (2026-03-21): `Admin UI: Fix Kotoba filter by adding trailing slash, no-cache, and debug info`
- `d749080` (2026-03-21): `Public UI: Implement consistent pagination for Vocab, Kanji, and Bunpo with metadata`
- `9a81031` (2026-03-21): `Public UI: Fix Kotoba filter by defining missing variables and adding server-side debug info`
- `59a385a` (2026-03-25): `import bunpo n4`
- `250ee32` (2026-03-25): `modif be`
- `1f28580` (2026-03-25): `fix bug import belajar`
- `5c8945b` (2026-03-25): `tambah fitur offline pwa`
- `b6b7989` (2026-03-25): `tambah fitur offline pwa`
- `367d99b` (2026-03-26): `modif be fe`
- `11df981` (2026-03-26): `modif be fe`
- `e6a1659` (2026-03-26): `modif be fe`
- `d64f9e1` (2026-03-26): `modif be fe`
- `216fd8c` (2026-03-26): `modif be fe`
- `2c2f8d3` (2026-03-26): `modif be fe`
- `27b5b6f` (2026-03-26): `modif be fe`
- `874472a` (2026-03-26): `modif be fe`
- `90d4f56` (2026-03-26): `Fix 500 error by using multiple decorators for aliases in backend, and fix double slashes in API endpoints across frontend.`
- `0cb6ff0` (2026-03-27): `modif be fe`
- `44fcd2e` (2026-03-27): `modif be fe`
- `382c498` (2026-03-27): `modif be fe`
- `e19f83a` (2026-03-29): `modif be`
- `c04cada` (2026-03-29): `tambah fitur offline`
- `554340e` (2026-03-29): `modif be`
- `4f083bd` (2026-03-29): `tambah fitur export lanjutan`
- `f855914` (2026-03-29): `modif be`

### April 2026

- `1d9d82a` (2026-04-08): `fix 404 & duplikat data import`
- `3a2db51` (2026-04-15): `tambah fitur akurasi kesalahan`
- `b1ccabd` (2026-04-15): `moddif`
- `5cf527c` (2026-04-15): `moddif`
- `873ceb4` (2026-04-15): `moddif`
- `d84a56d` (2026-04-15): `dalam tahap pengembangan berapa banyak salah dan import export nya latihan`
- `245bcb0` (2026-04-27): `modif db dan debug bunpo`
- `fee3223` (2026-04-27): `modif fe admin, penambahan logika`
- `9e14429` (2026-04-27): `menambahkan prosesing data`
- `99ab436` (2026-04-27): `Merge branch 'origin/master' - Resolved binary conflict by keeping local history (1872 attempts vs 14)`
- `33a778d` (2026-04-27): `Populate missing N4/N5 kanji with Indonesian translations and examples`
- `523c233` (2026-04-27): `Remove Turso database integration and cleanup settings`
- `8caed54` (2026-04-27): `modif`

### Mei 2026

- `4a32a85` (2026-05-08): `tambah data`
- `b1c488e` (2026-05-08): `modif data duplikat`
- `4cdf10a` (2026-05-08): `modif data duplikat`
- `30d3aee` (2026-05-08): `fitur announcement dan tts`
- `1b961e4` (2026-05-08): `fitur announcement dan tts`
- `a68c88c` (2026-05-08): `fitur announcement dan tts`
- `7b2a12b` (2026-05-08): `fitur announcement dan tts`
- `b9c71c7` (2026-05-08): `fitur announcement dan tts`
- `d0eccd6` (2026-05-09): `fitur announcement`
- `efecc31` (2026-05-09): `announcement fix`
- `711b8b6` (2026-05-09): `announcement fix`
- `43ae360` (2026-05-09): `refactor: reorganize backend and frontend file structure for better maintainability`
- `bda950b` (2026-05-10): `mengisi data kotoba n1,2,3,5`
- `5aee802` (2026-05-10): `menambahkan saran`
- `9443136` (2026-05-24): `Auto backup : 2026-05-24 20:26:31`
- `e001080` (2026-05-25): `Auto backup : 2026-05-25 11:38:58`
- `6065e77` (2026-05-25): `Auto backup : 2026-05-25 15:59:29`
- `a2218fe` (2026-05-27): `Auto backup : 2026-05-27 10:17:49`
- `84efb80` (2026-05-27): `Auto backup : 2026-05-27 19:33:30`
- `84d7d4f` (2026-05-27): `p`
- `4d01f7e` (2026-05-27): `p`
- `50d0fd7` (2026-05-27): `p`
- `c04e6ec` (2026-05-27): `p`
- `8fb4a62` (2026-05-28): `Auto backup : 2026-05-28 10:22:25`
- `ebc6cbc` (2026-05-28): `p`
- `09aea30` (2026-05-28): `p`
- `878d726` (2026-05-29): `Auto backup : 2026-05-29 07:17:25`
- `bea7f24` (2026-05-29): `feat: Menambahkan Visualisasi Coretan Kanji & Memperbaiki Error Backend 500`
- `23c5ae9` (2026-05-29): `feat: Menambahkan Visualisasi Coretan Kanji & Memperbaiki Error Backend 500`
- `8c3c382` (2026-05-30): `Auto backup : 2026-05-30 09:19:11`
- `1bacc31` (2026-05-30): `edit kotoba kanji`
- `8c7804a` (2026-05-30): `edit data fix`
- `bf45c60` (2026-05-31): `Auto backup : 2026-05-31 09:53:26`

### Juni 2026

- `8096a69` (2026-06-01): `searching fix`
- `9a98b5d` (2026-06-01): `searching fix`
- `20f28d2` (2026-06-01): `searching fix`
- `e0ab5d0` (2026-06-02): `Auto backup : 2026-06-02 10:40:27`
- `786b432` (2026-06-02): `tambah fitur doukai`
- `9dbe4a3` (2026-06-02): `tambah fitur doukai`
- `eb8d9be` (2026-06-03): `Auto backup : 2026-06-03 10:01:18`
- `25d5241` (2026-06-16): `Auto backup : 2026-06-16 07:03:42`
- `ae8d26b` (2026-06-16): `singkronisasi data & update ui`
- `3e21aa8` (2026-06-16): `singkronisasi data`
- `dbb1100` (2026-06-16): `Auto backup : 2026-06-16 10:24:42`
- `eb39fa4` (2026-06-20): `tambah custom modul latihan`
- `87de8dd` (2026-06-20): `fix eror 401`
- `5632b84` (2026-06-20): `Auto backup : 2026-06-20 18:41:11`
- `29eb64e` (2026-06-21): `fixing eror import`
- `7ca4dcd` (2026-06-21): `fixing eror import`
- `e8c6841` (2026-06-21): `Auto backup : 2026-06-21 17:03:21`
- `a9d61f0` (2026-06-30): `add 9 perubahan kata kerja`
- `c9e06c5` (2026-06-30): `penambahan 9 kata kerja`
- `e425ca1` (2026-06-30): `penambahan 9 kata kerja`
- `781c8bb` (2026-06-30): `penambahan 9 kata kerja`
- `502121a` (2026-06-30): `penambahan 9 kata kerja`
- `03a0332` (2026-06-30): `penambahan 9 kata kerja`
- `20362d0` (2026-06-30): `add 9 perubahan kata kerja`
- `bfbdb0e` (2026-06-30): `Auto backup : 2026-06-30 17:37:37`

### Juli 2026

- `2e6ab22` (2026-07-01): `Auto backup : 2026-07-01 17:20:35`
- `3a0c504` (2026-07-02): `Auto backup : 2026-07-02 11:57:45`
- `934f438` (2026-07-06): `perbaiki kemanan api dan sanitasi input`
- `c851e9a` (2026-07-06): `perbaikan search conjugation`
- `7f88532` (2026-07-06): `perbaikan search conjugation`
- `b255d41` (2026-07-06): `perbaikan search conjugation`
- `873bf18` (2026-07-06): `perbaikan search conjugation`
- `7345557` (2026-07-06): `Auto backup : 2026-07-06 15:26:11`
- `fee856f` (2026-07-11): `perbaikan api`
- `0828368` (2026-07-11): `perbaikan api`
- `7220c6a` (2026-07-13): `Auto backup : 2026-07-13 15:00:25`
- `3d2ecaf` (2026-07-13): `update data kanji`
- `1df05de` (2026-07-14): `Auto backup : 2026-07-14 16:30:23`
- `e966a7d` (2026-07-22): `Auto backup : 2026-07-22 11:07:47`
- `3cf99f2` (2026-07-22): `Auto backup : 2026-07-22 16:33:18`
- `678059e` (2026-07-23): `Auto backup : 2026-07-23 20:24:01`
- `d3a789c` (2026-07-29): `Replace site icons with provided logo_jbook and update favicon metadata`

### Agustus 2026

- `6307f0f` (2026-08-01): `Auto backup : 2026-08-01 16:20:53`
- `9ec49f1` (2026-08-04): `Auto backup : 2026-08-04 15:49:45`
- `bd904e4` (2026-08-08): `Auto backup : 2026-08-08 12:22:10`
- `899e42e` (2026-08-10): `Auto backup : 2026-08-10 18:29:02`
- `30b2b00` (2026-08-10): `penambahan data kotoba`
- `d848bae` (2026-08-10): `fitur cek duplikat`
- `731d84d` (2026-08-10): `fitur cek duplikat`
- `918fb20` (2026-08-10): `fitur cek duplikat`
- `e58a2df` (2026-08-10): `fitur cek duplikat`
- `ca4d284` (2026-08-10): `fitur cek duplikat`
- `789a6f5` (2026-08-10): `fitur cek duplikat`
- `9c11109` (2026-08-11): `Auto backup : 2026-08-11 09:05:41`
- `56516aa` (2026-08-11): `edit data`
- `d2df594` (2026-08-11): `edit data dan hapus`
- `b16e470` (2026-08-12): `Auto backup : 2026-08-12 17:34:08`
- `806c8a0` (2026-08-15): `Auto backup : 2026-08-15 12:56:41`
- `600aa89` (2026-08-17): `Auto backup : 2026-08-17 04:52:52`
- `10e2cfc` (2026-08-18): `menambah data kotoba n4 sampai hal 50`
- `096c655` (2026-08-18): `perbaiki furigana`
- `8751c6d` (2026-08-18): `perbaiki furigana`
- `cd64940` (2026-08-19): `Auto backup : 2026-08-19 08:45:46`
- `e896c1a` (2026-08-20): `fix: tambahkan SILENCED_SYSTEM_CHECKS dan migrasi furigana_map`
- `7dea509` (2026-08-20): `fix: normalisasi unicode, perbaikan furigana map dan tampilan ruby`
- `6127533` (2026-08-20): `perbaiki furigana`
- `97f352a` (2026-08-20): `fix: hapus import deep_translator dari normalize_unicode command`
- `edb3bf6` (2026-08-20): `fix: ganti flex ke block container agar ruby rt bisa tampil di atas kanji`
- `c8944b3` (2026-08-21): `Auto backup : 2026-08-21 18:15:52`
- `dfd9bf8` (2026-08-22): `Auto backup : 2026-08-22 11:34:11`

### September 2026

- `07a6e76` (2026-09-06): `Auto backup : 2026-09-06 14:51:28`
- `9d5f8e8` (2026-09-06): `Auto backup : 2026-09-06 20:10:23`
- `8404de2` (2026-09-07): `Auto backup : 2026-09-07 13:17:07`
- `4661dd2` (2026-09-07): `update`
- `84ec348` (2026-09-07): `update`
- `d6cabb4` (2026-09-07): `update`
- `bb330ab` (2026-09-07): `update`
- `1dc1e10` (2026-09-08): `Auto backup : 2026-09-08 06:50:31`
- `6f1e775` (2026-09-08): `Auto backup : 2026-09-08 20:29:04`
- `802c385` (2026-09-09): `update`
- `0795a28` (2026-09-09): `Auto backup : 2026-09-09 13:16:42`
- `30a5f8c` (2026-09-10): `Auto backup : 2026-09-10 16:25:00`
- `de508f5` (2026-09-11): `Auto backup : 2026-09-11 10:33:26`
- `ce7a78e` (2026-09-12): `update`
- `8a20c38` (2026-09-12): `Auto backup : 2026-09-12 20:14:05`
- `90ae8bc` (2026-09-15): `update`
- `23e08a1` (2026-09-15): `Auto backup : 2026-09-15 16:19:25`
- `1d2b1f1` (2026-09-16): `Auto backup : 2026-09-16 15:53:34`
- `cf36213` (2026-09-29): `Auto backup : 2026-09-29 07:22:40`
- `f3e4273` (2026-09-29): `update security`
- `62bfda0` (2026-09-29): `update security`
- `31c243c` (2026-09-29): `update filter kotoba`
- `42f3cc1` (2026-09-29): `update filter kotoba`
- `ca50bbc` (2026-09-29): `update filter kotoba`
- `b1248f8` (2026-09-29): `update filter kotoba`
- `95348e4` (2026-09-29): `update filter kotoba`
- `1eeaa53` (2026-09-29): `update requirements`
- `1d8bb46` (2026-09-29): `update requirements`
- `a92e659` (2026-09-29): `Make duplicate word type migrations idempotent`
- `a9d8533` (2026-09-29): `Auto backup : 2026-09-29 16:50:20`

### Oktober 2026

- `1fcca00` (2026-10-02): `Optimize requirements and replace pandas with openpyxl to reduce disk footprint`
- `dcfc63b` (2026-10-02): `Add email-validator dependency required by pydantic EmailStr`
- `94681d3` (2026-10-02): `Update backend domain and API URLs from imronm to japan.pythonanywhere.com`
- `befa021` (2026-10-04): `Auto backup : 2026-10-04 19:57:56`
- `a3a3258` (2026-10-05): `feat: rapikan alur latihan dan tampilan mobile`
- `65f54f7` (2026-10-06): `Auto backup : 2026-10-06 09:35:20`
- `bfca83a` (2026-10-07): `Auto backup : 2026-10-07 08:32:16`
- `193d3b7` (2026-10-08): `Auto backup : 2026-10-08 11:00:43`
- `eb0749e` (2026-10-09): `Auto backup : 2026-10-09 10:08:02`
- `ca30cbf` (2026-10-09): `Agent host session OWU2ZWQwN2UtM2I2ZC00NTE2LWFhZTAtZGY5ZWM3NDExOGIz - baseline checkpoint`
- `47206d1` (2026-10-09): `relasi expressions dengan bunpo`
- `26fe4e9` (2026-10-10): `Auto backup : 2026-10-10 16:39:12`
- `1d80f32` (2026-10-12): `Auto backup : 2026-10-12 08:18:49`
- `df3c12b` (2026-10-14): `memperbaiki tipe soal partikel`
- `f49aee4` (2026-10-15): `memperbaiki tipe soal partikel`
- `77a17ec` (2026-10-15): `Auto backup : 2026-10-15 11:54:20`
- `8da58df` (2026-10-15): `Auto backup : 2026-10-15 13:55:42`
- `9e869ef` (2026-10-16): `feat : add argon2id`
- `42cd9c3` (2026-10-16): `Auto backup : 2026-10-16 15:30:41`
- `82101d0` (2026-10-16): `feat : add picture profile, poin tts save`
- `854f373` (2026-10-16): `feat : add picture profile, poin tts save`
- `cf86b15` (2026-10-16): `feat : add picture profile, poin tts save`
- `ad7a934` (2026-10-17): `Auto backup : 2026-10-17 06:55:30`
- `cdcbb4d` (2026-10-17): `delete mobile version`
- `fc1740f` (2026-10-17): `Auto backup : 2026-10-17 12:19:10`
- `44def66` (2026-10-18): `Auto backup : 2026-10-18 15:36:27`
- `8e668d2` (2026-10-19): `Auto backup : 2026-10-19 13:13:11`
- `50ddf63` (2026-10-20): `cek keamanan email`
- `ba6be70` (2026-10-20): `fix : cek keamanan email`
- `a255552` (2026-10-20): `feat : srs flashcard`
- `f422276` (2026-10-22): `pagination admin`
- `f00f45c` (2026-10-22): `feat : srs flashcard`
- `6c852a1` (2026-10-22): `feat : srs flashcard`
- `99544a1` (2026-10-23): `feat: add OpenJLPT N3 kanji import`
- `b6ee5ab` (2026-10-23): `fix: report password reset email delivery status`
- `ed6ebd7` (2026-10-23): `feat : srs flashcard`
- `9b3f2c9` (2026-10-23): `Auto backup : 2026-10-23 17:33:15`
- `6659fb5` (2026-10-27): `Auto backup : 2026-10-27 07:55:45`
- `4baeb85` (2026-10-27): `feat : route link kanji detail judul`
- `57fd413` (2026-10-27): `p`

## Perubahan Belum Di-commit

Saat dokumen ini dibuat, working tree berisi perubahan lokal yang belum masuk ke commit. Perubahan tema terang/gelap JBook dan peningkatan kontras teks juga masih berupa perubahan lokal. Perubahan tersebut sengaja tidak dicampurkan ke daftar riwayat commit di atas.

### 27 Oktober 2026: Fondasi Learning Companion

- Menambahkan model `UserProfile` one-to-one untuk menyimpan total poin TTS. Signal `post_save` membuat profil otomatis saat user baru terdaftar; migration turut membuat profil untuk user lama dengan menyalin poin yang sudah terkumpul.
- Menyelaraskan klaim poin TTS yang sudah ada agar `total_tts_points` ikut diperbarui. Pencatatan sesi tetap idempotent sehingga satu sesi tidak dihitung dua kali.
- Mempertahankan model dan endpoint koleksi vocab SRS yang telah tersedia (`UserVocabulary`), termasuk status hafalan, level kotak, dan jadwal review; tidak membuat model duplikat.
- Menambahkan model tahap roadmap (`LearningPathStage`) dan progres per-user (`UserStageProgress`), dengan batas progres 0–100 dan constraint satu progres per user per tahap.
- Migration menginisialisasi tahap Hiragana, Katakana, N5, N4, N3, N2, dan N1. Tahap N3–N1 ditandai `beta`.
- Menambahkan endpoint JWT-authenticated `GET /api/learning/roadmap` untuk membaca roadmap dan progres milik user, serta `PUT /api/learning/roadmap/{stage_id}/progress` untuk memperbarui progres sendiri.
- Validasi: Django system check bersih, `makemigrations --check --dry-run` tidak menemukan perubahan migration yang tertinggal, dan 11 tes terfokus untuk roadmap, SRS, profil, dan klaim poin TTS lulus.

Untuk melihat daftar perubahan terbaru sebelum membuat commit:

```bash
git status --short
git diff
```

## Memperbarui Kronologi

Tambahkan entri baru di bawah bulan yang sesuai setiap kali ada commit. Gunakan hash pendek, tanggal commit, dan pesan asli. Untuk pesan commit yang generik, tambahkan ringkasan berdasarkan diff agar perubahan tetap dapat dipahami.

```bash
git log --date=short --pretty=format:'- `%h` (%ad): `%s`' -- docs frontend-web backend
```