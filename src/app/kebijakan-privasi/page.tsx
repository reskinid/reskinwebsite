import Link from "next/link";

export const metadata = {
  title: "Kebijakan Privasi | RE-SKIN",
  description: "Pemberitahuan data yang digunakan untuk menjalankan layanan RE-SKIN.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="privacy-page">
      <article className="privacy-page-card">
        <div className="profile-setup-kicker">RE-SKIN · PRIVASI BEAUTY BESTIE</div>
        <h1>Kebijakan Privasi</h1>
        <p className="privacy-page-lead">Berlaku sejak 20 November 2026.</p>
        <p className="privacy-page-lead">
          RE-SKIN hanya meminta dan menggunakan data yang diperlukan untuk membuat akun dan menjalankan layanan pickup kemasan, SKINPoint, serta penukaran hadiah. Kami tidak menjual data pribadi atau menggunakannya untuk iklan.
        </p>

        <h2>1. Data yang diminta dan digunakan</h2>
        <ul>
          <li>Nama lengkap dan alamat email untuk membuat serta mengenali akun.</li>
          <li>Jenis kelamin dan pilihan avatar yang ditentukan sendiri oleh anggota.</li>
          <li>Nomor WhatsApp dan alamat/lokasi pickup yang diberikan saat mengajukan penjemputan.</li>
          <li>Jumlah dan jenis kemasan, jadwal pickup, status verifikasi, serta catatan yang secara sukarela ditambahkan.</li>
          <li>Saldo dan riwayat SKINPoint, permintaan penukaran hadiah, status penerimaan hadiah, dan notifikasi layanan.</li>
          <li>ID akun, status verifikasi email, dan sesi autentikasi yang diproses Supabase Auth untuk mengelola akses akun.</li>
        </ul>

        <h2>2. Tujuan penggunaan</h2>
        <p>Data tersebut digunakan untuk mengelola akun, menghubungi anggota terkait pickup, memverifikasi kemasan, menghitung SKINPoint, memproses penukaran hadiah, mengirim pembaruan status, dan memberikan bantuan operasional. Data tidak digunakan untuk tujuan di luar layanan RE-SKIN.</p>

        <h2>3. Autentikasi dan konfirmasi email</h2>
        <p>Anggota membuat akun dan masuk menggunakan alamat email serta password. Setelah pendaftaran, Supabase Auth mengirimkan email konfirmasi ke alamat yang didaftarkan. Anggota perlu membuka email tersebut dan mengeklik tautan verifikasi sebelum dapat menggunakan akun. Jika email belum terlihat, anggota dapat memeriksa folder Spam atau meminta pengiriman ulang sesuai fitur yang tersedia.</p>

        <h2>4. Keamanan akun dan data</h2>
        <p>Autentikasi, konfirmasi email, dan pengelolaan sesi ditangani oleh Supabase Auth. Password dikelola oleh layanan autentikasi dan aplikasi RE-SKIN tidak menyimpan password sebagai teks biasa maupun menampilkannya kepada admin. Akses data aplikasi dibatasi berdasarkan akun dan peran melalui kebijakan keamanan database seperti Row Level Security (RLS). Keamanan juga bergantung pada konfigurasi layanan, pengelolaan akses admin, dan perlindungan kredensial. Anggota tetap perlu menjaga kerahasiaan password dan tidak membagikannya kepada orang lain. Tidak ada sistem digital yang dapat dijamin 100% bebas risiko.</p>

        <h2>5. Penyimpanan dan akses</h2>
        <p>Data akun dan aktivitas layanan disimpan pada project Supabase RE-SKIN. Anggota dapat mengakses data yang terkait dengan akunnya sendiri. Admin yang berwenang dapat mengakses data yang diperlukan untuk memproses pickup, verifikasi, hadiah, dan bantuan pengguna.</p>

        <h2>6. Penghapusan akun</h2>
        <p>Anggota dapat mengajukan penghapusan akun melalui menu pengaturan akun. Pengajuan ditinjau terlebih dahulu agar transaksi, hadiah, atau pickup yang masih berjalan dapat diperiksa. Pengajuan tidak langsung menghapus akun.</p>

        <h2>7. Hak dan pilihan anggota</h2>
        <p>Anggota dapat memeriksa informasi akun dan aktivitas layanan melalui Member Area, memperbarui informasi profil yang disediakan, serta mengajukan penghapusan akun melalui pengaturan akun. Pengajuan penghapusan ditinjau terlebih dahulu dan tidak langsung menghapus akun.</p>

        <h2>8. Persetujuan</h2>
        <p>Dengan membuat akun, anggota menyatakan telah membaca dan menyetujui pemberitahuan penggunaan data ini serta memahami bahwa email konfirmasi diperlukan untuk mengaktifkan akun. Persetujuan ini dicatat pada profil akun RE-SKIN.</p>

        <p>Jika memiliki pertanyaan tentang penggunaan data, anggota dapat menghubungi admin melalui kanal bantuan yang tersedia di RE-SKIN.</p>
        <div className="legal-page-actions">
          <Link className="btn btn-outline" href="/syarat-ketentuan">Baca Syarat &amp; Ketentuan</Link>
          <Link className="btn privacy-back-button" href="/">Kembali ke Beranda</Link>
        </div>
      </article>
    </main>
  );
}
