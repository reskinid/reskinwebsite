# RE-SKIN V23 — Final Landing Page Polish

Paket ini memuat enam revisi akhir landing page sebelum deployment.

## Perubahan UI

1. Tombol **Daftar Sekarang** pada navbar desktop dan mobile membuka modal autentikasi langsung pada tab **Buat Akun**. Tombol **Masuk** tetap membuka tab Masuk.
2. Footer **Kebijakan Privasi** dan **Syarat & Ketentuan** sekarang membuka halaman dokumen lengkap:
   - `/kebijakan-privasi`
   - `/syarat-ketentuan`
3. Announcement/top strip di atas navbar dihapus.
4. Catatan di bawah hero diperbarui menjadi: **Clean your empties · Tentukan lokasi pickup-mu · Hadiah seru**.
5. Statistik landing page membaca data agregat dari Supabase dan menerima pembaruan melalui Supabase Realtime. Polling 30 detik menjadi fallback jika browser melewatkan event Realtime.
6. Footer memakai **© 2026 RE-SKIN. All Rights Reserved.** dan **Designed with love for a greener earth. ♥**.

## Statistik yang ditampilkan

- **Kemasan terkumpul**: jumlah `verified_total_packages` dari `pickup_requests` yang berstatus `completed`.
- **Anggota terdaftar**: jumlah profil dengan `role = 'member'`.
- **SKINPoint diberikan**: total positif dari `point_transactions` dengan `transaction_type = 'earned'` dan `status = 'approved'`. Ini adalah total poin yang pernah diberikan, bukan saldo poin yang tersisa setelah penukaran.

Data pribadi tidak dibuka untuk publik. Browser hanya dapat membaca satu baris agregat di `public.landing_stats`; tabel sumber tetap mengikuti RLS yang sudah ada.

## Wajib untuk project Supabase yang sudah berjalan

Sebelum menguji statistik di website, jalankan satu kali file berikut melalui **Supabase → SQL Editor → New Query**:

`supabase/migrations/20261120_public_landing_stats.sql`

Migration ini:
- membuat tabel agregat `landing_stats`;
- menghitung angka awal dari data yang sudah ada;
- memasang trigger untuk memperbarui angka setelah profil, pickup, atau transaksi poin berubah;
- memberi akses baca hanya pada angka agregat kepada `anon` dan `authenticated`;
- menambahkan tabel agregat ke publication `supabase_realtime` jika publication tersedia.

Tidak perlu menjalankan ulang seluruh `supabase/schema.sql` pada project yang sudah aktif. Untuk instalasi database baru, tabel dan trigger tersebut juga sudah dimasukkan ke `supabase/schema.sql`.

## Pemeriksaan setelah migration

Jalankan query ini di SQL Editor:

```sql
select id, total_packages, total_members, total_points, updated_at
from public.landing_stats
where id = 1;
```

Setelah itu buka landing page. Angka akan tampil dari database. Ketika admin menyelesaikan verifikasi pickup atau ada akun member baru, statistik akan dihitung ulang dan dikirim ke landing page melalui Realtime.

## Menjalankan project

1. Extract ZIP.
2. Salin `.env.local` dari project sebelumnya ke folder project ini.
3. Jalankan `npm install`.
4. Jalankan `npm run dev`.
5. Buka `http://localhost:3000`.

Jangan memasukkan Supabase `service_role` atau Secret Key ke variabel `NEXT_PUBLIC_*`.
