# Fitur Disabled Sementara

## Latihan Tambahan

**Status:** Disabled dari tampilan utama untuk sementara.

**Dampak saat ini:**
- Banner `Latihan Tambahan` tidak ditampilkan di halaman `/practice`.
- Link menuju `/practice/custom` tidak ditampilkan dari halaman latihan.
- Latihan utama JLPT, Minna no Nihongo, dan fitur guest tetap tersedia.

**Yang tidak dihapus:**
- Route `/practice/custom` tetap ada.
- Halaman daftar modul custom tetap ada.
- Komponen dan endpoint modul custom tetap dipertahankan.

**Cara mengaktifkan kembali:**
1. Buka `frontend-web/app/practice/page.jsx`.
2. Tambahkan kembali banner yang mengarah ke `/practice/custom` pada header halaman latihan.
3. Jalankan `npm run build` dari direktori `frontend-web`.

Fitur ini disembunyikan karena keputusan produk masih dalam pertimbangan. Jangan menghapus implementasi custom practice sebelum ada keputusan final.

## Kanji N1, N2, dan N3

**Status:** Disabled sementara dari daftar Kanji dan latihan Kanji.

**Dampak saat ini:**
- Daftar Kanji hanya menampilkan N5 dan N4.
- Filter level Kanji hanya menampilkan N5 dan N4.
- Latihan Kanji hanya menggunakan data N5 dan N4, termasuk bila parameter URL/API mencoba meminta N1-N3.

**Yang tidak dihapus:**
- Data Kanji N1-N3 tetap tersimpan di database dan sumber data.
- Metadata radikal dan relasi data tetap dipertahankan.

**Kontrol admin:**
- Buka `/admin/kanji` dan gunakan panel `Visibilitas Kanji` untuk mengubah status ON/OFF setiap level N1-N5.
- Perubahan tersimpan otomatis dan berlaku untuk daftar publik, filter Kanji, latihan Kanji, dan mode offline saat konfigurasi terbaru berhasil diambil.
- Halaman Admin Kanji tetap dapat melihat dan mengedit semua data level untuk keperluan pengembangan.

**Cara mengaktifkan kembali:**
1. Buka `/admin/kanji`.
2. Klik tombol level yang berstatus `OFF` sampai berubah menjadi `ON`.
3. Perubahan langsung tersimpan melalui API admin.
