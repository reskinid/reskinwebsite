import Link from "next/link";

export const metadata = {
  title: "Kebijakan Privasi | RE-SKIN",
  description: "Kebijakan penggunaan dan perlindungan data Beauty Bestie pada layanan RE-SKIN.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="privacy-page">
      <article className="privacy-page-card">
        <div className="profile-setup-kicker">RE-SKIN · PRIVASI BEAUTY BESTIE</div>
        <h1>Kebijakan Privasi</h1>
        <p className="privacy-page-lead"><em>Berlaku sejak 20 November 2026</em></p>
        <p>RE-SKIN hanya meminta dan menggunakan data yang diperlukan untuk membuat akun dan menjalankan layanan pickup kemasan, SKINPoint, serta penukaran hadiah. Kami tidak menjual data pribadi dan tidak menggunakannya untuk iklan.</p>

        <h2>1. Data yang kami minta dan gunakan</h2>
        <ul>
          <li>Nama lengkap dan alamat email, untuk membuat serta mengenali akun.</li>
          <li>Pilihan avatar (laki-laki, perempuan berhijab, atau perempuan tanpa hijab) yang kamu pilih sendiri, hanya untuk menampilkan avatar di Member Area.</li>
          <li>Nomor WhatsApp dan alamat/lokasi pickup yang kamu berikan saat mengajukan penjemputan.</li>
          <li>Jumlah dan jenis kemasan, jadwal pickup, status verifikasi, serta catatan yang kamu tambahkan secara sukarela. Mohon tidak menuliskan informasi sensitif di kolom catatan.</li>
          <li>Saldo dan riwayat SKINPoint, permintaan penukaran hadiah, status penerimaan hadiah, dan notifikasi layanan.</li>
          <li>ID akun, status verifikasi email, dan sesi autentikasi yang diproses oleh Supabase Auth untuk mengelola akses akun.</li>
        </ul>

        <h2>2. Tujuan penggunaan</h2>
        <p>Data digunakan untuk mengelola akun, menghubungi Beauty Bestie terkait pickup, memverifikasi kemasan, menghitung SKINPoint, memproses penukaran hadiah, mengirim pembaruan status, dan memberikan bantuan operasional. Data tidak digunakan untuk tujuan di luar layanan RE-SKIN.</p>

        <h2>3. Autentikasi dan konfirmasi email</h2>
        <p>Kamu membuat akun dan masuk menggunakan email dan password. Setelah pendaftaran, Supabase Auth mengirimkan email konfirmasi ke alamat yang kamu daftarkan. Email ini dikirim otomatis oleh sistem dengan tampilan standar, sehingga <strong>bukan penipuan maupun spam</strong>. Buka email tersebut dan klik tautan verifikasinya agar akunmu aktif. Jika email belum terlihat, periksa folder Spam atau minta pengiriman ulang melalui fitur yang tersedia.</p>

        <h2>4. Keamanan akun dan data</h2>
        <ul>
          <li>Autentikasi, konfirmasi email, dan pengelolaan sesi ditangani oleh Supabase Auth.</li>
          <li>Password dikelola oleh layanan autentikasi. Aplikasi RE-SKIN tidak menyimpan password sebagai teks biasa dan tidak menampilkannya kepada admin.</li>
          <li>Akses ke data aplikasi dibatasi berdasarkan akun dan peran melalui kebijakan keamanan database (Row Level Security/RLS).</li>
          <li>Keamanan juga bergantung pada konfigurasi layanan, pengelolaan akses admin, dan perlindungan kredensial. Kamu tetap perlu menjaga kerahasiaan passwordmu dan tidak membagikannya kepada siapa pun.</li>
          <li>Tidak ada sistem digital yang dapat dijamin 100% bebas risiko.</li>
        </ul>

        <h2>5. Penyimpanan, akses, dan pihak pemroses</h2>
        <ul>
          <li>Data akun dan aktivitas layanan disimpan pada project Supabase RE-SKIN. Supabase bertindak sebagai penyedia infrastruktur, dan lokasi servernya mengikuti wilayah project yang digunakan.</li>
          <li>Kamu dapat mengakses data yang terkait dengan akunmu sendiri.</li>
          <li>Bestie Care dan admin yang berwenang hanya mengakses data yang diperlukan untuk memproses pickup, verifikasi, hadiah, dan bantuan pengguna.</li>
          <li>Data dapat dibuka kepada pihak lain hanya jika diwajibkan oleh hukum yang berlaku.</li>
          <li>Data disimpan selama akunmu aktif. Setelah pengajuan penghapusan akun disetujui, data akun dihapus atau dianonimkan, kecuali catatan transaksi yang masih diperlukan untuk keperluan layanan.</li>
        </ul>

        <h2>6. Hak dan pilihan Beauty Bestie</h2>
        <p>Kamu dapat:</p>
        <ul>
          <li>memeriksa informasi akun dan aktivitas layanan melalui Member Area;</li>
          <li>memperbarui informasi profil yang tersedia;</li>
          <li>meminta koreksi data yang tidak sesuai melalui Bestie Care;</li>
          <li>mengajukan penghapusan akun melalui menu pengaturan akun, yang sekaligus berarti menarik persetujuanmu atas penggunaan data.</li>
        </ul>
        <p>Pengajuan penghapusan akun <strong>ditinjau terlebih dahulu</strong> agar pickup, transaksi, atau penukaran hadiah yang masih berjalan dapat diperiksa. Pengajuan tidak langsung menghapus akun.</p>

        <h2>7. Persetujuan</h2>
        <p>Dengan membuat akun, kamu menyatakan telah membaca dan menyetujui Kebijakan Privasi ini dan Syarat &amp; Ketentuan RE-SKIN, serta memahami bahwa email konfirmasi diperlukan untuk mengaktifkan akun. Persetujuan ini dicatat pada profil akun RE-SKIN.</p>

        <h2>8. Perubahan kebijakan</h2>
        <p>RE-SKIN dapat memperbarui kebijakan ini jika diperlukan. Perubahan penting akan diinformasikan melalui website atau kanal komunikasi yang tersedia.</p>

        <h2>9. Kontak</h2>
        <p>Jika kamu memiliki pertanyaan tentang penggunaan data, hubungi Bestie Care melalui kanal bantuan yang tersedia di RE-SKIN.</p>

        <div className="legal-page-actions">
          <Link className="btn btn-outline" href="/syarat-ketentuan">Baca Syarat &amp; Ketentuan</Link>
          <Link className="btn privacy-back-button" href="/">Kembali ke Beranda</Link>
        </div>
      </article>
    </main>
  );
}
