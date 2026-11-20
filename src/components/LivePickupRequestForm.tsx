"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icons";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { openAdminWhatsApp, reserveAdminWhatsAppWindow } from "@/lib/whatsapp";

type Props = {
  memberName: string;
  memberEmail: string;
};

export default function LivePickupRequestForm({ memberName, memberEmail }: Props) {
  const router = useRouter();
  const whatsappWindow = useRef<WindowProxy | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("13:00");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [small, setSmall] = useState(0);
  const [medium, setMedium] = useState(0);
  const [large, setLarge] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [success, setSuccess] = useState<{ requestCode: string; whatsappOpened: boolean; count: number; points: number } | null>(null);
  const [minDate, setMinDate] = useState("");

  useEffect(() => {
    const now = new Date();
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    setMinDate(localDate);
    setDate(localDate);
  }, []);

  const total = useMemo(() => small + medium + large, [small, medium, large]);
  const points = useMemo(() => small * 5 + medium * 10 + large * 15, [small, medium, large]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setErrorMessage("");

    if (!date || !time || !location.trim() || !phone.trim()) {
      setErrorMessage("Lengkapi tanggal, jam, alamat penjemputan, dan nomor WhatsApp.");
      return;
    }
    if (total < 1) {
      setErrorMessage("Masukkan setidaknya satu kemasan yang akan dijemput.");
      return;
    }
    if (small < 0 || medium < 0 || large < 0 || [small, medium, large].some((value) => !Number.isInteger(value) || value > 999)) {
      setErrorMessage("Jumlah kemasan harus berupa bilangan bulat antara 0 sampai 999.");
      return;
    }

    // Reserve the tab during the direct click gesture so the browser does not block WhatsApp later.
    whatsappWindow.current = reserveAdminWhatsAppWindow();
    void submitRequest();
  }

  async function submitRequest() {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      whatsappWindow.current?.close();
      whatsappWindow.current = null;
      setLoading(false);
      setErrorMessage("Koneksi Supabase belum tersedia. Periksa konfigurasi .env.local lalu muat ulang.");
      return;
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      whatsappWindow.current?.close();
      whatsappWindow.current = null;
      setLoading(false);
      setErrorMessage("Sesi login tidak ditemukan. Silakan keluar dan masuk kembali.");
      return;
    }

    const { data: profile } = await supabase.from("profiles").select("role,full_name").eq("id", user.id).maybeSingle();
    if (profile?.role !== "member") {
      whatsappWindow.current?.close();
      whatsappWindow.current = null;
      setLoading(false);
      setErrorMessage("Pengajuan pickup hanya tersedia untuk akun Member RE-SKIN.");
      return;
    }

    const { data: requestId, error } = await supabase.rpc("submit_pickup_request", {
      p_pickup_date: date,
      p_pickup_time: time,
      p_location: location.trim(),
      p_phone: phone.trim(),
      p_note: note.trim() || null,
      p_small_quantity: small,
      p_medium_quantity: medium,
      p_large_quantity: large,
      p_total_packages: total,
      p_estimated_points: points,
    });

    if (error || !requestId) {
      whatsappWindow.current?.close();
      whatsappWindow.current = null;
      setLoading(false);
      const rawMessage = error?.message ?? "";
      setErrorMessage(rawMessage.includes("Pickup date cannot be in the past")
        ? "Tanggal pickup tidak boleh berada di masa lalu. Silakan pilih tanggal lain."
        : rawMessage.includes("Invalid package total")
          ? "Jumlah kemasan tidak valid. Periksa kembali jumlah setiap ukuran."
          : `Pengajuan belum berhasil disimpan. ${rawMessage || "Silakan coba kembali."}`);
      return;
    }

    const { data: savedPickup } = await supabase
      .from("pickup_requests")
      .select("request_code")
      .eq("id", String(requestId))
      .maybeSingle();
    const requestCode = savedPickup?.request_code || String(requestId);
    const displayName = profile.full_name || memberName || user.email || "Beauty Bestie";
    const message = [
      "Halo Admin RE-SKIN!",
      "",
      "*PENGAJUAN PICKUP BARU*",
      `Nomor pengajuan: ${requestCode}`,
      `Nama Beauty Bestie: ${displayName}`,
      `Email: ${user.email ?? memberEmail ?? "-"}`,
      `WhatsApp member: ${phone.trim()}`,
      "",
      "*Rincian kemasan:*",
      `- 5–40 ml: ${small} kemasan`,
      `- 50–100 ml: ${medium} kemasan`,
      `- 200–500 ml: ${large} kemasan`,
      `Total: ${total} kemasan`,
      `Estimasi: ${points.toLocaleString("id-ID")} SKINPoint (menunggu verifikasi)`,
      "",
      `Tanggal pickup: ${date}`,
      `Jam pickup: ${time} WIB`,
      `Alamat penjemputan: ${location.trim()}`,
      ...(note.trim() ? [`Catatan member: ${note.trim()}`] : []),
      "",
      "Mohon konfirmasi jadwal dan cakupan area pickup. Terima kasih.",
    ].join("\n");

    const whatsappOpened = openAdminWhatsApp(message, whatsappWindow.current);
    whatsappWindow.current = null;
    setLoading(false);
    setSuccess({ requestCode, whatsappOpened, count: total, points });
    router.refresh();
  }

  if (success) {
    return (
      <section className="pickup-success-card" aria-live="polite">
        <span className="pickup-success-icon"><Icon name="check-circle" size={30} /></span>
        <div className="small-label">PENGAJUAN BERHASIL TERSIMPAN</div>
        <h2>Terima kasih, Beauty Bestie!</h2>
        <p>Pengajuan pickup kamu sudah masuk ke database RE-SKIN dan menunggu konfirmasi Admin.</p>
        <div className="pickup-success-code">
          <span>Nomor pengajuan</span>
          <strong>{success.requestCode}</strong>
        </div>
        <div className="pickup-success-summary">
          <div><strong>{success.count}</strong><span>kemasan diajukan</span></div>
          <div><strong>{success.points.toLocaleString("id-ID")}</strong><span>estimasi SKINPoint</span></div>
        </div>
        <div className={success.whatsappOpened ? "dashboard-alert success" : "dashboard-alert"}>
          {success.whatsappOpened
            ? "WhatsApp Admin sudah dibuka dengan rincian pengajuan. Tekan tombol Kirim di WhatsApp agar Admin langsung menerima pemberitahuan."
            : "Pengajuan tersimpan. Admin dapat melihatnya melalui dashboard; WhatsApp tidak berhasil dibuka atau nomor Admin belum tersedia."}
        </div>
        <p className="pickup-small-note">SKINPoint belum masuk ke saldo. Poin baru diberikan setelah Admin memverifikasi kemasan yang diterima.</p>
        <div className="pickup-success-actions">
          <Link className="btn btn-dark" href="/dashboard">Lihat dashboard <Icon name="arrow-up-right" size={15} /></Link>
          <button className="btn btn-outline" type="button" onClick={() => { setSuccess(null); setSmall(0); setMedium(0); setLarge(0); setLocation(""); setPhone(""); setNote(""); }}>Buat pengajuan lain</button>
        </div>
      </section>
    );
  }

  return (
    <form className="live-pickup-form" onSubmit={handleSubmit}>
      <div className="pickup-form-intro">
        <div className="small-label"><Icon name="package-check" size={14} /> RINCIAN KEMASAN</div>
        <p>Pilih jumlah kemasan berdasarkan kapasitasnya. Admin akan memeriksa kondisi dan jumlah akhir saat pickup.</p>
      </div>

      <div className="pickup-quantity-grid">
        <label className="pickup-quantity-field">
          <span>5–40 ml <small>5 poin / kemasan</small></span>
          <input type="number" min="0" max="999" step="1" value={small} onChange={(event) => setSmall(Math.max(0, Number(event.target.value) || 0))} />
        </label>
        <label className="pickup-quantity-field">
          <span>50–100 ml <small>10 poin / kemasan</small></span>
          <input type="number" min="0" max="999" step="1" value={medium} onChange={(event) => setMedium(Math.max(0, Number(event.target.value) || 0))} />
        </label>
        <label className="pickup-quantity-field">
          <span>200–500 ml <small>15 poin / kemasan</small></span>
          <input type="number" min="0" max="999" step="1" value={large} onChange={(event) => setLarge(Math.max(0, Number(event.target.value) || 0))} />
        </label>
      </div>

      <div className="live-pickup-estimate">
        <div><span>Total kemasan</span><strong>{total.toLocaleString("id-ID")}</strong></div>
        <div><span>Estimasi SKINPoint</span><strong>{points.toLocaleString("id-ID")} <small>pts</small></strong></div>
      </div>

      <div className="pickup-form-divider" />
      <div className="small-label"><Icon name="calendar-clock" size={14} /> JADWAL & LOKASI PENJEMPUTAN</div>
      <div className="pickup-form-fields-two">
        <label className="pickup-input-field">
          <span>Tanggal pickup</span>
          <input type="date" required min={minDate || undefined} value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
        <label className="pickup-input-field">
          <span>Jam pickup</span>
          <input type="time" required value={time} onChange={(event) => setTime(event.target.value)} />
        </label>
      </div>
      <label className="pickup-input-field">
        <span>Alamat / lokasi penjemputan</span>
        <textarea required maxLength={300} rows={3} value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Contoh: Area kampus, nama gedung, lantai, titik temu, dan patokan lokasi." />
      </label>
      <label className="pickup-input-field">
        <span>Nomor WhatsApp yang bisa dihubungi</span>
        <input required type="tel" minLength={8} maxLength={22} pattern="[0-9+ .()\-]{8,22}" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="08xxxxxxxxxx" />
      </label>
      <label className="pickup-input-field">
        <span>Catatan untuk Admin <small>(opsional)</small></span>
        <textarea maxLength={300} rows={2} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Boleh dikosongkan. Isi hanya jika ada informasi tambahan." />
      </label>

      {errorMessage ? <div className="dashboard-alert error" role="alert"><Icon name="alert-circle" size={15} /> {errorMessage}</div> : null}
      <div className="pickup-form-notice"><Icon name="info" size={17} /><span>Estimasi poin bukan saldo final. Poin hanya diberikan untuk kemasan yang lolos verifikasi Admin. Catatan bersifat opsional dan tidak akan diisi otomatis.</span></div>
      <button className="btn btn-dark pickup-submit-button" type="submit" disabled={loading}>
        {loading ? "Menyimpan pengajuan..." : <><Icon name="package-check" size={17} /> Kirim Pengajuan Pickup <Icon name="arrow-up-right" size={16} /></>}
      </button>
      <p className="pickup-submit-caption">Setelah tersimpan, WhatsApp Admin akan dibuka dengan rincian pengajuan. Kamu tetap perlu menekan Kirim di WhatsApp.</p>
    </form>
  );
}
