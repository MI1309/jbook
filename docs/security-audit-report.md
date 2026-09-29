# JBook Security Audit & Best Practice Report

**Tanggal Audit:** 2026-09-29
**Auditor:** AI Code Review
**Versi Aplikasi:** Current
**Scope:** Backend (Django + Ninja API) + Frontend (Next.js)

**Status tindak lanjut:** Checklist Phase 1 di bawah diperbarui berdasarkan pemeriksaan source code pada 2026-09-29. Item yang baru sebagian ditangani tidak ditandai selesai.

---

## 📊 Ringkasan Eksekutif

| Kategori | Jumlah Temuan |
|----------|---------------|
| 🔴 KRITIS | 7 |
| 🟠 TINGGI | 8 |
| 🟡 SEDANG | 10 |
| 🟢 RENDAH | 5 |
| **TOTAL** | **30** |

---

## 🔴 Temuan KRITIS (Harus Segera Diperbaiki)

### 1. Hardcoded SECRET_KEY Django
**File:** `backend/core/settings.py:21-24`
**Deskripsi:** SECRET_KEY memiliki fallback hardcoded `django-insecure-rl!)jbpx5hdn9zu2-rvq0xh!@=r7lw14ppz99j)6^sgvt@mqv^` yang digunakan jika environment variable tidak diset.
**Dampak:** Penyerang bisa menandatangani session, JWT, password reset token sendiri.
**Status:** ✅ DIPERBAIKI — production mewajibkan `SECRET_KEY`; development memakai key sementara.
**Rekomendasi:** Hapus fallback, wajib set via environment variable dan raise error jika tidak ada.

### 2. Hardcoded Kredensial Email (Password Gmail)
**File:** `backend/core/settings.py:205-208`
**Deskripsi:** `EMAIL_HOST_PASSWORD` hardcoded dengan value `rhbkjidnfevounfq` (App Password Gmail).
**Dampak:** Kredensial email terekspos jika source code bocor. Penyerang bisa mengirim email spam/phishing dari akun resmi.
**Status:** ✅ DIPERBAIKI — kredensial diambil dari environment; tidak ada password hardcoded.
**Rekomendasi:** Wajib via environment variable, hapus semua hardcoded credential.

### 3. CORS Allow All Origins Enabled
**File:** `backend/core/settings.py:89`
**Deskripsi:** `CORS_ALLOW_ALL_ORIGINS = True` — mengizinkan request dari origin MANAPUN.
**Dampak:** Kerentanan CSRF pada endpoint API. Penyerang bisa membuat halaman web yang memaksa user terautentikasi mengirim request berbahaya.
**Status:** ✅ DIPERBAIKI — production menggunakan whitelist `CORS_ALLOWED_ORIGINS`; allow-all hanya mungkin pada development tanpa whitelist.
**Rekomendasi:** Gunakan whitelist `CORS_ALLOWED_ORIGINS` berdasarkan environment.

### 4. ALLOWED_HOSTS Berisi Wildcard '*'
**File:** `backend/core/settings.py:28-31`
**Deskripsi:** ALLOWED_HOSTS default menyertakan `*` wildcard.
**Dampak:** Host Header Attack — penyerang bisa membuat link phishing dengan domain palsu yang merujuk ke server.
**Status:** ✅ DIPERBAIKI — default production tidak berisi wildcard; konfigurasi masih dapat di-override melalui environment.
**Rekomendasi:** Hapus `*` dari production config.

### 5. Frontend Upload Route TANPA Autentikasi
**File:** `frontend-web/app/api/upload/route.js:5-75`
**Deskripsi:** Endpoint `/api/upload` (Vercel Blob proxy) TIDAK memiliki autentikasi sama sekali.
**Dampak:** Siapa saja bisa mengupload file sampai 100MB ke storage Vercel Blob (bisa abuse bandwidth/biaya).
**Status:** ✅ DIPERBAIKI — route memverifikasi admin/staff melalui `/auth/me`; jalur multipart dan upload-token sama-sama dibatasi 25 MB.
**Rekomendasi:** Pertahankan pemeriksaan role dan cap ukuran pada semua jalur upload.

### 6. Endpoint Create Vocab/Kotoba TANPA Autentikasi
**File:** `backend/content/api.py:665-673`
**Deskripsi:** `POST /api/content/kotoba` dan `POST /api/content/vocab` tidak memiliki decorator `auth=AuthBearer()`.
**Dampak:** Siapa saja bisa membanjiri database dengan data kosong/sampah.
**Status:** ✅ DIPERBAIKI — `AuthBearer()` pada router content menerima staff/superuser saja; endpoint create juga memiliki rate limit.
**Rekomendasi:** Pertahankan role gate dan rate limit.

### 7. Endpoint Update Vocab TANPA Autentikasi
**File:** `backend/content/api.py:675-686`
**Deskripsi:** `PUT /api/content/kotoba/{id}` tidak memiliki auth. Endpoint terpisah di line 140 memang sudah ada auth tapi ini duplicate tanpa auth.
**Dampak:** Siapa saja bisa mengubah/mengkorupsi data kosakata yang ada.
**Status:** ✅ DIPERBAIKI — endpoint duplicate tanpa auth sudah dihapus; route update meminta `AuthBearer()` staff/superuser dan rate limit.
**Rekomendasi:** Pertahankan role gate untuk semua operasi tulis.

---

## 🟠 Temuan TINGGI (Prioritas Tinggi)

### 8. Endpoint Sync & Import Vocab TANPA Autentikasi
**File:** `backend/content/api.py:696-723`
**Deskripsi:** `POST /kotoba/sync` dan `POST /kotoba/import` (upload JSON file) tanpa autentikasi.
**Dampak:** Mass import data malicious atau overwrite seluruh database vocab.
**Status:** ✅ DIPERBAIKI — sync/import meminta `AuthBearer()` staff/superuser, diberi rate limit dan batas ukuran/jumlah item.

### 9. Endpoint Translate TANPA Rate Limit + Autentikasi
**File:** `backend/content/api.py:702-707`
**Deskripsi:** `POST /kotoba/translate` bisa memanggil external translate API tanpa batas.
**Dampak:** Abuse API external (cost bengkak, IP diblokir).
**Status:** ✅ DIPERBAIKI — translate meminta `AuthBearer()` staff/superuser dan memiliki rate limit 60/menit.

### 10. JWT Access Token Lifetime Terlalu Lama (90 Hari)
**File:** `backend/core/settings.py:265-266`
**Deskripsi:** Access token berlaku 90 hari. Standar industri adalah 15-60 menit.
**Dampak:** Jika token dicuri, penyerang punya akses 90 hari penuh.
**Status:** ✅ DIPERBAIKI — default access token 15 menit dan refresh token 7 hari; nilainya dapat diatur melalui environment.

### 11. JWT BLACKLIST_AFTER_ROTATION = False
**File:** `backend/core/settings.py:268`
**Deskripsi:** Token lama TIDAK dimasukkan blacklist setelah refresh.
**Dampak:** Token lama yang sudah di-"rotate" tetap bisa dipakai.
**Status:** ✅ DIPERBAIKI — `BLACKLIST_AFTER_ROTATION = True`.

### 12. Password Reset Link Dikembalikan ke Client
**File:** `backend/users/api.py:203-206`
**Deskripsi:** Endpoint `/password-reset` mengembalikan `reset_link` di response JSON.
**Dampak:** Jika ada XSS atau MITM, attacker bisa melihat link reset dan mengambil alih akun. Email user juga mendapatkan link, seharusnya response hanya message generik.
**Status:** ✅ DIPERBAIKI — response selalu generik dan tidak mengembalikan tautan reset.

### 13. Google OAuth Tidak Verifikasi CLIENT_ID
**File:** `backend/users/api.py:120-123`
**Deskripsi:** Verifikasi Google token hanya cek signature & expiry, TIDAK cek `aud` claim (CLIENT_ID).
**Dampak:** Token dari app Google lain bisa dipakai login ke JBook (Token Confusion Attack).
**Status:** ✅ DIPERBAIKI — production menolak Google sign-in jika `GOOGLE_CLIENT_ID` tidak dikonfigurasi; audience token diverifikasi saat login. Development tetap dapat memakai fallback.

### 14. TTS Endpoint Bebas Akses Tanpa Rate Limit
**File:** `backend/content/api.py:628-646`
**Deskripsi:** `GET /api/content/tts?text=...` menerima arbitrary text dan proxy ke Google TTS tanpa batas.
**Dampak:** SSRF (terbatas ke Google), DDoS pada Google API, atau abuse cost.
**Status:** ✅ DIPERBAIKI — rate limit, batas teks 500 karakter, timeout external request, dan error response generik sudah diterapkan.

### 15. Content Suggestion Endpoint Tanpa Rate Limit
**File:** `backend/content/api.py:742-770`
**Deskripsi:** `POST /suggest` mengirim email via `send_mail` tanpa rate limit memadai.
**Dampak:** Email spam bomb — attacker bisa memaksa server mengirim ribuan email.
**Status:** ✅ DIPERBAIKI — rate limit 3/jam dan 10/menit, whitelist tipe, dan pengiriman email fail-silently diterapkan.

---

## 🟡 Temuan SEDANG (Perbaikan Jangka Pendek)

### 16. Debug Field Terekspos ke Production API
**File:** `backend/content/api.py:438-439`
**Deskripsi:** `VocabListResponse` menyertakan `debug_level` dan `debug_search` yang dikembalikan ke client.
**Dampak:** Info debugging bisa bocor dan membingungkan frontend.
**Status:** ✅ DIPERBAIKI — field debug sudah tidak ada pada schema response.

### 17. Tidak Ada .env.example Template
**Deskripsi:** Tidak ada file template untuk environment variables. Developer baru harus menebak variabel apa saja yang dibutuhkan.
**Status:** ✅ DIPERBAIKI — template tersedia di `backend/.env.example` dan `frontend-web/.env.example`.

### 18. Security Headers Tidak Ada di Next.js
**File:** `frontend-web/next.config.mjs`
**Deskripsi:** Tidak ada `headers()` config untuk CSP, X-Frame-Options, Referrer-Policy, dll.
**Dampak:** Kerentanan XSS, Clickjacking.
**Status:** ✅ DIPERBAIKI — `next.config.mjs` mengirim security headers termasuk CSP dan X-Frame-Options.

### 19. File .env Tidak Masuk .gitignore
**File:** `.gitignore:20-21`
**Deskripsi:** Hanya `.env*.local` yang di-ignore, `.env` production TIDAK diignore.
**Dampak:** Risiko commit file .env berisi credential.
**Status:** ✅ DIPERBAIKI — root `.gitignore` mengecualikan `.env` dan `.env.*`, dengan template dikecualikan dari ignore.

### 20. JWK_URL Menunjuk ke Localhost
**File:** `backend/core/settings.py:274`
**Deskripsi:** `JWK_URL: 'http://localhost/jwks.json'` — invalid untuk production.
**Status:** ✅ DIPERBAIKI — default `JWK_URL` sekarang `None`, dapat diatur melalui environment.

### 21. SQLI-like Risk di Search Filter (IContains di JSONField)
**File:** `backend/content/api.py:259-262`
**Deskripsi:** `onyomi__icontains` dan `kunyomi__icontains` pada JSONField tanpa sanitasi.
**Dampak:** Rendah, tapi query bisa tidak efisien dan berpotensi leak data.
**Status:** ⚠️ DIPANTAU

### 22. Duplicate Endpoint Vocab Update Beda Auth
**File:** `backend/content/api.py:140-146` vs `:675-686`
**Deskripsi:** Dua endpoint PUT /vocab/{id} — satu pakai AuthBearer, satu lagi TIDAK.
**Status:** ✅ DIPERBAIKI — endpoint duplicate tanpa auth sudah dihapus; route update yang tersisa memakai `AuthBearer()`.

### 23. Admin Auth Check via Hardcoded Email
**File:** `backend/content/admin_api.py:39`
**Deskripsi:** `user.email == "imronm1309@gmail.com"` sebagai salah satu syarat admin.
**Dampak:** Jika email di database di-spoof atau user register dengan email tersebut di instance lain.
**Status:** ⚠️ DIPANTAU (karena kombinasi dengan is_staff/is_superuser)

### 24. Rate Limit Hanya di Beberapa Endpoint Saja
**Deskripsi:** Rate limit decorator hanya ada di register, login, password reset, list kanji/grammar. Banyak endpoint lain (detail, create, delete, analytics submit) tanpa rate limit.
**Status:** ✅ DIPERBAIKI — rate limit diterapkan pada operasi write content, learning, dan admin yang diperiksa.

### 25. Cookie JWT Tidak HttpOnly (Disimpan di JS Cookie)
**File:** `frontend-web/context/AuthContext.js:21-24`
**Deskripsi:** Token disimpan di `Cookies.set()` via JS (bukan httpOnly cookie dari Set-Cookie header).
**Dampak:** Jika ada XSS, token mudah dicuri.
**Status:** ⚠️ BELUM DIMIGRASI — token masih dapat dibaca JavaScript. Security headers/CSP sudah diterapkan sebagai mitigasi, tetapi perlindungan HttpOnly memerlukan migrasi request web melalui BFF.

---

## 🟢 Temuan RENDAH / Best Practice Improvement

### 26. Tidak Ada Validasi Input Sanitasi XSS pada Content User
**Deskripsi:** Blog content, suggestion data, custom module text disimpan tanpa sanitasi HTML.
**Status:** ✅ DIPERBAIKI — HTML disanitasi dengan allowlist Bleach saat disimpan dan sebelum konten publik blog/modul dikirim. Dependency `bleach` ditambahkan ke requirements.
**Rekomendasi:** Pertahankan sanitasi dan jalankan `pip install -r requirements.txt` pada deployment.

### 27. Verbose Error Message di Production
**File:** `backend/content/api.py:509-511` (contoh)
**Deskripsi:** Beberapa error handler mengembalikan `str(e)` yang bisa berisi path file internal, SQL, dll.
**Status:** ⚠️ DIPERBAIKI SEBAGIAN — beberapa handler sudah mengembalikan pesan generik; audit seluruh endpoint masih diperlukan.
**Rekomendasi:** Gunakan generic message di production, log detail error saja di server.

### 28. No Input Max Length pada `practice/submit` 
**File:** `backend/learning/api.py:61-62`
**Deskripsi:** `SubmissionSchema.results: List[AnswerSchema]` — tidak ada max_items. User bisa mengirim list jutaan item dan membunuh DB.
**Status:** ✅ DIPERBAIKI — schema submission membatasi hingga 500 jawaban per request.
**Rekomendasi:** Pertahankan batas jumlah item.

### 29. Duplicate Duplicates Endpoint di admin_api.py
**File:** `backend/content/admin_api.py:359-379` dan `:436-455`
**Deskripsi:** `admin_kanji_duplicates` didefinisikan DUA KALI dengan decorator router.get yang sama.
**Status:** ✅ DIPERBAIKI — hanya tersisa satu definisi endpoint `admin_kanji_duplicates`.
**Rekomendasi:** Hapus salah satu definisi duplicate.

### 30. Pagination `limit` max 1000 Terlalu Besar
**File:** `backend/content/api.py:85`
**Deskripsi:** `limit: int = Field(50, ge=1, le=1000)` — 1000 item per page membuat query lambat dan response besar.
**Status:** ✅ DIPERBAIKI — endpoint publik membatasi 300 item; daftar admin Kotoba juga default 200 dan maksimum 300.
**Rekomendasi:** Pertahankan cap maksimum 300.

---

## ✅ Fitur yang SUDAH Berjalan Baik (Best Practice Compliant)

| Fitur | Lokasi | Catatan |
|-------|--------|---------|
| Password Validation | `settings.py:138-151` | ✅ Menggunakan 4 validator Django standar |
| JWT Authentication | `users/api.py` | ✅ Menggunakan ninja_jwt library resmi |
| Rate Limit Auth Endpoint | `users/api.py:78,99,115,155` | ✅ Register 10/jam, Login 30/m, Me 120/m |
| UUID Primary Key | Semua models | ✅ Tidak autoincrement ID, sulit ditebak |
| Soft Delete Announcement | `models.py:165` | ✅ `deleted_at` bukan benar-benar hapus |
| CSRF Middleware Aktif | `settings.py:74` | ✅ CsrfViewMiddleware terpasang |
| CSP-like via XFrame | `settings.py:79` | ✅ XFrameOptionsMiddleware anti clickjacking |
| Secure Cookie Prod | `AuthContext.js:18` | ✅ `secure: true` di production |
| Password Reset Token Expiry | `users/api.py:191` | ✅ OTP expire 10 menit via cache |
| Pagination + Limit Cap | `ListQuerySchema:85` | ✅ Ada min/max limit |
| Offline Mode Support | `lib/offline-db.js` | ✅ IndexedDB fallback untuk PWA |
| Swagger/OpenAPI Docs | `core/urls.py:27` | ✅ Auto docs di /api/docs |

---

## 📝 Plan Perbaikan (Prioritas)

### Phase 1 (Segera — < 1 jam kerja)
- [x] Hapus hardcoded secrets di `settings.py` dan wajibkan `SECRET_KEY` production.
- [x] Ganti CORS allow-all production dengan whitelist `CORS_ALLOWED_ORIGINS`.
- [x] Hapus wildcard default `*` dari `ALLOWED_HOSTS` production.
- [x] Tambahkan verifikasi admin/staff pada route upload Next.js.
- [x] Tambahkan bearer authentication pada endpoint create/update/sync/import vocab.
- [x] Batasi endpoint create/update/delete/sync/import vocab ke staff/admin melalui `AuthBearer()` staff-only.
- [x] Tambahkan rate limit pada TTS, suggestion, dan translate.
- [x] Tambahkan autentikasi pada translate; route saat ini staff-only.
- [x] Hapus `reset_link` dari response password reset.
- [x] Terapkan batas ukuran file 25 MB juga pada jalur multipart langsung `/api/upload`.

### Phase 2 (Hari ini)
- [x] Buat `backend/.env.example`.
- [x] `frontend-web/.env.example` tersedia dan memuat konfigurasi frontend.
- [x] Update `.gitignore` agar include `.env`.
- [x] Kurangi JWT lifetime (access: 15m, refresh: 7d).
- [x] Enable `BLACKLIST_AFTER_ROTATION`.
- [x] Hapus debug field dari production response.
- [x] Hapus duplicate endpoint Kanji dan update vocab tanpa auth.
- [x] Tambahkan security headers di `next.config.mjs`.
- [x] Wajibkan `GOOGLE_CLIENT_ID` untuk Google sign-in di production dan verifikasi audience token.

### Phase 3 (Opsional - Minggu depan)
- [x] Sanitasi HTML allowlist pada konten blog, pengumuman, suggestion, dan modul kustom.
- [x] Batasi `practice/submit` hingga 500 item per request.
- [ ] HttpOnly cookie token migration (jika perlu)
- [x] Tambahkan rate limit pada endpoint write content, learning, dan admin.
- [x] Tambahkan input cap pagination maksimum 300.

---

## 🔍 Checklist Fitur yang Dicek

### Backend Django
- [x] Environment Variables & Secrets Management
- [x] Authentication & Authorization (JWT)
- [x] CORS, CSRF, dan Host Header Validation
- [x] Rate Limiting & DDoS Protection
- [x] Input Validation & Sanitasi (Pydantic Schema)
- [x] Permission pada CRUD Endpoint
- [x] Password Storage & Reset Flow
- [x] OAuth / 3rd Party Login (Google)
- [x] File Upload Handling
- [x] Email Sending Security
- [x] SQL Injection Prevention (ORM used)
- [x] Logging & Error Handling
- [x] Database Connection & Migrations
- [x] Session & Cookie Security

### Frontend Next.js
- [x] Token Storage Strategy
- [x] API Route / Backend-for-Frontend Security
- [x] Auth Context & Session Management
- [x] Next.js Config & Security Headers
- [x] Service Worker / PWA Caching
- [x] Offline Mode (IndexedDB)
- [x] File Upload Client-side Validation

---

## 🎯 Kesimpulan

Aplikasi JBook **sudah memiliki fondasi yang cukup bagus** (pakai Pydantic, Django ORM, rate limit pada auth endpoint, UUID PK). Berdasarkan revalidasi source pada 2026-09-29, **7 dari 7 temuan KRITIS dan 8 dari 8 temuan TINGGI sudah diperbaiki**. Temuan HttpOnly cookie masih menjadi pekerjaan arsitektur, dan peninjauan error handler masih parsial.

Sebagian besar issue adalah **"keamanan default dilonggarkan untuk kemudahan development"** — hal yang wajar di fase awal, tapi harus di-remediasi sebelum traffic ramai.

Temuan yang belum selesai ditandai `[ ]` di checklist Phase 1–3. Sebelum deploy, instal dependency baru dengan `pip install -r backend/requirements.txt` agar sanitasi Bleach aktif.
