# RE-SKIN — Autentikasi Email + Password

RE-SKIN menggunakan alur autentikasi standar Supabase Auth. Anggota membuat akun dengan nama lengkap, email, password, dan pilihan avatar. Supabase mengirim email konfirmasi untuk mengaktifkan akun. Setelah email dikonfirmasi, anggota login menggunakan email dan password.

## 1. Aktifkan provider Email

1. Buka Supabase Dashboard project RE-SKIN.
2. Masuk ke **Authentication → Sign In / Providers → Email** (nama menu dapat berubah mengikuti tampilan dashboard).
3. Aktifkan **Enable email provider**.
4. Aktifkan **Confirm email** agar pendaftaran akun baru memerlukan verifikasi alamat email.
5. Atur **Minimum password length** menjadi 8 karakter atau lebih.
6. Disarankan mengaktifkan **Secure email change** dan **Secure password change**.
7. Tidak perlu mengaktifkan Magic Links atau Email OTP untuk alur login RE-SKIN saat ini.

## 2. Template email

Gunakan template bawaan Supabase untuk **Confirm signup**. Tidak perlu mengubah HTML template atau upgrade paket hanya untuk memakai konfirmasi email standar.

Pastikan tautan konfirmasi menggunakan variabel `{{ .ConfirmationURL }}` atau template bawaan yang disediakan Supabase. Jangan menggantinya dengan `{{ .Token }}` karena RE-SKIN menggunakan tautan konfirmasi, bukan kode OTP.

## 3. URL Configuration

Di **Authentication → URL Configuration**:

- **Site URL**: URL production Vercel, misalnya `https://domain-kamu.vercel.app`.
- **Redirect URLs**: tambahkan `http://localhost:3000/auth/callback` untuk pengembangan lokal.
- Tambahkan `https://domain-kamu.vercel.app/auth/callback` untuk production.
- Tambahkan pola callback yang mengizinkan query `next` untuk fitur lupa password, misalnya `http://localhost:3000/auth/callback**` dan `https://domain-kamu.vercel.app/auth/callback**`.
- Jika dashboard Supabase menolak pola wildcard, masukkan URL callback lengkap yang sesuai dengan environment yang sedang diuji.

Gunakan domain Vercel yang benar-benar dipakai project. Jangan menambahkan domain yang tidak kamu kendalikan.

## 4. Alur anggota

### Membuat akun
1. Buka Beranda RE-SKIN lalu klik **Daftar Sekarang**.
2. Pilih tab **Buat Akun**.
3. Isi nama lengkap, email aktif, password minimal 8 karakter, dan pilihan avatar.
4. Baca pemberitahuan penggunaan data dan centang persetujuan.
5. Klik **Buat Akun**.
6. Buka email konfirmasi dari Supabase dan klik tautan verifikasi.
7. Setelah email terkonfirmasi, kembali ke RE-SKIN dan login menggunakan email serta password.

### Login
1. Pilih tab **Masuk**.
2. Isi email dan password yang sudah terdaftar.
3. Jika email belum dikonfirmasi, buka email konfirmasi terlebih dahulu.
4. Setelah berhasil login, anggota diarahkan ke Member Area. Akun admin diarahkan ke Admin Dashboard berdasarkan role di database.

### Lupa password
1. Pada tab **Masuk**, isi alamat email akun.
2. Klik **Lupa password?**.
3. Buka email pemulihan dari Supabase dan ikuti tautannya.
4. Buat password baru minimal 8 karakter.

## 5. Pengiriman email

Untuk pengembangan dan pengujian tugas kuliah, layanan email bawaan Supabase dapat digunakan dengan memperhatikan batas pengiriman dan pembatasan penerima pada layanan default. Jika email tidak masuk, periksa Inbox, Spam, dan pengaturan URL. Untuk penggunaan publik atau pengiriman ke banyak pengguna, pertimbangkan SMTP khusus dan domain pengirim terverifikasi.

## 6. Keamanan

- Supabase Auth mengelola proses autentikasi, konfirmasi email, reset password, dan sesi pengguna.
- Aplikasi RE-SKIN tidak menyimpan password sebagai teks biasa dan tidak menampilkannya kepada admin.
- Jangan pernah mengekspos Supabase Secret Key atau `service_role` key ke browser maupun repository publik.
- Pastikan Row Level Security (RLS) tetap aktif dan role admin hanya ditetapkan melalui database oleh pihak berwenang.
- Pengguna harus menjaga kerahasiaan password dan tidak membagikannya kepada orang lain.
- Tidak ada sistem digital yang 100% bebas risiko; keamanan bergantung pada konfigurasi Supabase, RLS, kredensial, dan pengelolaan akses.
