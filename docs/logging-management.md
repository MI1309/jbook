# Panduan Manajemen Logging JBook

Dokumen ini menjelaskan implementasi sistem logging terpusat untuk aplikasi JBook, baik dari sisi Frontend (Next.js) maupun Backend (Django).

Sistem logging ini bertujuan untuk memudahkan proses *debugging*, pelacakan masalah di *production*, serta memastikan bahwa log informasi sensitif tidak bocor ke browser pengguna umum.

---

## 1. Frontend Logging (Next.js)

Di sisi Frontend, kita tidak lagi menggunakan `console.log()` biasa secara langsung di seluruh komponen. Sebagai gantinya, kita menggunakan sebuah *utility wrapper* yang telah disediakan di `utils/logger.js`.

### Kenapa menggunakan logger.js?
- Di environment **Development** (`npm run dev`), semua log akan dicetak dengan warna agar mudah dibaca.
- Di environment **Production** (Vercel), fungsi `logger.debug` dan `logger.info` akan **disembunyikan** secara otomatis. Ini menjaga agar *console* browser pengguna tetap bersih dan tidak membocorkan data. `logger.warn` dan `logger.error` akan tetap dicetak.
- Di masa depan, `logger.error` dapat dengan mudah diintegrasikan dengan Sentry atau API Backend untuk memantau error dari pengguna (*client-side*).

### Cara Penggunaan
Setiap kali Anda butuh melakukan log di komponen atau *service*, impor `logger` dan gunakan fungsinya:

```javascript
import logger from '@/utils/logger';

// 1. Debug: Untuk melacak jalannya fungsi (hanya terlihat di dev)
logger.debug('Fungsi fetchData() sedang dijalankan...', data);

// 2. Info: Untuk informasi sukses atau tahapan penting (hanya terlihat di dev)
logger.info('User berhasil login dengan ID:', userId);

// 3. Warn: Untuk kondisi tak terduga yang tidak menyebabkan error (terlihat di semua env)
logger.warn('Data kosong saat mengambil profil dari API.');

// 4. Error: Untuk error di try/catch block (terlihat di semua env)
try {
  // kode berisiko
} catch (error) {
  logger.error('Gagal memuat materi Kanji', error);
}
```

---

## 2. Backend Logging (Django)

Backend JBook (Django) kini menggunakan sistem konfigurasi standard bawaan Python `logging` (via `LOGGING` dict di `core/settings.py`).

### Cara Kerjanya
Log dikonfigurasi untuk diarahkan ke dua tempat (Handler):
1. **Console**: Dicetak ke terminal saat server Django berjalan.
2. **File Handler (`backend/logs/django.log`)**: Log berlevel `WARNING` ke atas (termasuk `ERROR` dan `CRITICAL`) akan ditulis ke dalam file log tersebut. Mekanismenya menggunakan `RotatingFileHandler`, sehingga ketika file log mencapai 5 MB, Django akan otomatis membuat file baru (menyimpan 5 file backup). Ini mencegah file log menghabiskan ruang penyimpanan di server.

### Cara Penggunaan di Backend (Python/Django)
Di file mana saja di Backend (misalnya di `main.py` atau *views/endpoints*), Anda cukup menggunakan modul standar `logging`:

```python
import logging

# Secara otomatis akan menggunakan konfigurasi dari settings.py
logger = logging.getLogger('django')

def my_api_view(request):
    logger.info("API my_api_view dipanggil.") # Akan masuk terminal
    try:
        # Lakukan sesuatu
        pass
    except Exception as e:
        logger.error(f"Terjadi kesalahan di my_api_view: {e}", exc_info=True) 
        # Akan masuk terminal DAN file backend/logs/django.log
```

## Kesimpulan

Gunakan selalu standar ini setiap kali menambahkan fitur baru, agar:
- Di Vercel, *console* pengunjung bersih.
- Di backend PythonAnywhere / Server, *error* tercatat rapi di dalam file `logs/django.log` yang sewaktu-waktu dapat kita inspeksi jika terjadi *server crash*.
