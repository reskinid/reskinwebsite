# RE-SKIN V16 — Pisahkan Login dan Pendaftaran

## Perubahan
- Form autentikasi Supabase kini memiliki dua tab: **Masuk** dan **Buat Akun**.
- Tab Masuk hanya menampilkan Email dan Password. Nama lengkap tidak ditampilkan dan tidak diminta.
- Tab Buat Akun menampilkan Nama Lengkap, Email, dan Password. Nama lengkap diwajibkan untuk pendaftaran.
- Tombol utama mengikuti tab yang dipilih.
- Mode demo tetap menggunakan alur demo yang sudah ada.
- Login tetap menggunakan `supabase.auth.signInWithPassword`.
- Pendaftaran tetap menggunakan `supabase.auth.signUp` dan menyimpan `full_name` pada user metadata.
- Pengalihan setelah autentikasi tetap menuju `/dashboard`.

## Cara menggunakan
1. Ekstrak project V16.
2. Salin `.env.local` dari project sebelumnya ke folder project V16.
3. Jalankan `npm install`.
4. Jalankan `npm run dev`.
5. Klik Masuk/Daftar di landing page.
6. Uji tab Masuk: hanya Email dan Password yang tampil.
7. Uji tab Buat Akun: Nama Lengkap, Email, dan Password tampil.

Tidak ada migration SQL tambahan untuk perubahan ini. Struktur database dan akun Supabase yang sudah ada tidak perlu diubah.
