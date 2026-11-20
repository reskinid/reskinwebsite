# RE-SKIN V15 — Penyempurnaan Notifikasi

## Yang diperbarui

1. Klik notifikasi membuka pengajuan atau bagian profil yang terkait.
2. Notifikasi otomatis ditandai dibaca ketika dibuka.
3. Tombol Tandai semua dibaca memperbarui status baca di database.
4. Riwayat notifikasi tetap tersimpan dan dapat difilter: Semua, Aktivitas, dan Pembaruan status.
5. Deep link mencakup pickup, penukaran hadiah, dan pengajuan penghapusan akun.

## Instalasi

1. Ekstrak ZIP V15-FIX.
2. Salin `.env.local` dari project sebelumnya ke folder project hasil ekstrak. File environment tidak disertakan dalam ZIP.
3. Di Supabase SQL Editor, jalankan seluruh isi file:
   `supabase/migrations/20261119_notification-deep-links-history.sql`
4. Migration ini ditujukan untuk project yang sudah memasang schema V12 dan migration notifikasi member sebelumnya.
5. Jalankan `npm install`, lalu `npm run dev`.
6. Pastikan `RE_SKIN_DEMO_MODE=false` ketika menguji koneksi Supabase.

Migration menggunakan transaksi, mengganti fungsi notifikasi, dan memasang ulang trigger dengan nama yang sama. Tidak menghapus tabel, transaksi, atau riwayat notifikasi.
