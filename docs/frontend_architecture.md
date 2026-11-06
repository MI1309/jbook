# Arsitektur Frontend dan SOLID

Dokumen ini mencatat kondisi arsitektur frontend yang teramati, bukan target ideal atau sertifikasi kepatuhan. Penilaian terakhir: 6 November 2026.

## Cakupan dan Kesimpulan

Frontend web utama berada di `frontend-web/`. `mobile-app/` saat ini masih berisi starter screen Expo, sehingga belum memiliki cukup alur atau modul untuk dinilai setara.

**Kesimpulan:** frontend web sudah memakai beberapa pola yang selaras dengan SOLID, seperti komponen bersama, context untuk state lintas halaman, dan utility terpisah. Namun penerapannya belum konsisten. Beberapa page dan provider masih menggabungkan presentasi, workflow, dan akses jaringan. SOLID adalah alat bantu desain, bukan checklist yang harus dipaksakan ke setiap komponen React.

## Penilaian Prinsip

| Prinsip | Status saat ini | Bukti dan batasan |
|---|---|---|
| **S — Single Responsibility** | Sebagian | Ada komponen bersama seperti [AuthLayout](../frontend-web/components/auth/AuthLayout.jsx) dan context sempit seperti [PracticeContext](../frontend-web/context/PracticeContext.js). Sebaliknya, [AuthContext](../frontend-web/context/AuthContext.js) mengelola pemulihan sesi, refresh token, cookie, login/register, reset password, profil, poin TTS, dan navigasi. [Halaman admin Kotoba](../frontend-web/app/admin/kotoba/page.jsx) juga merangkai state UI, fetch, hapus, ekspor CSV, pemeriksaan duplikat, dan visibilitas level. |
| **O — Open/Closed** | Sebagian, belum eksplisit | Utility dan komponen bersama dapat digunakan ulang. Pada contoh halaman admin Kotoba, perubahan workflow seperti sumber data atau aturan ekspor masih mendorong perubahan pada page yang sama; belum ada batas ekstensi yang konsisten untuk semua fitur. Ini kesimpulan dari contoh yang ditinjau, bukan seluruh halaman. |
| **L — Liskov Substitution** | Belum cukup bukti | Frontend React lebih banyak memakai composition dan hooks daripada pewarisan kelas. Belum ada dasar untuk menyatakan substitusi komponen/implementasi telah dijaga secara sistematis. Nilai kompatibilitas melalui kontrak props dan perilaku komponen, bukan dengan menambah inheritance buatan. |
| **I — Interface Segregation** | Sebagian | Halaman register hanya mengambil operasi `register` dari context, tetapi [AuthContext](../frontend-web/context/AuthContext.js) tetap menyediakan banyak operasi akun dalam satu provider. [jbookApi](../frontend-web/services/jbookApi.js) menggabungkan endpoint auth, content, learning, dan admin dalam satu client. Tidak setiap consumer memakai semua metode tersebut. |
| **D — Dependency Inversion** | Belum konsisten | Pemisahan akses data sudah ada melalui [lib/api.js](../frontend-web/lib/api.js) dan `jbookApi`, tetapi kedua client berjalan berdampingan. AuthContext dan halaman admin Kotoba masih memanggil `fetch` langsung. Akibatnya aturan URL, token, dan penanganan error tidak memiliki satu boundary yang konsisten. |

## Batas Modul Saat Ini

- Route dan halaman berada di `frontend-web/app/`; komponen yang dipakai ulang berada di `frontend-web/components/`.
- State global utama dikelola oleh `AuthContext`, `ThemeContext`, dan `PracticeContext`. State tertentu menggunakan Zustand.
- Akses backend tersebar antara `frontend-web/lib/api.js`, `frontend-web/services/jbookApi.js`, serta pemanggilan `fetch` di beberapa context/page.
- Kontrak API utama berada di backend Django; frontend tetap perlu mengubah response menjadi bentuk yang sesuai untuk tampilan dan workflow.

## Arah Perbaikan Bertahap

1. Untuk endpoint baru, pilih satu client akses data yang aktif dan dokumentasikan pemilik domainnya. Hindari menambahkan endpoint yang sama ke beberapa client.
2. Pindahkan request dan normalisasi response dari page ke modul domain/API yang sudah digunakan fitur tersebut. Page tetap mengatur interaksi layar, bukan detail URL dan token.
3. Pertahankan Context sebagai pemilik state lintas halaman. Pindahkan operasi jaringan atau workflow yang tumbuh besar ke modul auth/API yang terpisah, lalu biarkan Context mengoordinasikan state sesi.
4. Pecah halaman admin ketika perubahan terpisah mulai mengganggu satu sama lain, misalnya query data, operasi mutasi, dan ekspor. Jangan membuat hook atau service baru hanya untuk memindahkan beberapa baris.
5. Pertahankan helper transformasi sebagai fungsi murni dan uji perilakunya. Gunakan komposisi serta kontrak props yang jelas; tambahkan abstraction/interface hanya saat ada kebutuhan nyata untuk beberapa implementasi atau pengujian terisolasi.

Dokumen arsitektur route dan alur fitur yang lebih rinci berada di `frontend-web/docs/ARCHITECTURE.md` pada workspace lokal. Folder tersebut di-ignore oleh Git; dokumen ini adalah catatan arsitektur frontend yang dilacak bersama repository.