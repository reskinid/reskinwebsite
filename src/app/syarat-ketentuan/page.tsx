import Link from "next/link";

export const metadata = {
  title: "Syarat & Ketentuan | RE-SKIN",
  description: "Syarat dan ketentuan penggunaan layanan RE-SKIN untuk Beauty Bestie.",
};

export default function TermsPage() {
  return (
    <main className="privacy-page">
      <article className="privacy-page-card">
        <div className="profile-setup-kicker">RE-SKIN · PANDUAN PENGGUNAAN</div>
        <h1>Syarat &amp; Ketentuan</h1>
        <p className="privacy-page-lead"><em>Berlaku sejak 20 November 2026</em></p>
        <p>Dengan membuat akun atau menggunakan layanan RE-SKIN, kamu (Beauty Bestie) dianggap sudah membaca dan memahami Syarat &amp; Ketentuan ini serta Kebijakan Privasi RE-SKIN.</p>

        <h2>1. Tentang layanan RE-SKIN</h2>
        <p>RE-SKIN adalah program go green berupa platform pengumpulan kemasan kosong skincare dan makeup berbahan kaca atau plastik. Beauty Bestie dapat mengajukan pickup, menunggu pemeriksaan kemasan oleh petugas RE-SKIN, mendapatkan SKINPoint dari kemasan yang lolos verifikasi, lalu menukarkannya dengan hadiah yang tersedia di katalog.</p>

        <h2>2. Akun Beauty Bestie</h2>
        <ul>
          <li>Siapa pun dapat membuat akun, selama memiliki email aktif dan sudah membaca serta memahami Syarat &amp; Ketentuan dan Kebijakan Privasi ini. Tidak ada batas usia.</li>
          <li>Pendaftaran menggunakan nama, email, dan password. Informasi yang kamu berikan harus benar dan terbaru.</li>
          <li>Pendaftaran menggunakan layanan autentikasi Supabase Auth. Email konfirmasi dikirim otomatis oleh sistem tersebut dengan tampilan standar, sehingga bukan email penipuan maupun spam. Klik tautan konfirmasi di email itu agar akunmu aktif. Jika email tidak muncul di kotak masuk, periksa folder Spam.</li>
          <li>Kamu bertanggung jawab menjaga kerahasiaan password dan seluruh aktivitas di akunmu.</li>
          <li>Satu akun hanya digunakan oleh pemilik akun yang terdaftar. Jangan bagikan akses akun kepada orang lain.</li>
        </ul>

        <h2>3. Pengajuan pickup</h2>
        <ul>
          <li>Pickup <strong>gratis</strong> untuk alamat dalam jangkauan operasional RE-SKIN, termasuk area kampus Universitas Trunodjoyo Madura (UTM). Lokasi operasional RE-SKIN berada di Telang, Kamal, Kabupaten Bangkalan.</li>
          <li>Untuk alamat di luar area yang biasa dijangkau, Bestie Care akan membantu memeriksa kemungkinan layanan sebelum jadwal disepakati.</li>
          <li>Isi jumlah kemasan, tanggal dan waktu yang diinginkan, alamat penjemputan, serta nomor WhatsApp yang dapat dihubungi. <strong>Tidak ada batas minimal</strong> jumlah kemasan per pickup.</li>
          <li>Pengajuan yang terkirim belum berarti jadwal pickup disetujui. Bestie Care akan mengonfirmasi cakupan area dan jadwal melalui WhatsApp.</li>
          <li>Pastikan alamat dan nomor kontak benar serta dapat dihubungi pada jadwal yang telah dikonfirmasi.</li>
          <li>Jika jadwal atau area belum dapat dilayani, tim RE-SKIN akan menghubungimu untuk tindak lanjut atau perubahan jadwal.</li>
          <li>Jadwal pickup dapat <strong>dijadwalkan ulang kapan saja</strong> melalui Bestie Care.</li>
        </ul>

        <h2>4. Ketentuan kemasan dan verifikasi</h2>
        <ul>
          <li>Kemasan yang diajukan harus kosong, dibersihkan, dan aman untuk ditangani.</li>
          <li>RE-SKIN menerima kemasan kaca atau plastik sesuai panduan kemasan yang ditampilkan di website.</li>
          <li>Petugas RE-SKIN memeriksa kemasan secara fisik dan mencatat jumlah yang diterima. Jumlah yang diajukan bisa berbeda dengan jumlah yang lolos verifikasi.</li>
          <li>Kemasan yang masih berisi produk, kotor, rusak sehingga tidak aman ditangani, atau tidak sesuai panduan dapat ditolak. <strong>Kemasan yang ditolak akan dikembalikan kepada Beauty Bestie.</strong></li>
        </ul>

        <h2>5. Perhitungan dan penggunaan SKINPoint</h2>
        <p>SKINPoint diberikan <strong>setelah</strong> petugas RE-SKIN menyelesaikan verifikasi. Pengajuan pickup atau estimasi poin sebelum verifikasi belum menjadi saldo yang dapat digunakan.</p>
        <div className="legal-table-wrap">
          <table className="legal-points-table">
            <thead>
              <tr>
                <th>Ukuran kemasan</th>
                <th>SKINPoint per kemasan yang lolos verifikasi</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>5 – 40 ml</td><td>5 SKINPoint</td></tr>
              <tr><td>50 – 100 ml</td><td>10 SKINPoint</td></tr>
              <tr><td>200 – 500 ml</td><td>15 SKINPoint</td></tr>
            </tbody>
          </table>
        </div>
        <ul>
          <li>Kemasan berukuran 41–49 ml, 101–199 ml, di bawah 5 ml, di atas 500 ml, atau ukuran lain di luar rentang di atas tidak dihitung otomatis. Silakan hubungi Bestie Care untuk pengecekan lebih lanjut.</li>
          <li>Saldo dan riwayat transaksi dapat dilihat di Member Area.</li>
          <li>SKINPoint adalah reward atas partisipasimu dan <strong>tidak dapat diuangkan</strong>. Poin hanya dapat ditukar dengan berbagai hadiah di katalog sesuai jumlah poin yang dibutuhkan.</li>
          <li>SKINPoint <strong>tidak memiliki masa berlaku (tidak kedaluwarsa)</strong>.</li>
          <li>Poin yang digunakan untuk pengajuan penukaran mengikuti status transaksi dan ketentuan yang tercantum di aplikasi.</li>
        </ul>

        <h2>6. Katalog dan penukaran hadiah</h2>
        <ul>
          <li>Hadiah yang dapat ditukar, biaya SKINPoint, dan stok mengikuti informasi di katalog saat pengajuan dilakukan.</li>
          <li>Pengajuan penukaran perlu ditinjau dan disetujui tim RE-SKIN. Pengajuan belum berarti hadiah sudah diserahkan.</li>
          <li>Tim RE-SKIN akan memperbarui status dan informasi pemenuhan hadiah melalui Member Area atau kanal komunikasi yang tersedia.</li>
          <li>Ikuti instruksi pengambilan atau pengiriman yang dikonfirmasi tim RE-SKIN, lalu berikan konfirmasi penerimaan melalui fitur yang tersedia.</li>
          <li>Jika stok atau hadiah tidak dapat dipenuhi, tim RE-SKIN akan menghubungimu dan memperbarui status pengajuan sesuai proses yang berlaku.</li>
        </ul>

        <h2>7. Pembatalan dan peninjauan</h2>
        <ul>
          <li>Pengajuan pickup atau penukaran hadiah dapat dibatalkan oleh <strong>Bestie Care</strong> dalam hal:
            <ol>
              <li>terjadi pengajuan ganda (double request);</li>
              <li>ada permintaan pembatalan dari Beauty Bestie; atau</li>
              <li>jadwal pickup tidak menemukan kesepakatan waktu.</li>
            </ol>
          </li>
          <li>Jika pickup dibatalkan, kamu dapat mengajukan jadwal baru kapan saja melalui Bestie Care.</li>
          <li>Jika ada informasi yang tidak sesuai, tim RE-SKIN dapat meminta klarifikasi atau memperbarui status pengajuan.</li>
          <li>Perubahan saldo poin mengikuti catatan transaksi yang tercantum di akunmu.</li>
        </ul>

        <h2>8. Penggunaan yang wajar</h2>
        <p>Beauty Bestie tidak diperkenankan memberikan informasi palsu, mengajukan kemasan yang sama berulang kali, memanipulasi jumlah kemasan, atau mencoba mengakses akun dan data pengguna lain. Pengajuan yang terindikasi tidak wajar dapat ditahan untuk pemeriksaan lebih lanjut. <strong>Jika terbukti melanggar, SKINPoint terkait akan dibatalkan.</strong></p>

        <h2>9. Data pribadi</h2>
        <p>Nama, email, pilihan avatar, nomor WhatsApp, alamat pickup, riwayat transaksi, dan notifikasi digunakan untuk menjalankan layanan, sebagaimana dijelaskan lebih lanjut dalam <Link href="/kebijakan-privasi">Kebijakan Privasi RE-SKIN</Link>. Data tidak dijual dan tidak digunakan untuk iklan.</p>

        <h2>10. Perubahan ketentuan</h2>
        <p>RE-SKIN dapat memperbarui informasi layanan, katalog, prosedur, atau ketentuan apabila diperlukan. Perubahan penting akan diinformasikan melalui website atau kanal komunikasi yang tersedia. Beauty Bestie disarankan membaca ketentuan ini kembali secara berkala.</p>

        <h2>11. Kontak</h2>
        <p>Untuk pertanyaan, penjadwalan ulang, atau pengecekan ukuran kemasan, hubungi Bestie Care melalui kanal yang tertera di website RE-SKIN.</p>
        <p>Dengan menggunakan RE-SKIN, kamu menyatakan bersedia mengikuti ketentuan ini dan memahami bahwa pemberian SKINPoint serta penukaran hadiah mengikuti hasil verifikasi dan ketersediaan layanan.</p>

        <div className="legal-page-actions">
          <Link className="btn btn-outline" href="/kebijakan-privasi">Baca Kebijakan Privasi</Link>
          <Link className="btn privacy-back-button" href="/">Kembali ke Beranda</Link>
        </div>
      </article>
    </main>
  );
}
