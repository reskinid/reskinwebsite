# RE-SKIN V25 — Mobile UI & Brand Identity Update

Paket ini melanjutkan source RE-SKIN V23 dengan patch build V24, lalu menambahkan perbaikan UI mobile dan aset identitas visual yang diberikan.

## Perbaikan UI

1. **Navbar mobile:** ikon hamburger dan X sekarang saling bergantian berdasarkan status menu. Label aksesibilitas ikut berubah antara buka dan tutup.
2. **Quick Start:** jarak visual antara kata “dari” dan “kemasan kosongmu!” diperbaiki pada ukuran layar ketika pemisah baris disembunyikan.
3. **FAQ:** simbol plus/minus dipusatkan secara horizontal dan vertikal di dalam lingkaran.
4. **Header dashboard mobile:** tombol notifikasi, Beranda, dan profil ditata dalam satu baris yang memanfaatkan lebar layar pada dashboard Admin dan Member, termasuk mode demo. Panel notifikasi tetap dibuka dari posisi yang terlihat di layar.

## Aset identitas visual

- `public/favicon.ico` — ikon tab/browser RE-SKIN.
- `public/reskin-logo-color.png` — logo untuk navbar landing page.
- `public/reskin-logo-white.png` — logo putih untuk footer landing page.
- `public/reskin-logo-black.png` — logo hitam untuk navbar dashboard Admin dan Member.

## File utama yang diperbarui

- `src/content/landing-page.html`
- `src/app/globals.css`
- `src/components/LandingInteractions.tsx`
- `src/app/layout.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/admin/page.tsx`
- `src/components/demo/DemoMemberDashboard.tsx`
- `src/components/demo/DemoAdminDashboard.tsx`

## Dampak ke database dan konfigurasi

Tidak ada perubahan SQL, tabel, RLS, akun, transaksi, SKINPoint, atau data Supabase. Tidak ada perubahan environment variable. File `.env.local` dan folder `.git` tidak disertakan dalam paket agar konfigurasi lokal dan riwayat Git pengguna tetap terpisah.

## Cara menerapkan ke folder project lokal

1. Buat salinan cadangan folder project lokal.
2. Ekstrak isi ZIP ini ke folder project RE-SKIN yang sedang digunakan.
3. Izinkan file dengan nama sama untuk ditimpa.
4. Jangan menghapus atau mengganti `.env.local` dan folder `.git` milik project lokal.
5. Jalankan `npm ci`, lalu `npm run build`.
6. Jika build berhasil, lakukan `git status`, commit, dan push ke GitHub agar Vercel menjalankan deployment baru.
