# Dokumentasi Fitur Announcements (Pengumuman)

Fitur **Announcements** berfungsi untuk memberikan informasi, peringatan, atau pengumuman penting secara global kepada pengguna aplikasi JBook. Pengumuman ini dikelola melalui halaman Admin Panel dan ditampilkan kepada pengguna baik sebagai *Banner* statis maupun *Modal Popup*.

---

## 📂 File yang Berkaitan

Berikut adalah daftar file yang membangun fitur pengumuman ini secara *end-to-end* (dari Backend hingga Frontend):

### Backend (Django + Ninja API)
1. **Model Database**
   - 📄 `backend/content/models.py` (Mendefinisikan class `Announcement` beserta kolom seperti `title`, `content`, `type`, `is_active`, `show_as_popup`).
2. **API Admin (CRUD)**
   - 📄 `backend/content/admin_api.py` (Berisi endpoint untuk mengelola pengumuman oleh admin: GET, POST, PUT, DELETE di `/api/admin/announcements`).
3. **API Publik (Tampil ke User)**
   - 📄 `backend/content/api.py` (Berisi endpoint publik GET `/api/content/announcements` yang hanya memunculkan pengumuman dengan status `is_active=True`).

### Frontend (Next.js)
1. **Halaman Manajemen Admin**
   - 📄 `frontend-web/app/admin/announcements/page.jsx` (Halaman dashboard untuk Admin melihat daftar pengumuman, membuat baru, mengedit, dan menghapus).
2. **Komponen Penampil (Global)**
   - 📄 `frontend-web/components/AnnouncementPopup.jsx` (Komponen sisi klien yang mengambil data dari publik API dan menampilkannya sebagai banner atau popup sesuai setingan admin. Komponen ini juga mengatur status "Dismis" yang tersimpan di `localStorage` agar tidak muncul berulang kali bagi user yang sama).

---

## 🛠️ Detail Arsitektur API

### 1. Model Database
Tabel `Announcement` memiliki atribut kunci:
- `title` & `content`: Isi pesan pengumuman.
- `type`: Menentukan warna/tema peringatan (`info` biru, `warning` kuning, `important` merah, `success` hijau).
- `is_active`: Jika `False`, pengumuman dimatikan (draft) dan tidak ditarik oleh endpoint publik.
- `show_as_popup`: Menentukan bagaimana ia di-*render* di frontend (True = Modal di tengah layar, False = Banner di bagian atas).

### 2. Publik API Endpoint
- **Rute:** `GET /api/content/announcements`
- **Otorisasi:** Tidak ada (Terbuka untuk semua user).
- **Logika:** Mengambil seluruh pengumuman di mana `is_active=True` dan diurutkan berdasarkan `created_at` paling baru.

### 3. Admin API Endpoint
Semua endpoint admin harus dikirimkan dengan header `Authorization: Bearer <token>` milik pengguna berstatus Admin.
- **Daftar Data:** `GET /api/admin/announcements`
- **Buat Data:** `POST /api/admin/announcements`
- **Edit Data:** `PUT /api/admin/announcements/{id}`
- **Hapus Data:** `DELETE /api/admin/announcements/{id}`

---

## 🔄 Alur Data (Flow)

1. **Pembuatan:** Admin JBook masuk ke Dashboard, masuk ke menu Pengumuman, dan menekan "Buat Pengumuman Baru". Proses ini mengirim `POST /api/admin/announcements`.
2. **Pengambilan Klien:** Ketika pengguna membuka situs, komponen `AnnouncementPopup.jsx` otomatis dimuat dan memanggil `GET /api/content/announcements`.
3. **Pengecekan Tampilan:** Frontend memeriksa ID pengumuman dari backend dengan `dismissed_announcements` di dalam `localStorage` browser.
4. **Tampil ke User:**
   - Jika ID belum ada di history `localStorage`, pengumuman ditampilkan berdasarkan tipenya (Popup / Banner).
   - Setelah user mengklik "Saya Mengerti" (Dismiss), ID pengumuman disimpan ke history browser, sehingga tidak dimunculkan lagi saat navigasi ke halaman berikutnya.
