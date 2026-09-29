# JBook — Log Perbaikan Security & Best Practice
**Tanggal:** 2026-09-29
**Berdasarkan Laporan:** `docs/security-audit-report.md`

> Catatan revalidasi source 2026-09-29: ringkasan berikut diperbarui agar hanya menghitung temuan yang benar-benar tuntas. Kontrol role write Kotoba telah diverifikasi staff/superuser-only.

---

## 📊 Ringkasan Perbaikan Hari Ini

| Tingkat Risiko | Total Temuan | Sudah Diperbaiki | Persentase |
|----------------|--------------|------------------|------------|
| 🔴 KRITIS      | 7            | **7**            | 100%       |
| 🟠 TINGGI      | 8            | **8**            | 100%       |
| 🟡 SEDANG      | 10           | **7**            | 70%        |
| 🟢 RENDAH      | 5            | **4**            | 80%        |
| **TOTAL**      | **30**       | **26**           | **87%**    |

---

## ✅ Perbaikan SELESAI — Detail per Temuan

### 🔴 Temuan KRITIS — 7/7 SELESAI

| # | Temuan | File Dimodifikasi | Perbaikan yang Dilakukan |
|---|--------|-------------------|--------------------------|
| 1 | Hardcoded SECRET_KEY | `backend/core/settings.py` | Ganti fallback hardcoded dengan helper `_require_env()` yang **crash startup** di production jika SECRET_KEY tidak diset. Dev mode tetap bisa berjalan dengan temporary key. |
| 2 | Hardcoded Password Email | `backend/core/settings.py` | Hapus seluruh hardcoded `EMAIL_HOST_USER` dan `EMAIL_HOST_PASSWORD`. Keduanya default empty string. Production WAJIB set via env. Dev mode pakai `console.EmailBackend` sehingga tidak butuh credential. |
| 3 | CORS_ALLOW_ALL_ORIGINS = True | `backend/core/settings.py` | Ganti total logic: `CORS_ALLOW_ALL_ORIGINS` hanya True jika **DEBUG=True AND CORS env kosong**. Production strict whitelist. Tambah `CORS_ALLOW_CREDENTIALS = True`. |
| 4 | ALLOWED_HOSTS ada wildcard '*' | `backend/core/settings.py` | Production default list **tanpa wildcard**. Hanya dev mode yang memperbolehkan localhost + 127.0.0.1. Tetap bisa di-override via env. |
| 5 | Upload route Next.js tanpa auth | `frontend-web/app/api/upload/route.js` | Admin/staff auth diterapkan; upload-token dan multipart dibatasi 25MB. |
| 6 | Create Vocab tanpa auth | `backend/content/api.py` | `AuthBearer()` menolak user non-staff/non-superuser; rate limit 30/menit diterapkan. |
| 7 | Update Vocab duplicate tanpa auth | `backend/content/api.py` | Endpoint duplicate tanpa auth dihapus; update yang tersisa meminta staff/superuser auth dan rate limit. |

---

### 🟠 Temuan TINGGI — 8/8 SELESAI

| # | Temuan | Status | Aksi |
|---|--------|--------|------|
| 8 | Sync & Import tanpa auth | ✅ SELESAI | `AuthBearer()` staff-only, rate limit, dan batas ukuran/jumlah item diterapkan. |
| 9 | Translate tanpa rate limit | ✅ SELESAI | Staff-only auth dan rate limit 60/menit diterapkan. |
| 10 | JWT 90 hari (terlalu lama) | ✅ SELESAI | Default Access: **15 menit**, Refresh: **7 hari** (via env `JWT_ACCESS_MINUTES`, `JWT_REFRESH_DAYS`). SESSION_COOKIE_AGE ikut jadi 7 hari. |
| 11 | BLACKLIST_AFTER_ROTATION=False | ✅ SELESAI | Ganti ke `True` — setiap refresh, token lama masuk blacklist. |
| 12 | Reset link bocor ke response client | ✅ SELESAI | `POST /password-reset` sekarang SELALU return pesan generik. Tidak pernah return reset_link / tidak memberitahu apakah email terdaftar (anti email enumeration). Debug print ke console hanya untuk dev mode. |
| 13 | Google OAuth tidak verify CLIENT_ID | ✅ SELESAI | Production menolak Google sign-in jika `GOOGLE_CLIENT_ID` kosong; audience, issuer, dan email verified diperiksa. |
| 14 | TTS endpoint tanpa rate limit | ✅ SELESAI | Tambah `@rate_limit('60/m')`, tambah `Query(..., max_length=500)` pada text parameter, validasi text tidak empty, wrap HTTP call dengan timeout 10s + generic 502 error. |
| 15 | Suggest content kirim email tanpa rate limit | ✅ SELESAI | Rate limit **3/hour + 10/min**, whitelist type {kanji, bunpo}, dan fail_silently email sudah diterapkan. Queue system (Celery/RQ) tetap menjadi opsi pengembangan. |

---

### 🟡 Temuan SEDANG — 7/10 SELESAI, 2 SKIP, 1 TRADEOFF

| # | Temuan | Status | Aksi |
|---|--------|--------|------|
| 16 | Debug field (debug_level, debug_search) di production API | ✅ SELESAI | Hapus dari `VocabListResponse` schema dan hapus dari return value `list_vocab()`. |
| 17 | Tidak ada .env.example | ✅ SELESAI | Template tersedia di backend dan frontend-web. |
| 18 | Next.js tanpa security headers | ✅ SELESAI | Tambah `async headers()` di `next.config.mjs` dengan 8 header production: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-XSS-Protection, Content-Security-Policy (non-strict), HSTS. |
| 19 | `.env` tidak masuk .gitignore | ✅ SELESAI | Update root `.gitignore` → ignore semua `.env` dan `.env.*`, kecuali `!.env.example` / `!.env.template`. |
| 20 | JWK_URL menunjuk localhost | ✅ SELESAI | Default `None` (tidak dipakai). Override via env `JWK_URL` jika pakai external issuer. |
| 21 | JSONField icontains risk (low) | ⏭️ SKIP | Django ORM + Pydantic sudah sanitized. Risiko minimal. |
| 22 | Duplicate update vocab endpoint | ✅ SELESAI | Dihapus (satu saja, yang authorized). |
| 23 | Hardcoded email admin di AdminAuth check | ⏭️ SKIP | Dikonfirmasi trade-off untuk kemudahan. Kombinasi 3 kondisi (email OR staff OR superuser) — acceptable. |
| 24 | Rate limit tidak menyeluruh | ✅ SELESAI | Rate limit diterapkan pada operasi write content, learning, dan admin yang diperiksa. |
| 25 | Token cookie tidak HttpOnly | ⚠️ TERBUKA | Belum dimigrasikan. Memerlukan pemindahan request browser langsung ke backend melalui BFF/server; mengubah flag cookie saja akan memutus halaman admin dan upload. |

---

### 🟢 Temuan RENDAH — 4/5 SELESAI, 1 PARSIAL

| # | Temuan | Status | Aksi |
|---|--------|--------|------|
| 26 | Sanitasi XSS user content | ✅ SELESAI | Allowlist Bleach diterapkan pada save dan response publik; `bleach` ditambahkan ke requirements. |
| 27 | Verbose error messages di production | ⚠️ PARSIAL | Error handler untuk vocab create/update/import, TTS, suggest, Google auth sudah di-generic-kan. Masih ada beberapa endpoint lain. |
| 28 | Submission schema tanpa max_items | ✅ SELESAI | Submit latihan dibatasi maksimum 500 hasil per request; impor data latihan juga dibatasi. |
| 29 | **Duplicate** admin_kanji_duplicates endpoint | ✅ SELESAI | Hapus definisi kedua di `admin_api.py:436-467`. |
| 30 | Pagination limit max 1000 terlalu besar | ✅ SELESAI | Endpoint publik dan admin vocab dibatasi maksimum 300 item. |

---

## 🔧 File Perbaikan Utama

```
backend/
├── core/
│   └── settings.py                ⭐ Hardcoded secrets, CORS, ALLOWED_HOSTS, JWT, Email, Cookies
├── content/
│   ├── api.py                     ⭐ Staff auth, rate limit, pagination cap, sanitized responses
│   ├── admin_api.py               ✅ Rate limit admin writes dan cap vocab pagination
│   └── models.py                  ✅ Allowlist sanitization pada konten tersimpan
├── learning/
│   └── api.py                     ✅ Submission/import caps dan rate limit
├── users/
│   └── api.py                     ⭐ Google OAuth production audience enforcement
├── utils/
│   └── sanitize.py                ✅ Bleach allowlist sanitizer
└── requirements.txt              ✅ Tambah dependency Bleach

frontend-web/
├── app/api/upload/
│   └── route.js                   ⭐ Tambah requireAdmin() → call /auth/me, folder whitelist,
                                        cap 25MB untuk multipart/token upload, audit log uploadedBy
├── context/
│   └── AuthContext.js             ✅ Cookie expire 90d → 7d (config via NEXT_PUBLIC_COOKIE_DAYS)
└── next.config.mjs                ⭐ Tambah 8 security headers + CSP
```

**File Baru / Dependency:**
```
backend/utils/sanitize.py          ✅ HTML allowlist sanitizer
bleach                             ✅ Dependency pada `backend/requirements.txt`
```

**File .gitignore root diperbarui**

---

## 📌 Fitur yang Dicek (Full Checklist)

### ✅ Backend Features Check

| Fitur | Ada | Berfungsi | Aman | Catatan |
|-------|-----|-----------|------|---------|
| Register akun | ✅ | ✅ | ✅ | Rate limit 10/jam + Pydantic validasi username/email/password |
| Login (email/username) | ✅ | ✅ | ✅ | Rate limit 30/menit + enum identifier Q search |
| Login with Google | ✅ | ✅ | ✅+ | Production mewajibkan GOOGLE_CLIENT_ID; audience, iss, email_verified diperiksa |
| Current user /me | ✅ | ✅ | ✅ | JWT auth + rate limit 120/menit |
| Lupa Password (link) | ✅ | ✅ | ✅+ | **Sudah diperbaiki** - response selalu generic, tidak leak link di JSON |
| Lupa Password (OTP) | ✅ | ✅ | ✅ | Cache expire 10 menit, rate limit |
| Daftar Kanji (paginated) | ✅ | ✅ | ✅ | Filter level, search, radical + level visibility system |
| Detail Kanji | ✅ | ✅ | ✅ | Dynamic vocab examples |
| Daftar Kosakata (paginated) | ✅ | ✅ | ✅+ | Debug field dihapus, deconjugation search verb-only strict |
| Detail Kosakata + Audio | ✅ | ✅ | ✅ | Furigana map auto-generate, conjugation strict verb types check |
| Daftar Grammar | ✅ | ✅ | ✅ | Chapter filter + search |
| Daftar Pengumuman | ✅ | ✅ | ✅ | Cache-Control public 5 menit, soft-delete, priority + show_from/until |
| Blog List | ✅ | ✅ | ✅ | Published-only filter |
| Blog Detail by Slug | ✅ | ✅ | ✅ | Published-only filter |
| Content Suggestion (kirim email) | ✅ | ✅ | ✅+ | Rate limit 3/jam + type whitelist + email fail_silently |
| TTS Arbitrary Text | ✅ | ✅ | ✅+ | Rate limit 60/menit + max_length 500 + timeout external call |
| Generate Quiz Practice | ✅ | ✅ | ✅ | Limit cap 2000, visibility respected |
| Minna Quiz Generator | ✅ | ✅ | ✅ | Limit cap 50 |
| Submit Practice Results | ✅ | ✅ | ✅ | Auth required, maksimal 500 jawaban, rate limit |
| Analytics User | ✅ | ✅ | ✅ | Auth required |
| Export Data Practice | ✅ | ✅ | ✅ | Auth required |
| Reset Progress | ✅ | ✅ | ✅ | Auth required |
| Doukai Reading Passages | ✅ | ✅ | ✅ | Published only |
| Custom Modules Public | ✅ | ✅ | ✅ | Published only + submit endpoint |
| Random Kotoba | ✅ | ✅ | ✅ | |
| Kanji Visibility Feature Toggles | ✅ | ✅ | ✅ | CRUD via Admin only |
| Kotoba Translate (furigana + arti) | ✅ | ✅ | ✅+ | Staff-only auth + rate limit 60/menit |
| Kotoba Sync Bulk | ✅ | ✅ | ✅+ | Staff-only auth + cap 1000 + rate limit |
| Kotoba Import JSON Upload | ✅ | ✅ | ✅+ | Staff-only auth + file cap 5MB + rate limit |
| CRUD Vocab Admin | ✅ | ✅ | ✅+ | Auth + rate limit ditambahkan |
| CRUD Kanji Admin | ✅ | ✅ | ✅ | AdminAuth strict |
| CRUD Grammar Admin | ✅ | ✅ | ✅ | AdminAuth strict |
| CRUD Blog Admin | ✅ | ✅ | ✅ | AdminAuth strict |
| CRUD Announcement Admin | ✅ | ✅ | ✅ | AdminAuth strict |
| CRUD Custom Module Admin | ✅ | ✅ | ✅ | AdminAuth strict + Excel upload |
| Media Upload Admin (Django) | ✅ | ✅ | ✅ | AdminAuth strict + media type detection |
| Media Upload via Next.js → Vercel Blob | ✅ | ✅ | ✅+ | **Auth ditambahkan** - require admin/staff |
| Duplicate Finder Kanji & Kotoba | ✅ | ✅ | ✅ | Duplicate endpoint DIHAPUS |
| Export CSV (Kanji, Grammar, Vocab, Particle) | ✅ | ✅ | ✅ | AdminAuth strict |

### ✅ Frontend Features Check

| Fitur | Ada | Berfungsi | Aman | Catatan |
|-------|-----|-----------|------|---------|
| SSR + ISR Sitemap Generation | ✅ | ✅ | ✅ | Safe fallback pada fetch error |
| Robots.txt handler | ✅ | ✅ | ✅ | |
| RSS Feed (feed.xml) | ✅ | ✅ | ✅ | |
| Service Worker / PWA Offline | ✅ | ✅ | ✅ | Workbox cache policy terdefinisi |
| IndexedDB Offline Content | ✅ | ✅ | ✅ | serveFromDb, offline question generator |
| Auth Context (login/register/logout/forgot) | ✅ | ✅ | ✅+ | **Cookie expire disesuaikan** 7 hari, secure prod |
| Protected Routes (Admin Pages) | ✅ | ✅ | ⚠️ | Client guard bukan pengganti permission backend; backend memeriksa role |
| Admin Upload Media Widget | ✅ | ✅ | ✅+ | **Backend route sudah diauth** |
| Blog Share Buttons | ✅ | ✅ | ✅ | |
| Navigation + Caching API Calls | ✅ | ✅ | ✅ | fetchWithCache pattern, cache-store invalidation |
| Analytics Offline Guest Mode | ✅ | ✅ | ✅ | Local storage + fallback merge |
| Practice Config & Runner | ✅ | ✅ | ✅ | |
| Minna Progress Badge | ✅ | ✅ | ✅ | |
| Kakitori Dashboard Stats | ✅ | ✅ | ✅ | Fallback default struct disediakan |
| Doukai Reader Mode | ✅ | ✅ | ✅ | |
| Crossword / TTS Grid Game | ✅ | ✅ | ✅ | |
| Unduhan massal materi offline | ❌ | ❌ | N/A | UI, modal, dan manager unduh sudah dihapus; IndexedDB cache dan offline fallback tetap ada. |
| Reset Progress Confirmation | ✅ | ✅ | ✅ | ConfirmationModal before action |
| Theme Context | ✅ | ✅ | ✅ | |
| Security Headers | ✅ | ✅ | ✅+ | **Ditambahkan** 8 headers |

---

## 🚨 SISA PEKERJAAN (Rekomendasi Fase Berikutnya)

Jika ingin aplikasi **100% production-ready** (skala > 1000 user):

1. **[TINGGI] Migrasi token ke HttpOnly cookie melalui BFF**
   - Pindahkan seluruh request browser yang saat ini memanggil backend langsung ke BFF/server.
   - Set token dengan `HttpOnly`, `Secure`, `SameSite`, dan validasi CSRF.
   - Jangan hanya mengubah opsi cookie di client; itu akan memutus request admin dan upload.

2. **[SEDANG] Rate limit lintas instance**
   - Operasi write content, learning, dan admin sudah dibatasi.
   - Pertimbangkan Redis untuk backend cache/rate limit shared process di production.

3. **[SEDANG] SQLITE → POSTGRESQL Migration**
   - SQLite tidak cocok untuk concurrent write > 10 user aktif
   - Tambahkan Postgres config di settings.py via DATABASE_URL env

4. **[RENDAH] Audit Log untuk Delete Action**
   - Simpan log siapa yang menghapus content kapan
   - Bisa pakai Django Simple History atau custom model


---

## ✅ Kesimpulan Sesi Perbaikan

Aplikasi JBook **sekarang sudah jauh lebih aman** dari sebelumnya. Pada revalidasi source, **7/7 temuan KRITIS dan 8/8 temuan TINGGI selesai**:
- Tidak ada lagi hardcoded SECRET_KEY / password email di source code
- CORS production sudah strict whitelist, tidak wildcard
- Upload route memverifikasi admin/staff dan semua jalur dibatasi 25MB
- Operasi tulis Kotoba meminta staff/superuser auth dan rate limit
- Password reset response tidak lagi leak link rahasia
- Google Login production mewajibkan `GOOGLE_CLIENT_ID` dan memvalidasi audience, issuer, serta email verified
- Next.js upload route sudah dilindungi auth admin
- JWT token lifetime dikurangi 90 hari → 15 menit (access) + 7 hari (refresh) + blacklist aktif

Tindak lanjut yang tersisa adalah migrasi token HttpOnly dan audit menyeluruh pesan error; pastikan dependency `bleach` terpasang saat deployment.
