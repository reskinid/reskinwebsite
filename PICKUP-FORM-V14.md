# Perbaikan Formulir Pickup RE-SKIN V14

## Yang diperbaiki
- Tombol Ajukan Pickup di Member Area tidak lagi mengarah ke `/#cara-kerja`.
- Tombol membuka halaman khusus `/dashboard/pickup`.
- Halaman dilindungi autentikasi dan role `member`; admin diarahkan ke `/admin`.
- Form meminta tanggal, jam, alamat, nomor WhatsApp, jumlah kemasan per ukuran, dan catatan opsional.
- Catatan tetap kosong jika member tidak mengisinya.
- Estimasi SKINPoint dihitung dari jumlah kemasan; poin final tetap menunggu verifikasi admin.
- Pengajuan dikirim melalui RPC `submit_pickup_request` yang sudah tersedia di schema V12.
- Trigger database yang sudah dipasang membuat notifikasi untuk admin dan member.
- Setelah tersimpan, WhatsApp Admin dibuka dengan rincian pengajuan; member harus menekan Kirim di WhatsApp.

## Cara memperbarui
1. Ekstrak ZIP V14 ke folder baru.
2. Pertahankan nilai `.env.local` milik project kamu. Jika file environment tidak ikut, salin dari project V13.
3. Jalankan `npm install`, lalu `npm run dev`.
4. Login sebagai member dan klik **Ajukan Pickup**.
5. Pastikan alamat browser menjadi `http://localhost:3000/dashboard/pickup`.
6. Isi formulir dengan satu atau lebih kemasan, lalu kirim.
7. Periksa pengajuan di dashboard admin dan notifikasi.

## Catatan database
Tidak perlu menjalankan ulang schema V12 atau patch notifikasi V13 untuk perbaikan navigasi ini. Pastikan migration `20261119_live_member_notifications.sql` yang diberikan pada V13 sudah dijalankan satu kali agar member juga menerima notifikasi pickup.
