# RE-SKIN

Aplikasi pengumpulan kemasan skincare dan makeup berbasis **Next.js App Router**, **TypeScript**, dan **Supabase**. Project ini dikembangkan sebagai prototype tugas kuliah dan dapat dijalankan dalam Demo Mode maupun terhubung ke Supabase.

## Teknologi

- Next.js 16, React 19, dan TypeScript
- Plus Jakarta Sans dan Playfair Display
- Lucide React untuk ikon antarmuka
- React Icons untuk ikon merek media sosial
- Supabase Auth, PostgreSQL, Row Level Security (RLS), dan Realtime
- Vercel untuk deployment

## Fitur utama

- Landing page RE-SKIN dengan panduan kemasan, katalog hadiah, FAQ, dan statistik agregat.
- Autentikasi Email + Password melalui Supabase, termasuk konfirmasi email dan pemulihan password.
- Member Area dengan sapaan **Beauty Bestie**, saldo SKINPoint, riwayat pickup, katalog hadiah, dan notifikasi.
- Admin Dashboard untuk mengelola anggota, pickup, verifikasi kemasan, SKINPoint, penukaran hadiah, dan notifikasi.
- Pencarian nomor pengajuan serta filter tanggal.
- Pengajuan pickup dan hadiah dengan opsi membuka WhatsApp Admin berisi ringkasan yang siap dikirim.
- Halaman Kebijakan Privasi dan Syarat & Ketentuan.
- Demo Mode untuk melihat tampilan dashboard tanpa menulis transaksi ke Supabase.

## Persyaratan

- Node.js 20.9 atau lebih baru
- npm
- Project Supabase jika ingin menjalankan mode live

## Menjalankan secara lokal

Buka terminal pada folder project yang berisi `package.json`, lalu jalankan:

```bash
npm install
```

Salin `.env.local.example` menjadi `.env.local`, kemudian isi konfigurasi yang diperlukan:

```env
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxxxxxxx
NEXT_PUBLIC_RE_SKIN_ADMIN_WHATSAPP=628xxxxxxxxxx
RE_SKIN_DEMO_MODE=false
```

Jalankan aplikasi:

```bash
npm run dev
```

Buka `http://localhost:3000`.

Untuk melihat dashboard simulasi tanpa Supabase, jalankan di lingkungan development dengan `RE_SKIN_DEMO_MODE=true`, atau gunakan konfigurasi placeholder pada `.env.local.example`. Demo Mode tidak digunakan pada deployment production.

## Konfigurasi Supabase

1. Buat project Supabase dan ambil Project URL serta Publishable Key.
2. Ikuti panduan `supabase/SETUP-SUPABASE.md` untuk menyiapkan database, role admin, dan URL callback.
3. Aktifkan provider Email dan konfirmasi email. Panduan autentikasi tersedia di `supabase/EMAIL-PASSWORD-SETUP.md`.
4. Untuk project database baru, gunakan `supabase/schema.sql` sesuai panduan. Untuk database yang sudah berjalan, jalankan hanya migration yang memang belum diterapkan. Jangan menjalankan SQL reset data pada database production.
5. Daftarkan akun admin melalui aplikasi. Setelah profil terbentuk, tetapkan role admin melalui SQL Editor dengan akun yang benar-benar dikelola pemilik project:

```sql
update public.profiles
set role = 'admin'
where email = 'email-admin-kamu@example.com';
```

Pendaftaran publik membuat role `member`. Role admin tidak boleh ditentukan dari input pendaftaran pengguna.

## Akun dan keamanan

- Login menggunakan Email + Password. Pendaftar harus mengonfirmasi email melalui tautan yang dikirim Supabase sebelum login.
- Jangan mengunggah `.env.local` ke GitHub.
- Jangan pernah menaruh Supabase Secret Key atau `service_role` key pada variabel `NEXT_PUBLIC_*`, kode browser, atau repository publik.
- Publishable Key memang digunakan oleh aplikasi browser; akses data tetap harus dibatasi dengan RLS dan kebijakan database yang benar.
- Persetujuan admin atas permintaan penghapusan akun bukan berarti akun Auth langsung terhapus. Penghapusan permanen memerlukan proses server-side yang berwenang.

## Pemeriksaan sebelum deployment

```bash
npm run lint
npm run build
```

## Deployment ke Vercel

1. Push repository ini ke GitHub.
2. Import repository dari GitHub ke Vercel.
3. Tambahkan `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_RE_SKIN_ADMIN_WHATSAPP`, dan `RE_SKIN_DEMO_MODE=false` pada Environment Variables Vercel.
4. Tambahkan domain production dan URL callback `/auth/callback` pada Supabase Authentication → URL Configuration.
5. Deploy dan uji login member, login admin, pengajuan pickup, verifikasi poin, penukaran hadiah, dan notifikasi.

## Struktur penting

```text
public/                 Ilustrasi dan avatar
src/app/                Halaman dan route aplikasi
src/components/         Komponen antarmuka
src/content/            Konten landing page
src/lib/                Utilitas, Supabase, Demo Mode, dan WhatsApp
supabase/schema.sql     Skema database terpadu
supabase/migrations/    Perubahan database bertahap
```

Lihat juga:
- `DEMO-MODE-QUICKSTART.md` untuk pratinjau Admin dan Member tanpa Supabase.
- `LIVE-SUPABASE-QUICKSTART.md` untuk pengujian integrasi Supabase live.
- `FINAL-POLISH-V23.md` untuk ringkasan penyempurnaan landing page terakhir.
