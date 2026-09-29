# JBook Security Audit & Best Practice Report

**Tanggal Audit:** 2026-09-29
**Auditor:** AI Code Review
**Versi Aplikasi:** Current
**Scope:** Backend (Django + Ninja API) + Frontend (Next.js)

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
**Status:** ❌ BELUM DIPERBAIKI
**Rekomendasi:** Hapus fallback, wajib set via environment variable dan raise error jika tidak ada.

### 2. Hardcoded Kredensial Email (Password Gmail)
**File:** `backend/core/settings.py:205-208`
**Deskripsi:** `EMAIL_HOST_PASSWORD` hardcoded dengan value `rhbkjidnfevounfq` (App Password Gmail).
**Dampak:** Kredensial email terekspos jika source code bocor. Penyerang bisa mengirim email spam/phishing dari akun resmi.
**Status:** ❌ BELUM DIPERBAIKI
**Rekomendasi:** Wajib via environment variable, hapus semua hardcoded credential.

### 3. CORS Allow All Origins Enabled
**File:** `backend/core/settings.py:89`
**Deskripsi:** `CORS_ALLOW_ALL_ORIGINS = True` — mengizinkan request dari origin MANAPUN.
**Dampak:** Kerentanan CSRF pada endpoint API. Penyerang bisa membuat halaman web yang memaksa user terautentikasi mengirim request berbahaya.
**Status:** ❌ BELUM DIPERBAIKI
**Rekomendasi:** Gunakan whitelist `CORS_ALLOWED_ORIGINS` berdasarkan environment.

### 4. ALLOWED_HOSTS Berisi Wildcard '*'
**File:** `backend/core/settings.py:28-31`
**Deskripsi:** ALLOWED_HOSTS default menyertakan `*` wildcard.
**Dampak:** Host Header Attack — penyerang bisa membuat link phishing dengan domain palsu yang merujuk ke server.
**Status:** ❌ BELUM DIPERBAIKI
**Rekomendasi:** Hapus `*` dari production config.

### 5. Frontend Upload Route TANPA Autentikasi
**File:** `frontend-web/app/api/upload/route.js:5-75`
**Deskripsi:** Endpoint `/api/upload` (Vercel Blob proxy) TIDAK memiliki autentikasi sama sekali.
**Dampak:** Siapa saja bisa mengupload file sampai 100MB ke storage Vercel Blob (bisa abuse bandwidth/biaya).
**Status:** ❌ BELUM DIPERBAIKI
**Rekomendasi:** Tambahkan check token JWT atau admin-only access.

### 6. Endpoint Create Vocab/Kotoba TANPA Autentikasi
**File:** `backend/content/api.py:665-673`
**Deskripsi:** `POST /api/content/kotoba` dan `POST /api/content/vocab` tidak memiliki decorator `auth=AuthBearer()`.
**Dampak:** Siapa saja bisa membanjiri database dengan data kosong/sampah.
**Status:** ❌ BELUM DIPERBAIKI
**Rekomendasi:** Tambahkan `auth=AuthBearer()` dan validasi staff/admin.

### 7. Endpoint Update Vocab TANPA Autentikasi
**File:** `backend/content/api.py:675-686`
**Deskripsi:** `PUT /api/content/kotoba/{id}` tidak memiliki auth. Endpoint terpisah di line 140 memang sudah ada auth tapi ini duplicate tanpa auth.
**Dampak:** Siapa saja bisa mengubah/mengkorupsi data kosakata yang ada.
**Status:** ❌ BELUM DIPERBAIKI
**Rekomendasi:** Hapus endpoint duplicate atau tambahkan auth.

---

## 🟠 Temuan TINGGI (Prioritas Tinggi)

### 8. Endpoint Sync & Import Vocab TANPA Autentikasi
**File:** `backend/content/api.py:696-723`
**Deskripsi:** `POST /kotoba/sync` dan `POST /kotoba/import` (upload JSON file) tanpa autentikasi.
**Dampak:** Mass import data malicious atau overwrite seluruh database vocab.
**Status:** ❌ BELUM DIPERBAIKI

### 9. Endpoint Translate TANPA Rate Limit + Autentikasi
**File:** `backend/content/api.py:702-707`
**Deskripsi:** `POST /kotoba/translate` bisa memanggil external translate API tanpa batas.
**Dampak:** Abuse API external (cost bengkak, IP diblokir).
**Status:** ❌ BELUM DIPERBAIKI

### 10. JWT Access Token Lifetime Terlalu Lama (90 Hari)
**File:** `backend/core/settings.py:265-266`
**Deskripsi:** Access token berlaku 90 hari. Standar industri adalah 15-60 menit.
**Dampak:** Jika token dicuri, penyerang punya akses 90 hari penuh.
**Status:** ❌ BELUM DIPERBAIKI

### 11. JWT BLACKLIST_AFTER_ROTATION = False
**File:** `backend/core/settings.py:268`
**Deskripsi:** Token lama TIDAK dimasukkan blacklist setelah refresh.
**Dampak:** Token lama yang sudah di-"rotate" tetap bisa dipakai.
**Status:** ❌ BELUM DIPERBAIKI

### 12. Password Reset Link Dikembalikan ke Client
**File:** `backend/users/api.py:203-206`
**Deskripsi:** Endpoint `/password-reset` mengembalikan `reset_link` di response JSON.
**Dampak:** Jika ada XSS atau MITM, attacker bisa melihat link reset dan mengambil alih akun. Email user juga mendapatkan link, seharusnya response hanya message generik.
**Status:** ❌ BELUM DIPERBAIKI

### 13. Google OAuth Tidak Verifikasi CLIENT_ID
**File:** `backend/users/api.py:120-123`
**Deskripsi:** Verifikasi Google token hanya cek signature & expiry, TIDAK cek `aud` claim (CLIENT_ID).
**Dampak:** Token dari app Google lain bisa dipakai login ke JBook (Token Confusion Attack).
**Status:** ❌ BELUM DIPERBAIKI

### 14. TTS Endpoint Bebas Akses Tanpa Rate Limit
**File:** `backend/content/api.py:628-646`
**Deskripsi:** `GET /api/content/tts?text=...` menerima arbitrary text dan proxy ke Google TTS tanpa batas.
**Dampak:** SSRF (terbatas ke Google), DDoS pada Google API, atau abuse cost.
**Status:** ❌ BELUM DIPERBAIKI

### 15. Content Suggestion Endpoint Tanpa Rate Limit
**File:** `backend/content/api.py:742-770`
**Deskripsi:** `POST /suggest` mengirim email via `send_mail` tanpa rate limit memadai.
**Dampak:** Email spam bomb — attacker bisa memaksa server mengirim ribuan email.
**Status:** ❌ BELUM DIPERBAIKI

---

## 🟡 Temuan SEDANG (Perbaikan Jangka Pendek)

### 16. Debug Field Terekspos ke Production API
**File:** `backend/content/api.py:438-439`
**Deskripsi:** `VocabListResponse` menyertakan `debug_level` dan `debug_search` yang dikembalikan ke client.
**Dampak:** Info debugging bisa bocor dan membingungkan frontend.
**Status:** ❌ BELUM DIPERBAIKI

### 17. Tidak Ada .env.example Template
**Deskripsi:** Tidak ada file template untuk environment variables. Developer baru harus menebak variabel apa saja yang dibutuhkan.
**Status:** ❌ BELUM DIPERBAIKI

### 18. Security Headers Tidak Ada di Next.js
**File:** `frontend-web/next.config.mjs`
**Deskripsi:** Tidak ada `headers()` config untuk CSP, X-Frame-Options, Referrer-Policy, dll.
**Dampak:** Kerentanan XSS, Clickjacking.
**Status:** ❌ BELUM DIPERBAIKI

### 19. File .env Tidak Masuk .gitignore
**File:** `.gitignore:20-21`
**Deskripsi:** Hanya `.env*.local` yang di-ignore, `.env` production TIDAK diignore.
**Dampak:** Risiko commit file .env berisi credential.
**Status:** ❌ BELUM DIPERBAIKI

### 20. JWK_URL Menunjuk ke Localhost
**File:** `backend/core/settings.py:274`
**Deskripsi:** `JWK_URL: 'http://localhost/jwks.json'` — invalid untuk production.
**Status:** ❌ BELUM DIPERBAIKI

### 21. SQLI-like Risk di Search Filter (IContains di JSONField)
**File:** `backend/content/api.py:259-262`
**Deskripsi:** `onyomi__icontains` dan `kunyomi__icontains` pada JSONField tanpa sanitasi.
**Dampak:** Rendah, tapi query bisa tidak efisien dan berpotensi leak data.
**Status:** ⚠️ DIPANTAU

### 22. Duplicate Endpoint Vocab Update Beda Auth
**File:** `backend/content/api.py:140-146` vs `:675-686`
**Deskripsi:** Dua endpoint PUT /vocab/{id} — satu pakai AuthBearer, satu lagi TIDAK.
**Status:** ❌ BELUM DIPERBAIKI

### 23. Admin Auth Check via Hardcoded Email
**File:** `backend/content/admin_api.py:39`
**Deskripsi:** `user.email == "imronm1309@gmail.com"` sebagai salah satu syarat admin.
**Dampak:** Jika email di database di-spoof atau user register dengan email tersebut di instance lain.
**Status:** ⚠️ DIPANTAU (karena kombinasi dengan is_staff/is_superuser)

### 24. Rate Limit Hanya di Beberapa Endpoint Saja
**Deskripsi:** Rate limit decorator hanya ada di register, login, password reset, list kanji/grammar. Banyak endpoint lain (detail, create, delete, analytics submit) tanpa rate limit.
**Status:** ❌ BELUM DIPERBAIKI

### 25. Cookie JWT Tidak HttpOnly (Disimpan di JS Cookie)
**File:** `frontend-web/context/AuthContext.js:21-24`
**Deskripsi:** Token disimpan di `Cookies.set()` via JS (bukan httpOnly cookie dari Set-Cookie header).
**Dampak:** Jika ada XSS, token mudah dicuri.
**Status:** ⚠️ TRADEOFF — mobile-friendly tapi risiko XSS lebih tinggi. Rekomendasi: tambahkan CSP ketat.

---

## 🟢 Temuan RENDAH / Best Practice Improvement

### 26. Tidak Ada Validasi Input Sanitasi XSS pada Content User
**Deskripsi:** Blog content, suggestion data, custom module text disimpan tanpa sanitasi HTML.
**Rekomendasi:** Gunakan `bleach` library untuk strip tag berbahaya sebelum save atau render.

### 27. Verbose Error Message di Production
**File:** `backend/content/api.py:509-511` (contoh)
**Deskripsi:** Beberapa error handler mengembalikan `str(e)` yang bisa berisi path file internal, SQL, dll.
**Rekomendasi:** Gunakan generic message di production, log detail error saja di server.

### 28. No Input Max Length pada `practice/submit` 
**File:** `backend/learning/api.py:61-62`
**Deskripsi:** `SubmissionSchema.results: List[AnswerSchema]` — tidak ada max_items. User bisa mengirim list jutaan item dan membunuh DB.
**Rekomendasi:** Tambahkan `Field(max_length=2000)` atau batasi jumlah item per submit.

### 29. Duplicate Duplicates Endpoint di admin_api.py
**File:** `backend/content/admin_api.py:359-379` dan `:436-455`
**Deskripsi:** `admin_kanji_duplicates` didefinisikan DUA KALI dengan decorator router.get yang sama.
**Rekomendasi:** Hapus salah satu definisi duplicate.

### 30. Pagination `limit` max 1000 Terlalu Besar
**File:** `backend/content/api.py:85`
**Deskripsi:** `limit: int = Field(50, ge=1, le=1000)` — 1000 item per page membuat query lambat dan response besar.
**Rekomendasi:** Turunkan ke 200 atau 300 max.

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
- [ ] Hapus semua hardcoded secrets di settings.py
- [ ] Fix CORS_ALLOW_ALL_ORIGINS → CORS_ALLOWED_ORIGINS whitelist
- [ ] Hapus wildcard `*` dari ALLOWED_HOSTS (production only)
- [ ] Tambahkan auth ke upload route Next.js
- [ ] Tambahkan auth ke endpoint create/update/sync/import vocab
- [ ] Tambahkan rate limit ke TTS, suggest, translate endpoint
- [ ] Hapus reset_link dari response password reset

### Phase 2 (Hari ini)
- [ ] Buat .env.example untuk backend dan frontend
- [ ] Update .gitignore agar include `.env`
- [ ] Kurangi JWT lifetime (access: 15m, refresh: 7d)
- [ ] Enable BLACKLIST_AFTER_ROTATION
- [ ] Hapus debug field dari production response
- [ ] Hapus duplicate endpoint + code
- [ ] Tambahkan security headers di next.config.mjs
- [ ] Validasi Google OAuth CLIENT_ID

### Phase 3 (Opsional - Minggu depan)
- [ ] Sanitasi XSS pada semua text input user
- [ ] Max length submission schema
- [ ] HttpOnly cookie token migration (jika perlu)
- [ ] Rate limit menyeluruh pada semua endpoint write
- [ ] Tambahkan input cap pagination < 300

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

Aplikasi JBook **sudah memiliki fondasi yang cukup bagus** (pakai Pydantic, Django ORM, rate limit pada auth endpoint, UUID PK). Namun ada **7 temuan KRITIS** yang berkaitan dengan credential hardcoded, permission endpoint, dan CORS yang harus diperbaiki SEGERA sebelum deployment production skala luas.

Sebagian besar issue adalah **"keamanan default dilonggarkan untuk kemudahan development"** — hal yang wajar di fase awal, tapi harus di-remediasi sebelum traffic ramai.

Setelah Phase 1 & 2 selesai, aplikasi ini akan jauh lebih aman dan sesuai best practice industri.
