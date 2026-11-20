# RE-SKIN — Integrasi Supabase Live

Project ini sudah menggunakan Next.js App Router dan Supabase SSR. Demo Mode dimatikan pada `.env.local` agar halaman login, dashboard member, dan dashboard admin memakai sesi Supabase yang sebenarnya.

## 1. Pastikan environment lokal

Pertahankan nilai URL dan Publishable Key dari project Supabase milikmu. Pastikan:

```env
RE_SKIN_DEMO_MODE=false
```

`NEXT_PUBLIC_RE_SKIN_ADMIN_WHATSAPP` harus berisi nomor admin dalam format angka internasional, misalnya `62812...`.

Jangan memasukkan Supabase Secret Key atau `service_role` ke browser.

## 2. Jalankan aplikasi

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`, lalu gunakan modal Masuk/Daftar pada landing page.

## 3. Alur akun dan dashboard

- Akun yang baru mendaftar otomatis dibuat sebagai `member` oleh trigger `handle_new_user`.
- Akun yang role-nya `admin` diarahkan ke `/admin`.
- Akun `member` diarahkan ke `/dashboard`.
- Member tidak dapat membuka data member lain karena Row Level Security dan pemeriksaan role.
- Admin hanya dapat menjalankan aksi administratif melalui server action dan RPC yang memeriksa `public.is_admin()`.

## 4. Fitur live yang terhubung

### Member
- Profil Beauty Bestie, notifikasi real-time, dan logout.
- Pengajuan pickup melalui halaman khusus `/dashboard/pickup`, termasuk rincian ukuran kemasan, tanggal, jam, alamat, nomor WhatsApp, dan catatan opsional.
- Riwayat pickup dengan nomor pengajuan.
- Saldo dan riwayat SKINPoint.
- Katalog hadiah yang sudah diaktifkan admin.
- Pengajuan penukaran hadiah melalui RPC, penahanan poin, dan pembukaan WhatsApp Admin.
- Detail instruksi hadiah dan konfirmasi penerimaan.
- Pengajuan penghapusan akun melalui menu Pengaturan akun & privasi.

### Admin
- Ringkasan anggota, pickup, poin, dan antrean tindakan.
- Pencarian nomor pengajuan pickup serta filter bulan/tahun dan urutan tanggal.
- Konfirmasi pickup, pembatalan, dan verifikasi jumlah kemasan.
- Persetujuan/penolakan penukaran hadiah, instruksi pengambilan/pengiriman, dan pemantauan konfirmasi penerimaan.
- Peninjauan pengajuan penghapusan akun.
- Notifikasi real-time untuk pengajuan baru dan konfirmasi penerimaan hadiah.

## 5. Penting: aktifkan hadiah

Harga poin dan stok hadiah belum ditentukan pada konsep awal. Karena itu, hadiah dibuat nonaktif. Sebelum member dapat menukar hadiah, buka Supabase **Table Editor → rewards**, tentukan `points_cost` dan `stock`, lalu ubah `is_active` menjadi `true`.

## 6. Jalankan patch notifikasi member

Karena skema V12 sudah pernah dijalankan, jalankan sekali file:

`supabase/migrations/20261119_live_member_notifications.sql`

Patch ini membuat member juga menerima notifikasi saat membuat pengajuan pickup, penukaran hadiah, dan penghapusan akun. Admin tetap menerima notifikasi pengajuan baru.

## 7. Uji sebelum deploy

1. Login sebagai member.
2. Dari Member Area, klik **Ajukan Pickup**. Pastikan halaman `/dashboard/pickup` terbuka, isi formulir, lalu kirim. Pastikan nomor pengajuan muncul dan WhatsApp Admin terbuka.
3. Periksa notifikasi member dan admin.
4. Login sebagai admin. Konfirmasi pickup, lalu verifikasi jumlah kemasan.
5. Pastikan SKINPoint member bertambah setelah verifikasi.
6. Aktifkan satu hadiah dengan harga dan stok uji. Ajukan penukaran dari akun member.
7. Setujui dari admin, isi instruksi pengambilan/pengiriman, lalu konfirmasi penerimaan dari member.
8. Uji pengajuan penghapusan akun dan proses peninjauan admin.

## 8. Vercel

Tambahkan variabel `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_RE_SKIN_ADMIN_WHATSAPP`, dan `RE_SKIN_DEMO_MODE=false` di **Vercel → Project → Settings → Environment Variables**. Tambahkan domain Vercel dan callback `/auth/callback` pada Supabase **Authentication → URL Configuration**, kemudian redeploy.


## 9. Penyempurnaan notifikasi V15

Jalankan satu kali migration berikut melalui Supabase → SQL Editor → New query:

`supabase/migrations/20261119_notification-deep-links-history.sql`

Migration ini:
- Mengarahkan notifikasi pickup langsung ke kartu pengajuan yang sesuai di Member/Admin Area.
- Mengarahkan notifikasi hadiah ke kartu penukaran terkait.
- Mengarahkan notifikasi penghapusan akun ke bagian pengajuan yang relevan.
- Memperbarui `target_path` notifikasi lama agar ikut memakai deep link.
- Tidak menghapus riwayat notifikasi yang sudah tersimpan.

Pada UI V15:
- Klik notifikasi otomatis menandainya sebagai dibaca, lalu membuka pengajuan terkait.
- Tombol **Tandai dibaca** menandai seluruh notifikasi belum dibaca; angka badge ikut berkurang.
- Filter **Semua / Aktivitas / Pembaruan status** membantu membedakan pengajuan baru dari perubahan status.
- Panel menampilkan hingga 100 notifikasi terbaru. Baris lama tetap tersimpan di tabel `notifications` dan tidak dihapus oleh migration ini.

Setelah migration berhasil, jalankan ulang aplikasi:

```bash
npm run dev
```

Uji dengan satu notifikasi pickup lama dan satu notifikasi pembaruan status. Pastikan kartu pengajuan yang tepat tersorot setelah notifikasi diklik.
