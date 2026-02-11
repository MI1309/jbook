# Panduan Pengujian (Testing Guide)

Dokumen ini berisi daftar pengujian manual dan otomatis untuk memverifikasi fungsionalitas aplikasi JBook.

## 1. Pengujian Manual (User Acceptance Testing)

### A. Fitur Kanji
| ID | Skenario | Langkah-langkah | Ekspektasi | Status |
| :--- | :--- | :--- | :--- | :--- |
| **K-01** | Melihat Daftar Kanji | 1. Buka halaman Home<br>2. Klik "Belajar Kanji" | Menampilkan grid kartu Kanji (日, 本, 学, dst). | |
| **K-02** | Detail Kanji | 1. Klik salah satu kartu Kanji | Masuk ke halaman detail. Menampilkan Onyomi, Kunyomi, Stroke, dan Contoh Kata. | |
| **K-03** | Navigasi Kembali | 1. Dari halaman detail, klik "Kembali ke Daftar" | Kembali ke halaman list Kanji. | |

### B. Fitur Bunpo (Tata Bahasa)
| ID | Skenario | Langkah-langkah | Ekspektasi | Status |
| :--- | :--- | :--- | :--- | :--- |
| **B-01** | Melihat Daftar Bunpo | 1. Buka halaman Home<br>2. Klik "Belajar Tata Bahasa" | Menampilkan grid kartu Bunpo (Grammar). | |
| **B-02** | Detail Bunpo | 1. Klik salah satu kartu Bunpo | Masuk ke halaman detail. Menampilkan Struktur, Penjelasan, dan Contoh Kalimat. | |

### C. Fitur PWA (Progressive Web App)
| ID | Skenario | Langkah-langkah | Ekspektasi | Status |
| :--- | :--- | :--- | :--- | :--- |
| **P-01** | Instalasi App | 1. Buka di Chrome/Edge<br>2. Klik ikon "Install" di address bar | Muncul prompt instalasi. Aplikasi terbuka di window terpisah. Icon muncul di Desktop/Home. | |
| **P-02** | Akses Offline | 1. Matikan internet (Wifi/LAN)<br>2. Refresh halaman atau navigasi ke halaman yang pernah dibuka | Halaman tetap terbuka (tidak muncul "No Internet"). | |

---

## 2. Pengujian Otomatis (Automated Testing)

### Backend (Django)

Jalankan perintah berikut untuk menguji API Backend:

```bash
cd backend
source venv/bin/activate
python manage.py test
```

*Saat ini belum ada unit test yang ditulis, ini adalah placeholder untuk pengembangan selanjutnya.*

**Rencana Test Case Backend:**
- `test_list_kanji`: Memastikan endpoint `/api/content/kanji` mengembalikan status 200 dan list data.
- `test_get_kanji_detail`: Memastikan detail kanji yang benar dikembalikan berdasarkan ID.
- `test_filter_jlpt`: Memastikan filter `?level=5` hanya mengembalikan item N5.

### Frontend (Next.js)

Jalankan linter untuk memastikan kualitas kode:

```bash
cd frontend-web
npm run lint
```

**Rencana Test Case Frontend (Cypress/Jest):**
- Render halaman Home.
- Navigasi dari Home ke Kanji List.
- Verifikasi data API tampil di kartu komponen.
