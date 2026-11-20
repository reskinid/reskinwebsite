# RE-SKIN V18 — Avatar Profil Member

## Perubahan antarmuka
- Menghapus baris **Area layanan** dari dropdown profil member (landing page/dashboard dan mode demo).
- Menambahkan pilihan tampilan avatar saat pengguna memilih tab **Buat Akun**.
- Pilihan avatar: Laki-laki, Perempuan berhijab, dan Perempuan tanpa hijab.
- Avatar yang dipilih digunakan pada navbar landing page, dropdown profil dashboard, dan halaman pengajuan pickup.
- Pilihan avatar disimpan sebagai preferensi `avatar_style`, bukan menyimpan data jenis kelamin.

## Perubahan database Supabase
Kolom `profiles.avatar_style` ditambahkan dengan nilai yang diizinkan:
- `male`
- `female_hijab`
- `female_no_hijab`

Akun lama otomatis menggunakan avatar default `female_hijab`. Akun baru menyimpan pilihan saat pendaftaran.

## Langkah penerapan
1. Buka Supabase Dashboard → SQL Editor.
2. Jalankan isi file `supabase/migrations/20261119_member_avatar_style.sql`.
3. Ganti file project lokal dengan versi V18.
4. Jalankan `npm install` jika dependency belum tersedia, lalu `npm run dev`.
5. Buka landing page, klik **Daftar Sekarang** → tab **Buat Akun**.
6. Pilih avatar, lengkapi nama, email, dan password, lalu daftar.
7. Setelah login, avatar pilihan akan tampil di navbar dan dropdown profil.

## Catatan validasi
Pemeriksaan build TypeScript/Next.js belum dapat diselesaikan di lingkungan penyusunan ini karena dependency npm tidak berhasil terpasang (proses instalasi timeout). Jalankan `npm install` dan `npm run build` di laptop project untuk verifikasi akhir.
