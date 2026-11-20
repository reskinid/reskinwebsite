# Panduan Setup Supabase RE-SKIN V12

Dokumen ini digunakan setelah akun dan project Supabase RE-SKIN berhasil dibuat.

## A. Jalankan skema database

1. Masuk ke dashboard Supabase dan pilih project RE-SKIN.
2. Buka **SQL Editor**.
3. Klik **New query**.
4. Buka file `supabase/schema.sql` dari project RE-SKIN V12.
5. Salin seluruh isi file, tempel ke SQL Editor, lalu klik **Run**.
6. Tunggu sampai query selesai. Jika berhasil, Supabase menampilkan pesan bahwa query berhasil dijalankan.

File ini merupakan skema terpadu untuk instalasi baru dan peningkatan dari skema awal V11. Jalankan seluruh isi file dalam satu query. Jangan menjalankan potongan SQL secara acak.

## B. Pastikan tabel terbentuk

Buka **Table Editor**. Pastikan tabel berikut tersedia:

| Tabel | Kegunaan |
|---|---|
| `profiles` | Profil member dan role admin |
| `pickup_requests` | Pengajuan pickup |
| `pickup_items` | Rincian ukuran dan jumlah kemasan |
| `point_transactions` | Buku besar SKINPoint |
| `rewards` | Katalog hadiah, harga poin, dan stok |
| `redemption_requests` | Pengajuan dan proses penukaran hadiah |
| `account_deletion_requests` | Pengajuan penghapusan akun |
| `notifications` | Notifikasi untuk admin dan member |

## C. Atur Authentication

1. Buka **Authentication → URL Configuration**.
2. Untuk pengembangan lokal, isi Site URL dengan `http://localhost:3000`.
3. Tambahkan Redirect URL `http://localhost:3000/auth/callback`.
4. Setelah domain Vercel tersedia, tambahkan domain production dan URL callback production yang sesuai.
5. Simpan perubahan.

Jika menggunakan verifikasi email, pastikan email konfirmasi diarahkan kembali ke URL callback tersebut.

## D. Buat akun Admin

1. Daftarkan akun melalui halaman pendaftaran RE-SKIN menggunakan email yang memang akan menjadi akun admin.
2. Pastikan akun sudah muncul di **Authentication → Users** dan tabel `profiles`.
3. Kembali ke **SQL Editor**, jalankan perintah berikut dengan email admin yang benar:

```sql
update public.profiles
set role = 'admin'
where email = 'email-admin-kamu@example.com';
```

4. Periksa hasilnya:

```sql
select id, full_name, email, role
from public.profiles
where email = 'email-admin-kamu@example.com';
```

Pastikan `role` bernilai `admin`. Jangan memberi role admin kepada akun member biasa.

## E. Aktifkan katalog hadiah

Tiga kategori awal dibuat dari rentang yang sudah ada pada konsep RE-SKIN:

- Jepit rambut lucu: 1.000–10.000 poin.
- Bag charm & aksesori: 11.000–25.000 poin.
- Produk kosmetik pilihan: 26.000–80.000 poin.

Harga final dan stok belum ditentukan, sehingga data awal sengaja dibuat nonaktif (`is_active=false`) dan `points_cost` kosong. Ini mencegah member menukar hadiah dengan harga atau stok yang belum disepakati.

Setelah admin menetapkan harga dan stok yang benar, buka **Table Editor → rewards**, isi `points_cost`, `stock`, lalu aktifkan `is_active`.

Contoh pengaturan setelah harga dan stok diputuskan:

```sql
update public.rewards
set points_cost = 1500, stock = 10, is_active = true
where code = 'hair-clip';
```

Angka pada contoh hanya ilustrasi. Ganti sesuai keputusan pengelola RE-SKIN.

## F. Cara kerja SKINPoint dan penukaran

- Poin pickup baru diberikan setelah admin menyelesaikan verifikasi pickup.
- Saat member meminta penukaran, poin ditahan sementara melalui transaksi negatif berstatus `pending`.
- Jika admin menyetujui, transaksi penahanan poin menjadi `approved`.
- Jika admin menolak, transaksi penahanan menjadi `rejected`, sehingga saldo tersedia kembali; stok hadiah juga dikembalikan.
- Setelah disetujui, admin mengisi metode dan detail penyerahan: diambil langsung (`ready`) atau dikirim (`shipped`).
- Member mengonfirmasi setelah hadiah benar-benar diterima (`received`).

Semua langkah penting menghasilkan baris notifikasi di tabel `notifications`. Baris notifikasi dibuat oleh trigger database; pengguna tidak diberi izin untuk membuat notifikasi palsu secara langsung.

## G. Penghapusan akun

Pengajuan penghapusan akun disimpan dan dikirim ke admin untuk ditinjau. Persetujuan admin hanya berarti pengajuan diterima untuk verifikasi akhir; akun Auth belum dihapus otomatis.

Penghapusan permanen membutuhkan proses server-side/Edge Function yang aman. Service Role Key tidak boleh dimasukkan ke kode browser atau variabel `NEXT_PUBLIC_`. Tahap implementasi tersebut dilakukan setelah alur database dan Auth diuji.

## H. Mode aplikasi saat ini

Project ini sudah disiapkan untuk mode Supabase live. Pastikan `.env.local` menggunakan:

```env
RE_SKIN_DEMO_MODE=false
```

Demo Mode masih dapat diaktifkan kembali secara lokal dengan mengubah nilainya menjadi `true` jika ingin melihat pratinjau UI simulasi. Jangan mengirim atau mengunggah `.env.local` ke GitHub.

## I. Aktifkan notifikasi pengajuan untuk member

Setelah skema V12 terpasang, jalankan satu patch tambahan berikut agar member juga menerima notifikasi saat mengirim pickup, penukaran hadiah, atau pengajuan penghapusan akun.

1. Buka file `supabase/migrations/20261119_live_member_notifications.sql`.
2. Salin seluruh isinya ke Supabase **SQL Editor → New query**.
3. Klik **Run**.
4. Pastikan query berhasil.

Admin tetap menerima notifikasi pengajuan baru, sedangkan member menerima salinan notifikasi pada dashboardnya sendiri. Notifikasi status berikutnya dibuat oleh trigger yang sudah tersedia di skema V12.

## J. Mode aplikasi dan deploy

Untuk menggunakan Supabase sungguhan di lokal, pastikan `.env.local` memuat:

```env
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_RE_SKIN_ADMIN_WHATSAPP=628xxxxxxxxxx
RE_SKIN_DEMO_MODE=false
```

Gunakan URL dan Publishable Key dari project Supabase milikmu. Nomor WhatsApp ditulis dalam format internasional angka saja, misalnya `62812...`.

Untuk Vercel, masukkan variabel yang sama melalui **Project → Settings → Environment Variables** untuk environment yang akan digunakan, lalu lakukan redeploy. Jangan pernah menambahkan `service_role` atau Supabase Secret Key ke variabel `NEXT_PUBLIC_`, browser, atau GitHub.

## K. Jika query error

Jangan menghapus tabel atau menjalankan query berulang secara acak. Salin pesan error lengkap dari SQL Editor (tanpa kredensial), kirimkan ke ChatGPT, lalu kita perbaiki berdasarkan baris yang dilaporkan.


## L. Penyempurnaan notifikasi V15

Setelah patch notifikasi member dijalankan, jalankan sekali migration:

`supabase/migrations/20261119_notification-deep-links-history.sql`

Migration ini memperbarui target notifikasi menjadi tautan langsung ke kartu pickup, penukaran hadiah, atau pengajuan penghapusan akun. Migration juga memperbarui target notifikasi yang sudah ada tanpa menghapus riwayatnya.

Pada aplikasi V15, panel notifikasi menyediakan filter **Semua**, **Aktivitas**, dan **Pembaruan status**. Membuka notifikasi otomatis menandainya sebagai dibaca; tombol **Tandai dibaca** menandai semua notifikasi yang belum dibaca. Angka badge mengikuti status baca terbaru. Panel menampilkan hingga 100 notifikasi terbaru; data tetap tersimpan di tabel `notifications`.
