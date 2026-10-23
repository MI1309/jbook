# Panduan Enkripsi dan Pemulihan Email Akun

Panduan ini menjelaskan penyimpanan email pengguna JBook dan cara memperbaiki email akun pada database yang benar, termasuk production. Nama file memakai ejaan `engkripsi` sesuai permintaan.

## Cara kerja penyimpanan

Email tidak disimpan sebagai alamat biasa di kolom `users_user.email`.

- `email_ciphertext` berisi email terenkripsi agar aplikasi dapat mengirim email reset.
- `email_lookup_hash` berisi HMAC untuk pencarian email saat login, registrasi, dan reset password.
- `email` berisi alias acak dengan domain `@privacy.invalid`.

Enkripsi dan HMAC memakai `EMAIL_ENCRYPTION_KEY`. Saat akun dibuat atau email diperbarui, `User.save()` mengisi ketiga kolom tersebut. Karena itu, jangan memperbarui kolom `email` langsung melalui SQL atau `QuerySet.update()`.

## Kunci enkripsi wajib dipertahankan

`EMAIL_ENCRYPTION_KEY` harus sama dengan kunci yang digunakan saat email akun dienkripsi dan hash pencariannya dibuat. Jika nilainya berubah atau berbeda antara database dan aplikasi, email tidak dapat didekripsi dan pencarian login/reset tidak akan cocok.

- Ambil kunci dari secret/environment production yang sudah dipakai aplikasi.
- Jangan mengganti kunci untuk mencoba memperbaiki satu akun.
- Jangan menaruh kunci di source control, dokumen, tiket, chat, atau perintah yang tersimpan di shell history.
- Simpan salinan rahasia dengan aman di luar database.
- `SECRET_KEY` hanya boleh menjadi fallback jika memang itulah kunci yang digunakan saat record dibuat. Jangan menganggap kedua kunci dapat saling menggantikan.

## Memperbaiki email di production

Lakukan langkah berikut melalui konsol PythonAnywhere yang terhubung ke aplikasi dan database production. Jangan menjalankan perintah di checkout lokal lalu menganggap production ikut berubah.

1. Buka konsol Bash PythonAnywhere, masuk ke folder backend production, lalu aktifkan virtual environment yang dipakai web app. Gunakan path dan environment milik deployment yang sebenarnya.

   ```bash
   cd /path/ke/backend-production
   source /path/ke/virtualenv/bin/activate
   ```

2. Pastikan konsol memuat konfigurasi production, terutama `EMAIL_ENCRYPTION_KEY`, serta mengarah ke database yang benar. Jangan mencetak nilai kunci atau URL database yang mengandung kredensial.

   ```bash
   python manage.py shell
   ```

   Di shell Django:

   ```python
   from django.conf import settings
   from django.contrib.auth import get_user_model

   User = get_user_model()
   print(settings.DATABASES["default"]["ENGINE"])
   print(settings.DATABASES["default"].get("NAME", "configured database"))
   print(list(User.objects.filter(username="USERNAME_AKUN").values(
       "username", "is_active", "is_staff", "is_superuser"
   )))
   ```

   Pastikan username, status akun, dan database yang tampil memang target production. Jika tidak cocok, berhenti. Jangan meneruskan perubahan pada database yang salah.

3. Buat backup database production melalui mekanisme backup yang sesuai dengan jenis database yang tampil. Untuk SQLite, hentikan sementara penulisan aplikasi atau gunakan fasilitas backup SQLite yang konsisten. Jangan memakai perintah backup SQLite untuk MySQL/PostgreSQL.

4. Untuk kasus ini, targetnya username `anonymousmr.i` dan email `imronm1309@gmail.com`. Periksa apakah email sudah dipakai akun lain dengan helper aplikasi dan kunci production yang aktif:

   ```python
   from django.contrib.auth import get_user_model
   from users.privacy import email_lookup_digest

   User = get_user_model()
   username = "anonymousmr.i"
   email = "imronm1309@gmail.com"
   user = User.objects.get(username=username)
   digest = email_lookup_digest(email)
   matches = list(
       User.objects.filter(email_lookup_hash=digest)
       .exclude(pk=user.pk)
       .values_list("username", flat=True)
   )
   print("Target account:", user.username, "active:", user.is_active)
   print("Email already attached to another account:", bool(matches))
   ```

   Pastikan target adalah akun yang benar dan aktif. Jika `matches` tidak kosong, berhenti; jangan menghapus atau memindahkan email dari akun lain secara otomatis.

5. Jika target benar dan email belum dipakai akun lain, perbarui record melalui model. Operasi ini menyimpan ciphertext, lookup hash, dan alias bersama dalam transaksi, lalu memverifikasi nilai tersimpan:

   ```python
   from django.db import transaction
   from users.privacy import email_lookup_digest

   with transaction.atomic():
       user = User.objects.select_for_update().get(username="anonymousmr.i")
       user.email = "imronm1309@gmail.com"
       user.save()
       user.refresh_from_db()
       assert user.email.endswith("@privacy.invalid")
       assert user.email_lookup_hash == email_lookup_digest("imronm1309@gmail.com")
       assert user.get_private_email() == "imronm1309@gmail.com"
   print("Email tersimpan dan lookup terverifikasi untuk:", user.username)
   ```

   Jika salah satu `assert` gagal, transaksi dibatalkan. Keluar dari shell hanya setelah semua pemeriksaan berhasil. Setelah itu reload web app PythonAnywhere agar proses aplikasi memakai konfigurasi yang sama.

## Audit penyimpanan email

Perintah audit memverifikasi ciphertext, hash, dan alias tanpa menampilkan email pengguna:

```bash
python manage.py audit_email_storage
```

Untuk memeriksa satu akun secara eksplisit, audit menyediakan opsi reveal. Gunakan hanya di konsol privat yang aksesnya terbatas karena perintah ini mencetak email dan ciphertext:

```bash
python manage.py audit_email_storage --username USERNAME_AKUN --reveal
```

## Diagnosis umum

- `User not found` saat login email: akun tidak ditemukan pada database yang sedang dipakai, atau lookup hash dibuat dengan `EMAIL_ENCRYPTION_KEY` yang berbeda.
- `Incorrect password`: akun ditemukan; masalahnya pada password, bukan pencarian email.
- Reset password menyatakan email belum berhasil dikirim: periksa log backend dan konfigurasi SMTP (`EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, dan `DEFAULT_FROM_EMAIL`). Kunci enkripsi email tidak mengirim email; SMTP yang mengirimnya.
- Email ditemukan di SQLite lokal tetapi tidak di production: perubahan lokal tidak otomatis tersalin ke server. Ulangi prosedur dengan konsol dan database production.

## Referensi implementasi

- `backend/users/privacy.py`: normalisasi, enkripsi, dekripsi, dan HMAC email.
- `backend/users/models.py`: penyimpanan privat di `User.save()`.
- `backend/users/migrations/0004_private_email_storage.py`: migrasi perlindungan email.
- `backend/users/management/commands/audit_email_storage.py`: audit integritas email.
