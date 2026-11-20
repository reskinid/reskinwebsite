import Link from "next/link";

export const metadata = {
  title: "Syarat & Ketentuan | RE-SKIN",
  description: "Ketentuan penggunaan layanan pickup, SKINPoint, dan penukaran hadiah RE-SKIN.",
};

export default function TermsPage() {
  return (
    <main className="privacy-page">
      <article className="privacy-page-card">
        <div className="profile-setup-kicker">RE-SKIN · PANDUAN PENGGUNAAN</div>
        <h1>Syarat &amp; Ketentuan</h1>
        <p className="privacy-page-lead">Berlaku sejak 20 November 2026. Dengan membuat akun atau menggunakan layanan RE-SKIN, Beauty Bestie dianggap telah membaca dan memahami ketentuan berikut.</p>

        <h2>1. Tentang layanan RE-SKIN</h2>
        <p>RE-SKIN merupakan platform pengumpulan kemasan kosong skincare dan makeup berbahan kaca atau plastik. Anggota dapat mengajukan pickup, menunggu pemeriksaan kemasan oleh admin, memperoleh SKINPoint dari kemasan yang diterima, dan mengajukan penukaran poin dengan hadiah yang tersedia di katalog.</p>

        <h2>2. Akun anggota</h2>
        <ul>
          <li>Anggota wajib memberikan nama dan alamat email yang benar serta dapat diakses.</li>
          <li>Pendaftaran menggunakan email dan password melalui Supabase Auth. Email perlu dikonfirmasi sebelum akun dapat digunakan untuk login.</li>
          <li>Anggota bertanggung jawab menjaga kerahasiaan password dan penggunaan akunnya.</li>
          <li>Satu akun digunakan oleh pemilik akun yang terdaftar. Jangan membagikan akses akun kepada orang lain.</li>
        </ul>

        <h2>3. Pengajuan pickup</h2>
        <ul>
          <li>Anggota mengisi jumlah kemasan, tanggal dan waktu yang diinginkan, alamat penjemputan, serta nomor WhatsApp yang dapat dihubungi.</li>
          <li>Pengajuan yang terkirim belum berarti jadwal pickup telah disetujui. Admin akan memeriksa cakupan area dan mengonfirmasi jadwal melalui kanal komunikasi yang tersedia.</li>
          <li>Anggota diminta memastikan alamat dan nomor kontak benar serta dapat dihubungi pada jadwal yang telah dikonfirmasi.</li>
          <li>Jika jadwal atau area belum dapat dilayani, admin akan menghubungi anggota untuk tindak lanjut atau perubahan jadwal.</li>
        </ul>

        <h2>4. Ketentuan kemasan dan verifikasi</h2>
        <ul>
          <li>Kemasan yang diajukan harus kosong, dibersihkan, dan aman untuk ditangani.</li>
          <li>RE-SKIN menerima kategori kemasan kaca atau plastik sesuai panduan kemasan yang ditampilkan pada website.</li>
          <li>Admin memeriksa kemasan fisik dan mencatat jumlah yang diterima. Jumlah yang diajukan anggota dapat berbeda dari jumlah yang lolos verifikasi.</li>
          <li>Kemasan yang masih berisi produk, kotor, rusak sehingga tidak aman ditangani, atau tidak sesuai panduan dapat ditolak.</li>
        </ul>

        <h2>5. Perhitungan dan penggunaan SKINPoint</h2>
        <p>SKINPoint diberikan setelah admin menyelesaikan verifikasi. Pengajuan pickup atau estimasi poin sebelum verifikasi belum menjadi saldo yang dapat digunakan.</p>
        <ul>
          <li>Kemasan ukuran 5–40 ml: 5 SKINPoint per kemasan yang lolos verifikasi.</li>
          <li>Kemasan ukuran 50–100 ml: 10 SKINPoint per kemasan yang lolos verifikasi.</li>
          <li>Kemasan ukuran 200–500 ml: 15 SKINPoint per kemasan yang lolos verifikasi.</li>
        </ul>
        <p>Saldo dan riwayat transaksi dapat dilihat pada Member Area. Poin yang digunakan untuk pengajuan penukaran akan mengikuti status transaksi dan ketentuan yang tercantum pada aplikasi.</p>

        <h2>6. Katalog dan penukaran hadiah</h2>
        <ul>
          <li>Hadiah yang dapat ditukar, biaya SKINPoint, dan stok mengikuti informasi pada katalog saat pengajuan dilakukan.</li>
          <li>Pengajuan penukaran perlu ditinjau dan disetujui admin. Pengajuan belum berarti hadiah sudah diserahkan.</li>
          <li>Admin akan memperbarui status dan informasi pemenuhan hadiah melalui Member Area atau kanal komunikasi yang tersedia.</li>
          <li>Anggota perlu mengikuti instruksi pengambilan atau pengiriman yang dikonfirmasi admin dan memberikan konfirmasi penerimaan melalui fitur yang tersedia.</li>
          <li>Jika stok atau hadiah tidak dapat dipenuhi, admin akan menghubungi anggota dan memperbarui status pengajuan sesuai proses yang berlaku.</li>
        </ul>

        <h2>7. Pembatalan dan peninjauan</h2>
        <p>Pengajuan pickup, penukaran hadiah, atau permintaan lain dapat ditinjau admin sesuai status dan proses yang sedang berjalan. Jika ada informasi yang tidak sesuai, admin dapat meminta klarifikasi atau memperbarui status pengajuan. Perubahan saldo poin mengikuti catatan transaksi yang tercantum pada akun.</p>

        <h2>8. Penggunaan yang wajar</h2>
        <p>Anggota tidak diperkenankan memberikan informasi palsu, mengajukan kemasan yang sama berulang kali, memanipulasi jumlah kemasan, atau mencoba mengakses akun dan data pengguna lain. Pengajuan yang terindikasi tidak wajar dapat ditahan untuk pemeriksaan lebih lanjut.</p>

        <h2>9. Data pribadi</h2>
        <p>Penggunaan nama, email, pilihan avatar, nomor WhatsApp, alamat pickup, riwayat transaksi, dan notifikasi dijelaskan lebih lanjut dalam <Link href="/kebijakan-privasi">Kebijakan Privasi RE-SKIN</Link>. Data digunakan untuk menjalankan layanan dan tidak dijual atau digunakan untuk iklan.</p>

        <h2>10. Perubahan ketentuan</h2>
        <p>RE-SKIN dapat memperbarui informasi layanan, katalog, prosedur, atau ketentuan apabila diperlukan. Perubahan penting akan diinformasikan melalui website atau kanal komunikasi yang tersedia. Anggota disarankan membaca kembali ketentuan ini secara berkala.</p>

        <p>Dengan menggunakan RE-SKIN, anggota menyatakan bersedia mengikuti ketentuan ini dan memahami bahwa pemberian SKINPoint serta penukaran hadiah mengikuti hasil verifikasi dan ketersediaan layanan.</p>
        <div className="legal-page-actions">
          <Link className="btn btn-outline" href="/kebijakan-privasi">Baca Kebijakan Privasi</Link>
          <Link className="btn privacy-back-button" href="/">Kembali ke Beranda</Link>
        </div>
      </article>
    </main>
  );
}
