# RE-SKIN V17 — Landing Navbar Auth State

## Yang ditambahkan
- Jika pengguna **belum login**, navbar landing page tetap menampilkan tombol **Masuk** dan **Daftar Sekarang**.
- Jika pengguna **sudah login**, navbar otomatis berubah menjadi **profil pengguna**.
- Dropdown profil di landing page menampilkan:
  - nama pengguna,
  - label role (Beauty Bestie / Administrator),
  - ringkasan **SKINPoint**,
  - tombol cepat ke **Dashboard Member** atau **Dashboard Admin**,
  - tombol **Keluar dari akun**.
- Versi **mobile nav** juga ikut menampilkan kartu singkat akun beserta tombol ke dashboard.

## Catatan
- Untuk member, ringkasan poin diambil dari RPC `get_my_point_balance()`.
- Untuk admin, area ini menampilkan status akses admin aktif.
- Perubahan ini tidak memerlukan SQL tambahan.

## Cara cek
1. Jalankan project.
2. Login menggunakan akun member.
3. Kembali ke landing page `/`.
4. Navbar kanan atas akan berubah dari tombol Masuk/Daftar menjadi kartu profil.
5. Klik profil untuk membuka dropdown singkat.
