# JBook - Logic & Architecture Documentation
Comprehensive guide to the backend logic, code quality, and architecture of JBook.

---

## 1. Analisis Kualitas Kode (Code Review)

### ✅ Kelebihan Kode Saat Ini
1. **Dokumentasi & Struktur**: Proyek terorganisir dengan baik menggunakan Django Ninja, konvensi penamaan jelas
2. **Keamanan Autentikasi**: Menggunakan JWT, role-based access control (admin), dan Google OAuth
3. **Caching & Offline**: Menggunakan Django Cache, IndexedDB di frontend, dan session management
4. **Database**: Menggunakan UUID primary keys, JSON fields untuk data fleksibel, dan Django ORM
5. **Error Handling**: Sudah ada try-except di banyak endpoint, terutama import dan export
6. **Konjugasi & Dekonjugasi**: Logika konjugasi kata kerja Jepang (9 bentuk, 4 varian) dan dekonjugasi untuk pencarian sudah implementasi!

### ⚠️ Masalah & Potensi Bug
1. **N+1 Query Problem**:
   - Terjadi di `content/api.py` saat menambahkan `word_type` ke Kanji (loop + `Vocab.objects.filter(...).first()` di setiap iterasi)
   - Di `content/admin_api.py` di admin list vocab/kanji juga

2. **Keamanan CSRF & Rate Limiting**:
   - Endpoint seperti `/api/content/suggest` dan `/api/practice/import` tidak memiliki rate limiting
   - Potensi abuse jika endpoint diakses berulang kali
   - Missing CSRF protection untuk POST requests (meskipun menggunakan JWT)

3. **Logika Duplikat**:
   - Konversi `to_kana/to_katakana` berulang-ulang di banyak endpoint
   - Code export CSV untuk kanji, bunpo, vocab memiliki struktur yang sama
   - Di `content/admin_api.py` line 339-342: `to_kana` dipanggil dua kali!

4. **Validasi Input**:
   - Beberapa endpoint tidak memvalidasi input secara ketat sebelum disimpan ke database
   - Contoh: Di `conjugation.py`, tidak ada validasi apakah kata kerja valid sebelum diproses

5. **Performance**:
   - `list_kanji` dan `list_vocab` menggunakan `[:1000]` / `[:10000]` tanpa pagination yang optimal
   - Order by `?` untuk random tidak efisien untuk tabel besar
   - Di `content/api.py`: `Vocab.objects.order_by('?').first()` untuk random sangat lambat jika tabel besar

6. **Code Smell**:
   - Import di dalam fungsi (contoh: banyak import di dalam endpoint function)
   - Magic number seperti `batch_size=100` tanpa komentar
   - Dead code: di `content/api.py` line 215-220, ada UUID handling tapi juga di line 225
   - Unused variables: beberapa variabel didefinisikan tapi tidak dipakai

---

## 2. Gambaran Umum Arsitektur (Architecture Overview)

### 📦 Stack Teknologi Backend
- **Framework**: Django (versi stabil) + Django Ninja (REST API)
- **Auth**: django-ninja-jwt + Google OAuth
- **Database**: SQLite (dev) / Postgres (prod)
- **Cache**: Django Cache Framework + IndexedDB (frontend)
- **Utility Libraries**: Wanakana (kana conversion), Pandas (Excel import)

### 🏗️ Pola Arsitektur
Proyek menggunakan pola **Layered Architecture** (Arsitektur Berlapis):
1. **API Layer**: Endpoint Django Ninja di `[app]/api.py`
2. **Service Layer**: Logika bisnis di file utils (conjugation.py, kana.py)
3. **Data Access Layer**: Django ORM di `models.py`
4. **Database Layer**: Model Django dengan relasi

### 📁 Struktur Folder Backend
```
backend/
├── content/           # Modul utama (kanji, bunpo, vocab, blog, pengumuman)
│   ├── models.py      # Definisi tabel database
│   ├── api.py         # Public API (untuk user)
│   └── admin_api.py   # Admin API (hanya untuk staf)
├── learning/          # Modul latihan, quiz, progress
├── users/             # Manajemen pengguna (auth, register, dll)
├── utils/             # Library helper (konjugasi, kana, sync)
└── core/              # Konfigurasi Django utama
```

---

## 3. Alur Data & State Management (Data Flow)

### 🔄 Endpoint Utama dan Alur Data
Berikut adalah alur data untuk fitur penting:

#### 1. Autentikasi Pengguna
```
Frontend → POST /api/users/login
         ↓
Authenticate dengan email/username & password
         ↓
Generate JWT (access + refresh token)
         ↓
Simpan token di HTTP-only cookies (frontend)
         ↓
Kembalikan user data ke frontend
```

#### 2. Pencarian dengan Dekonjugasi
```
Frontend → GET /api/content/vocab?search=tabemasu
         ↓
Konversi search term ke kana (to_kana)
         ↓
Jalankan deconjugate_verb() untuk dapatkan bentuk dasar
         ↓
Filter Vocab.objects.filter() dengan OR condition
         ↓
Format hasil (konversi reading ke kana)
         ↓
Return ke frontend sebagai JSON
```

#### 3. Import Data Latihan
```
Frontend → POST /api/learning/practice/import (file JSON)
         ↓
Validasi: Cek apakah ID konten ada di database
         ↓
Cek duplikat dengan existing attempts
         ↓
Bulk create QuizAttempt dengan transaction.atomic()
         ↓
Update UserProgress dengan update_or_create()
         ↓
Return status import (success/skipped count)
```

---

## 4. Daftar Fungsi Utama (Core Functions Breakdown)

### 📚 utils/conjugation.py
Fungsi ini adalah inti dari sistem konjugasi dan dekonjugasi kata kerja Jepang!

| Fungsi                     | Tujuan                                                                 | Parameter Input                          | Output                                  |
|----------------------------|-----------------------------------------------------------------------|------------------------------------------|------------------------------------------|
| `deconjugate_verb()`       | Membalikkan bentuk konjugasi ke kemungkinan bentuk dasar              | `input_str: str` (kata kerja terkonjugasi) | List of candidate kana (str)            |
| `conjugate_verb_complete()`| Konjugasi kata kerja ke 9 bentuk utama dengan 4 varian masing-masing   | `word: str, reading: str, word_type: str` | Dict: `{"forms": [{"name": ..., "variants": ...}]}` |
| `_get_stems()`             | Helper function untuk mendapatkan batang kata kerja (untuk konjugasi)  | Word, reading, flags for type            | Dict with stem information              |

#### Catatan untuk `conjugate_verb_complete()`:
- Menangani 5 tipe kata kerja: Godan, Ichidan, Suru, Kuru
- 9 bentuk: Indikatif, Progresif, Imperatif, Volisional, Potensial, Kondisional, Shimau, Passive, Causative
- 4 varian: Default (kasual), Formal, Negative, Past + gabungan (Formal-Negative-Past)

---

### 🌐 content/api.py
Public API untuk user biasa (bukan admin).

| Endpoint                          | Metode | Deskripsi                                                                 |
|-----------------------------------|--------|---------------------------------------------------------------------------|
| `/content/kanji`                  | GET    | List kanji dengan filter level, search, radical, pagination               |
| `/content/kanji/{id}`             | GET    | Detail kanji + dynamic examples dari vocab                                |
| `/content/vocab`                  | GET    | List vocab dengan deconjugation search support                           |
| `/content/vocab/{id}`             | GET    | Detail vocab + full conjugation data                                      |
| `/content/grammar`                | GET    | List tata bahasa (bunpo)                                                  |
| `/content/announcements`          | GET    | Daftar pengumuman aktif (cache 5 menit)                                   |
| `/content/blog`                   | GET    | Daftar posting blog yang dipublikasikan                                   |
| `/content/custom-modules`         | GET    | Modul latihan khusus yang dipublikasikan                                  |
| `/content/vocab/{id}/audio`       | GET    | Generate TTS audio dari Google Translate (streaming response)             |

---

### 🛡️ content/admin_api.py
API khusus admin untuk manajemen konten.

| Endpoint                          | Metode | Deskripsi                                                                 |
|-----------------------------------|--------|---------------------------------------------------------------------------|
| `/admin/content/stats`            | GET    | Statistik jumlah kanji, bunpo, blog, pengumuman                           |
| `/admin/content/search`           | GET    | Pencarian terpadu (kanji, bunpo, blog)                                    |
| `/admin/content/kanji`            | CRUD   | Create, Read, Update, Delete kanji                                        |
| `/admin/content/vocab`            | CRUD   | Manajemen vocab (kotoba)                                                  |
| `/admin/content/grammar`          | CRUD   | Manajemen tata bahasa (bunpo)                                             |
| `/admin/content/blog`             | CRUD   | Manajemen blog post                                                       |
| `/admin/content/announcements`    | CRUD   | Manajemen pengumuman (soft delete)                                        |
| `/admin/content/custom-modules`   | CRUD   | Modul latihan khusus + upload Excel questions                             |
| `/admin/content/{type}/export/csv`| GET    | Export kanji/bunpo/vocab ke CSV                                           |

---

### 📖 learning/api.py
API untuk fitur latihan dan progress pengguna.

| Endpoint                          | Metode | Deskripsi                                                                 |
|-----------------------------------|--------|---------------------------------------------------------------------------|
| `/learning/practice/generate`     | GET    | Generate soal latihan (random)                                            |
| `/learning/practice/minna/generate`| GET  | Generate soal dari buku Minna no Nihongo                                 |
| `/learning/practice/submit`       | POST   | Simpan jawaban dan update progress                                        |
| `/learning/practice/analytics`    | GET    | Lihat statistik dan kesalahan pengguna (membutuhkan autentikasi)          |
| `/learning/practice/import`       | POST   | Import data latihan dari JSON                                             |
| `/learning/practice/export`       | GET    | Export data latihan pengguna                                              |
| `/learning/practice/reset`        | POST   | Reset semua progress pengguna                                             |
| `/learning/doukai/*`              | GET    | Latihan membaca (Doukai)                                                 |

---

### 🔐 users/api.py
Autentikasi dan manajemen pengguna.

| Endpoint                          | Metode | Deskripsi                                                                 |
|-----------------------------------|--------|---------------------------------------------------------------------------|
| `/users/register`                 | POST   | Daftar pengguna baru (username, email, password, level target)            |
| `/users/login`                    | POST   | Login dengan email/username dan password                                  |
| `/users/google`                   | POST   | Login dengan Google OAuth                                                 |
| `/users/me`                       | GET    | Dapatkan profil pengguna yang sedang login                                |
| `/users/password-reset`           | POST   | Request reset password (kirim email dengan link/OTP)                      |
| `/users/password-reset-confirm`   | POST   | Konfirmasi reset password dengan token                                    |
| `/users/password-reset-otp`       | POST   | Reset password dengan OTP                                                 |

---

## 5. Rekomendasi Perbaikan (Optimization)

Berikut adalah saran perbaikan kode agar lebih optimal, bersih, dan cepat!

---

### 🔧 Perbaikan 1: Fix N+1 Query Problem di List Kanji
**Problem**: Di `content/api.py` line 194-202: setiap kanji memanggil `Vocab.objects.filter()` satu per satu → lambat jika banyak data!

**Solusi**: Prefetch vocab terlebih dahulu, buat mapping dictionary!

```python
# Di dalam list_kanji()
from django.db.models import Prefetch

# 1. Ambil semua kanji terlebih dahulu
kanji_list = list(query[offset : offset + limit])
if not kanji_list:
    return {"items": [], ...}

# 2. Ambil semua vocab yang berhubungan dalam 1 query
kanji_chars = [k.character for k in kanji_list]
# Buat query untuk vocab yang mengandung character atau ~character
vocab_matches = Vocab.objects.filter(
    Q(word__in=kanji_chars) | Q(word__in=[f"~{c}" for c in kanji_chars])
).values("word", "word_type")

# 3. Buat mapping dictionary untuk cepat lookup
vocab_map = {}
for v in vocab_matches:
    # Simpan untuk word biasa dan ~word
    key = v["word"]
    if key not in vocab_map:
        vocab_map[key] = v["word_type"]
    # Jika word starts with ~, simpan juga tanpa ~
    if key.startswith("~"):
        short_key = key[1:]
        if short_key not in vocab_map:
            vocab_map[short_key] = v["word_type"]

# 4. Loop kanji dan assign word_type dari vocab_map
for k in kanji_list:
    if k.character in vocab_map:
        k.word_type = vocab_map[k.character]
    # Format readings seperti biasa
    k.onyomi = [to_katakana(r.lower()) for r in (k.onyomi or []) if isinstance(r, str) and r]
    k.kunyomi = [to_kana(r.lower()) for r in (k.kunyomi or []) if isinstance(r, str) and r]
```

---

### 🚀 Perbaikan 2: Cache untuk Konjugasi dan Data Statis
Problem: Konjugasi kata kerja yang sama dipanggil berulang-ulang → bisa di-cache!

Solusi: Tambahkan decorator `lru_cache` atau Django cache!

```python
# Di utils/conjugation.py
from functools import lru_cache
from django.core.cache import cache

# Untuk deconjugate, gunakan cache dengan TTL (contoh 1 jam)
def cached_deconjugate_verb(input_str: str):
    cache_key = f"deconj:{input_str}"
    cached_result = cache.get(cache_key)
    if cached_result:
        return cached_result
    result = deconjugate_verb(input_str)
    cache.set(cache_key, result, timeout=3600)  # simpan 1 jam
    return result

# Untuk conjugate_verb_complete, gunakan lru_cache karena parameternya sederhana
@lru_cache(maxsize=1000)  # Cache 1000 kata kerja terakhir
def conjugate_verb_complete_cached(word: str, reading: str, word_type: str = None):
    return conjugate_verb_complete(word, reading, word_type)
```

---

### 🛡️ Perbaikan 3: Tambahkan Rate Limiting
Untuk mencegah abuse, gunakan library `django-ratelimit` atau implementasi sederhana dengan cache:

```python
# Di content/api.py (contoh untuk suggest endpoint)
from django.core.cache import cache
from ninja.errors import HttpError

@router.post("/suggest")
def suggest_content(request, payload: SuggestionSchema):
    user_ip = request.META.get('REMOTE_ADDR')
    cache_key = f"suggest_limit:{user_ip}"
    request_count = cache.get(cache_key, 0)
    if request_count > 5:  # Maksimal 5 request per jam
        raise HttpError(429, "Too many requests. Please try again later.")
    
    # Increment count, expire dalam 3600 detik (1 jam)
    cache.set(cache_key, request_count + 1, timeout=3600)
    
    # Lanjutkan logika suggest...
```

---

### 🧼 Perbaikan 4: Refactor Code Duplikasi
Contoh: Code export CSV di `admin_api.py` bisa dijadikan helper function!

```python
# Di content/utils.py atau content/admin_api.py
def export_to_csv(queryset, filename, headers, row_func):
    import csv
    from django.http import HttpResponse
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    writer = csv.writer(response)
    writer.writerow(headers)
    for obj in queryset:
        writer.writerow(row_func(obj))
    return response

# Pemakaian di admin_api.py:
@router.get("/kanji/export/csv", auth=AdminAuth())
def admin_export_kanji_csv(request, level: int = None, search: str = None):
    # ... build query ...
    def get_row(obj):
        from utils.kana import format_reading
        onyomi_str = format_reading(obj.onyomi, is_onyomi=True)
        kunyomi_str = format_reading(obj.kunyomi, is_onyomi=False)
        return [obj.character, obj.meaning, onyomi_str, kunyomi_str, obj.strokes, obj.jlpt_level, obj.radical]
    return export_to_csv(query, "kanji_export.csv", ["Character", "Meaning", "Onyomi", "Kunyomi", "Strokes", "JLPT Level", "Radical"], get_row)
```

---

### 📊 Perbaikan 5: Random yang Lebih Efisien
Problem: `Vocab.objects.order_by('?')` lambat untuk tabel besar!

Solusi: Gunakan random dengan pk, atau hitung count terlebih dahulu:

```python
# Di utils/__init__.py atau content/api.py
import random
from django.db.models import Max

def get_random_obj(model_class):
    """Cara cepat mengambil 1 objek random."""
    # 1. Dapatkan max id
    max_id = model_class.objects.aggregate(max_id=Max("id"))["max_id"]
    if not max_id:
        return None  # tabel kosong
    # 2. Coba cari id random sampai ketemu
    for _ in range(10):  # coba 10 kali untuk menghindari id yang dihapus
        random_id = random.randint(1, max_id)
        obj = model_class.objects.filter(id=random_id).first()
        if obj:
            return obj
    # Fallback jika gagal 10x (untuk tabel yang banyak dihapus)
    return model_class.objects.order_by('?').first()

# Pemakaian di content/api.py line 332-340:
@router.get("/random-kotoba", response=VocabSchema)
def get_random_kotoba(request):
    vocab = get_random_obj(Vocab)
    if not vocab:
        return 404, {"message": "No vocabulary found"}
    return vocab
```

---

### 📝 Perbaikan 6: Tambahkan Unit Test
Buat test untuk fungsi konjugasi dan dekonjugasi agar tidak regresi!

Contoh di `content/tests.py`:
```python
from django.test import TestCase
from utils.conjugation import deconjugate_verb, conjugate_verb_complete

class ConjugationTest(TestCase):
    def test_deconjugate_masu_form(self):
        candidates = deconjugate_verb("tabemasu")
        self.assertIn("taberu", candidates)
    
    def test_conjugate_ichidan_verb(self):
        result = conjugate_verb_complete("食べる", "taberu", "ichidan")
        self.assertIsNotNone(result)
        self.assertIn("forms", result)
        forms = {f["name"] for f in result["forms"]}
        self.assertTrue({"Indikatif", "Progresif", "Potensial"}.issubset(forms))
```

---

### ✨ Rekomendasi Tambahan (Best Practice)
1. **Gunakan Environment Variables**: Simpan konfigurasi seperti `GOOGLE_CLIENT_ID` di `.env` (pakai `python-dotenv`)
2. **Logging yang Lebih Baik**: Ganti `print()` dengan `logging` module untuk production
3. **Paginasi yang Konsisten**: Semua endpoint list harus punya pagination yang sama formatnya
4. **Dokumentasi API**: Aktifkan Swagger/OpenAPI dari Django Ninja untuk dokumentasi otomatis!
5. **Soft Delete untuk Semua Model**: Seperti yang sudah dilakukan di `Announcement`, gunakan `deleted_at` untuk model lain juga untuk keamanan
6. **Validasi Input Ketat**: Semua input di API sudah divalidasi menggunakan Pydantic schemas dengan `Field()` validator, max_length, min_length, dan validasi tipe data untuk mencegah injection attack!
7. **Rate Limiting**: Semua endpoint API sudah memiliki batas permintaan (rate limiting) untuk melindungi dari serangan DDoS dan abuse!

### 🛡️ Security & Validasi Input
Backend JBook sudah mengimplementasikan:
1. **Pydantic Schemas**: Semua request body dan response divalidasi dengan Pydantic dengan `Field(..., max_length=255)` dll. untuk string, mencegah SQL injection dan XSS
2. **Django ORM**: Semua query menggunakan Django ORM yang otomatis escape string untuk mencegah SQL injection
3. **JWT Authentication**: Semua endpoint sensitif membutuhkan JWT dan admin membutuhkan is_staff/is_superuser
4. **Input sanitasi**: Semua input punya batas panjang (max_length) untuk setiap field untuk mencegah payload besar dan overflow
5. **Rate Limiting**: Menggunakan `django-ratelimit` untuk membatasi permintaan per endpoint:
   - Registrasi: max 10 per IP/jam
   - Login: max 30 per IP/menit
   - Google Auth: max 20 per IP/jam
   - List kanji/grammar/vocab: max 200 per IP/menit
   - Get kanji/grammar/vocab: max 300 per IP/menit
   - Password reset request: max 5 per IP/jam
   - Password reset confirm: max 10 per IP/menit
   - Dan banyak lagi!
6. **Rate Limit Decorator**: Ada decorator khusus `@rate_limit` di `core/decorators.py` yang mudah diterapkan ke setiap endpoint!

---

## 6. Kesimpulan
Kode JBook sudah memiliki dasar yang **sangat bagus**! Logika konjugasi/dekonjugasi adalah fitur kunci yang sangat lengkap dan bermanfaat. Fokus perbaikan selanjutnya adalah pada **optimasi query database**, **keamanan (rate limiting)**, dan **refactoring code duplikasi** untuk membuat kode lebih maintainable dan cepat.

Selamat coding! 🚀
