# RE-SKIN V19 — Hero Illustration Fix

## Masalah yang diperbaiki
Ilustrasi produk pada hero kadang tidak muncul setelah kembali ke landing page dari dashboard, dan baru terlihat/berubah setelah halaman di-refresh.

## Perbaikan
- Ilustrasi hero dipindahkan dari inline SVG di HTML landing page menjadi aset mandiri `public/hero-illustration.svg`.
- Nama elemen SVG yang sensitif terhadap huruf besar/kecil (`linearGradient`, `feDropShadow`) dan atribut (`viewBox`, `stdDeviation`) dibetulkan.
- Elemen gambar menggunakan eager loading, dimensi eksplisit, dan CSS yang memastikan tampil sebagai block dengan visibility aktif.
- Karena aset dipanggil sebagai file SVG mandiri, proses parsing HTML/React tidak lagi mengubah namespace atau atribut SVG saat navigasi client-side.

## Cara menerapkan
1. Ekstrak project V19.
2. Salin `.env.local` dari project yang sedang digunakan ke folder `reskin-nextjs`.
3. Jalankan `npm install`.
4. Jalankan `npm run dev`.
5. Login sebagai member, buka Dashboard, lalu klik Beranda.
6. Pastikan ilustrasi hero langsung tampil tanpa perlu refresh.

Tidak ada perubahan database dan tidak perlu menjalankan SQL baru.
