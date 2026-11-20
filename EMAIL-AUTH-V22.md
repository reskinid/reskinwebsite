# RE-SKIN V22 — Email Confirmation + Password Login

## Keputusan autentikasi
- Menggunakan satu metode autentikasi: Email + Password.
- Pendaftaran meminta nama lengkap, email, password, dan pilihan avatar.
- Email confirmation Supabase wajib diaktifkan untuk akun baru.
- Login menggunakan email dan password setelah email dikonfirmasi.
- Tidak ada Google OAuth, Email OTP, atau Magic Link login.
- Tab Masuk dan Buat Akun tetap dipisahkan.
- Disclaimer pendaftaran menjelaskan email konfirmasi Supabase, penggunaan data, dan pengelolaan password.
- Login menyediakan tautan Lupa Password melalui Supabase Auth.
- Setelah autentikasi, role admin diarahkan ke `/admin`; anggota ke `/dashboard`; profil anggota yang belum lengkap ke `/profile-setup`.

## Penerapan
1. Gunakan Supabase project yang sudah terhubung. Tidak perlu membuat project baru.
2. Pastikan `.env.local` tetap berisi URL dan publishable key project yang sama.
3. Aktifkan Email provider dan Confirm email pada Supabase Auth.
4. Gunakan template bawaan Confirm Signup. Tidak perlu mengubah template email atau upgrade paket untuk alur standar.
5. Tambahkan URL callback lokal dan Vercel sesuai `supabase/EMAIL-PASSWORD-SETUP.md`.
6. Jalankan `npm install`, `npm run dev`, lalu tes pendaftaran, konfirmasi email, login, dan lupa password.

## Catatan
- Migration profil/avatar yang sudah dijalankan sebelumnya tidak perlu dijalankan ulang hanya karena perubahan metode login.
- Jika project Supabase sudah memiliki akun uji, gunakan email yang belum terdaftar untuk mengetes pendaftaran baru.
- Email confirmation hanya berjalan jika opsi Confirm email aktif di Supabase Auth.
