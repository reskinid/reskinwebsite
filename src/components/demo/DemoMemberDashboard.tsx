"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { Icon } from "@/components/Icons";
import DemoNotificationCenter from "@/components/demo/DemoNotificationCenter";
import DemoMemberProfileMenu from "@/components/demo/DemoMemberProfileMenu";
import { openAdminWhatsApp } from "@/lib/whatsapp";
import {
  DEMO_MEMBER_ID,
  publishDemoEvent,
  resetDemoEvents,
  useDemoEvents,
  type DemoEvent,
  type DemoPickup,
  type DemoPickupStatus,
  type RedemptionStatus,
  type RedemptionFulfillmentMethod,
} from "@/lib/demo-sync";

type MemberPickup = {
  id: string;
  date: string;
  time: string;
  location: string;
  status: DemoPickupStatus;
  packages: number;
  points: number;
  note?: string;
};
type MemberRedemption = {
  id: string;
  memberId: string;
  member: string;
  rewardId: string;
  rewardName: string;
  points: number;
  date: string;
  status: RedemptionStatus;
  fulfillmentMethod?: RedemptionFulfillmentMethod;
  fulfillmentDetails?: string;
  adminMessage?: string;
};
type PointTransaction = {
  id: string;
  description: string;
  date: string;
  points: number;
  status: string;
};

const initialPickups: MemberPickup[] = [
  { id: "RSK-26018", date: "2026-11-18", time: "11:00", location: "Area Parkir Perpustakaan", status: "completed", packages: 7, points: 55 },
  { id: "RSK-26014", date: "2026-11-15", time: "09:30", location: "Kos Melati, Area Kampus", status: "completed", packages: 6, points: 50 },
  { id: "RSK-26021", date: "2026-11-21", time: "09:00", location: "Kos Melati, Area Kampus", status: "pending", packages: 4, points: 20 },
];

const initialTransactions: PointTransaction[] = [
  { id: "T-081", description: "Verifikasi pickup RSK-26018", date: "18 Nov 2026", points: 55, status: "Disetujui" },
  { id: "T-080", description: "Verifikasi pickup RSK-26014", date: "15 Nov 2026", points: 50, status: "Disetujui" },
  { id: "T-079", description: "Tukar hadiah stiker RE-SKIN", date: "14 Nov 2026", points: -150, status: "Berhasil" },
];

const rewards = [
  { id: "clip", name: "Jepit rambut lucu", category: "Aksesori", points: 1000, range: "1.000–10.000", description: "Aksesori manis untuk melengkapi daily look.", icon: "sparkles" as const, color: "pink" },
  { id: "charm", name: "Bag charm & aksesori", category: "Aksesori", points: 11000, range: "11.000–25.000", description: "Charm dan aksesori pilihan untuk tas favoritmu.", icon: "gift" as const, color: "lavender" },
  { id: "beauty", name: "Produk kosmetik pilihan", category: "Beauty", points: 26000, range: "26.000–80.000", description: "Pilihan produk kosmetik untuk beauty routine-mu.", icon: "shopping-bag" as const, color: "mint" },
];

const statusLabels: Record<DemoPickupStatus, string> = {
  pending: "Menunggu konfirmasi",
  confirmed: "Pickup dikonfirmasi",
  completed: "Selesai diverifikasi",
  cancelled: "Dibatalkan",
};

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export default function DemoMemberDashboard() {
  const events = useDemoEvents();
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [showDemoNote, setShowDemoNote] = useState(true);
  const [showPickupForm, setShowPickupForm] = useState(false);
  const [pickupError, setPickupError] = useState("");
  const [notice, setNotice] = useState("Selamat datang kembali, Beauty Bestie! Ini adalah akun simulasi.");
  const [showNotice, setShowNotice] = useState(true);

  const pickups = useMemo(() => {
    let current = [...initialPickups];
    for (const event of events) {
      if (event.type === "pickup-created" && event.pickup.memberId === DEMO_MEMBER_ID) {
        const pickup = event.pickup;
        current = [{
          id: pickup.id,
          date: pickup.date,
          time: pickup.time,
          location: pickup.location,
          status: pickup.status,
          packages: pickup.small + pickup.medium + pickup.large,
          points: pickup.verifiedPoints ?? pickup.small * 5 + pickup.medium * 10 + pickup.large * 15,
          note: pickup.note,
        }, ...current.filter((item) => item.id !== pickup.id)];
      }
      if (event.type === "pickup-status-updated" && event.memberId === DEMO_MEMBER_ID) {
        current = current.map((item) => item.id === event.pickupId ? { ...item, status: event.status } : item);
      }
      if (event.type === "pickup-verified" && event.memberId === DEMO_MEMBER_ID) {
        current = current.map((item) => item.id === event.pickupId
          ? { ...item, status: "completed", packages: event.verifiedPackages, points: event.verifiedPoints }
          : item);
      }
    }
    return current;
  }, [events]);

  const balance = useMemo(() => {
    let value = 1250;
    const redemptionById = new Map<string, number>();
    for (const event of events) {
      if (event.type === "pickup-verified" && event.memberId === DEMO_MEMBER_ID) value += event.verifiedPoints;
      if (event.type === "redemption-requested" && event.redemption.memberId === DEMO_MEMBER_ID) {
        value -= event.redemption.points;
        redemptionById.set(event.redemption.id, event.redemption.points);
      }
      if (event.type === "redemption-processed" && event.memberId === DEMO_MEMBER_ID && event.status === "rejected") {
        value += redemptionById.get(event.redemptionId) ?? 0;
      }
      if (event.type === "redemption-status-updated" && event.memberId === DEMO_MEMBER_ID && event.status === "rejected") {
        value += redemptionById.get(event.redemptionId) ?? 0;
      }
    }
    return Math.max(0, value);
  }, [events]);

  const transactions = useMemo(() => {
    const current = [...initialTransactions];
    for (const event of events) {
      if (event.type === "pickup-verified" && event.memberId === DEMO_MEMBER_ID) {
        current.unshift({
          id: event.id,
          description: `Verifikasi pickup ${event.pickupId}`,
          date: "Hari ini",
          points: event.verifiedPoints,
          status: "Disetujui",
        });
      }
      if (event.type === "redemption-requested" && event.redemption.memberId === DEMO_MEMBER_ID) {
        const latest = [...events].reverse().find((candidate) =>
          (candidate.type === "redemption-status-updated" || candidate.type === "redemption-processed") &&
          candidate.redemptionId === event.redemption.id
        );
        const status: RedemptionStatus = latest?.type === "redemption-status-updated" || latest?.type === "redemption-processed"
          ? latest.status
          : "pending";
        const labels: Record<RedemptionStatus, string> = {
          pending: "Poin ditahan · menunggu admin",
          approved: "Poin ditahan · hadiah disiapkan",
          rejected: "Ditolak · poin dikembalikan",
          ready: "Poin ditahan · siap diambil",
          shipped: "Poin ditahan · dalam pengiriman",
          received: "Penukaran selesai · diterima",
        };
        current.unshift({
          id: `${event.id}-request`,
          description: `Penukaran ${event.redemption.rewardName}`,
          date: "Hari ini",
          points: -event.redemption.points,
          status: labels[status],
        });
        if (status === "rejected") {
          current.unshift({
            id: `${event.id}-refund`,
            description: `Pengembalian poin ${event.redemption.rewardName}`,
            date: "Hari ini",
            points: event.redemption.points,
            status: "Dikembalikan ke saldo",
          });
        }
      }
    }
    return current.slice(0, 8);
  }, [events]);

  const redemptions = useMemo<MemberRedemption[]>(() => {
    return events
      .filter((event): event is Extract<DemoEvent, { type: "redemption-requested" }> => event.type === "redemption-requested" && event.redemption.memberId === DEMO_MEMBER_ID)
      .map((event) => {
        const latest = [...events].reverse().find((candidate) =>
          (candidate.type === "redemption-status-updated" || candidate.type === "redemption-processed") &&
          candidate.redemptionId === event.redemption.id
        );
        const status: RedemptionStatus = latest?.type === "redemption-status-updated" || latest?.type === "redemption-processed"
          ? latest.status
          : "pending";
        return {
          ...event.redemption,
          status,
          fulfillmentMethod: latest?.type === "redemption-status-updated" ? latest.fulfillmentMethod : undefined,
          fulfillmentDetails: latest?.type === "redemption-status-updated" ? latest.fulfillmentDetails : undefined,
          adminMessage: latest?.type === "redemption-status-updated" ? latest.adminMessage : undefined,
        };
      })
      .reverse();
  }, [events]);

  const totalPackages = pickups.filter((pickup) => pickup.status === "completed").reduce((sum, pickup) => sum + pickup.packages, 0);
  const activePickups = pickups.filter((pickup) => pickup.status === "pending" || pickup.status === "confirmed").length;
  const visiblePickups = useMemo(() => pickups.filter((pickup) => {
    if (filter === "active") return pickup.status === "pending" || pickup.status === "confirmed";
    if (filter === "completed") return pickup.status === "completed";
    return true;
  }), [filter, pickups]);

  function submitDemoPickup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const date = String(form.get("date") ?? "");
    const time = String(form.get("time") ?? "");
    const location = String(form.get("location") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    const note = String(form.get("note") ?? "").trim();
    const small = Math.max(0, Number(form.get("small") ?? 0));
    const medium = Math.max(0, Number(form.get("medium") ?? 0));
    const large = Math.max(0, Number(form.get("large") ?? 0));
    const packageTotal = small + medium + large;

    if (!date || date < todayISO() || !time || !location || !phone) {
      setPickupError("Lengkapi tanggal, waktu, alamat, dan nomor WhatsApp dengan benar.");
      return;
    }
    if (![small, medium, large].every((value) => Number.isSafeInteger(value) && value >= 0) || packageTotal < 1) {
      setPickupError("Masukkan perkiraan minimal satu kemasan.");
      return;
    }

    const id = `RSK-DEMO-${Date.now().toString().slice(-7)}`;
    const pickup: DemoPickup = {
      id,
      memberId: DEMO_MEMBER_ID,
      member: "Ayu Putri",
      email: "ayu.putri@reskin.demo",
      date,
      time,
      location,
      phone,
      note,
      status: "pending",
      small,
      medium,
      large,
      verifiedPackages: null,
      verifiedPoints: null,
    };
    publishDemoEvent({ type: "pickup-created", pickup });
    const pickupMessage = [
      "Halo Admin RE-SKIN!",
      "",
      "*PENGAJUAN PICKUP BARU*",
      `ID Pengajuan: ${id}`,
      "Nama: Ayu Putri",
      "Email: ayu.putri@reskin.demo",
      `WhatsApp Member: ${phone}`,
      "",
      "*Detail kemasan:*",
      `- 5–40 ml: ${small} kemasan`,
      `- 50–100 ml: ${medium} kemasan`,
      `- 200–500 ml: ${large} kemasan`,
      `Total: ${packageTotal} kemasan`,
      "",
      `Tanggal pickup: ${date}`,
      `Waktu pickup: ${time} WIB`,
      `Alamat penjemputan: ${location}`,
      ...(note ? [`Catatan member: ${note}`] : []),
      "",
      "Mohon konfirmasi jadwal dan cakupan area pickup. Terima kasih.",
    ].join("\n");
    const whatsappOpened = openAdminWhatsApp(pickupMessage);
    setShowPickupForm(false);
    setPickupError("");
    setFilter("all");
    setNotice(
      whatsappOpened
        ? `Pengajuan ${id} tersimpan di Demo. WhatsApp Admin dibuka dengan rincian siap kirim. Tekan Kirim di WhatsApp agar admin menerima pesan.`
        : `Pengajuan ${id} tersimpan di Demo, tetapi nomor WhatsApp Admin belum dikonfigurasi. Isi NEXT_PUBLIC_RE_SKIN_ADMIN_WHATSAPP agar pesan bisa dibuka otomatis.`,
    );
    setShowNotice(true);
  }

  function redeemReward(reward: (typeof rewards)[number]) {
    if (balance < reward.points) {
      setNotice(`Poinmu belum cukup untuk ${reward.name}. Kamu masih membutuhkan ${(reward.points - balance).toLocaleString("id-ID")} SKINPoint.`);
      setShowNotice(true);
      return;
    }
    const redemption = {
      id: `RDM-DEMO-${Date.now().toString().slice(-7)}`,
      memberId: DEMO_MEMBER_ID,
      member: "Ayu Putri",
      rewardId: reward.id,
      rewardName: reward.name,
      points: reward.points,
      date: todayISO(),
    };
    publishDemoEvent({ type: "redemption-requested", redemption });
    const rewardMessage = [
      "Halo Admin RE-SKIN!",
      "",
      "*PENGAJUAN PENUKARAN HADIAH BARU*",
      `ID Pengajuan: ${redemption.id}`,
      "Nama Member: Ayu Putri",
      "Email: ayu.putri@reskin.demo",
      `Hadiah yang dipilih: ${reward.name}`,
      `SKINPoint: ${reward.points.toLocaleString("id-ID")} pts`,
      `Tanggal pengajuan: ${todayISO()}`,
      "",
      "Mohon konfirmasi ketersediaan stok dan instruksi pengambilan/pengiriman hadiah. Terima kasih.",
    ].join("\n");
    const whatsappOpened = openAdminWhatsApp(rewardMessage);
    setNotice(
      whatsappOpened
        ? `Permintaan ${reward.name} tercatat. WhatsApp Admin dibuka dengan rincian siap kirim. Tekan Kirim di WhatsApp agar admin menerima pesan.`
        : `Permintaan ${reward.name} tercatat di Demo, tetapi nomor WhatsApp Admin belum dikonfigurasi. Isi NEXT_PUBLIC_RE_SKIN_ADMIN_WHATSAPP agar pesan bisa dibuka otomatis.`,
    );
    setShowNotice(true);
  }

  function confirmRedemptionReceived(redemption: MemberRedemption) {
    if (redemption.status !== "ready" && redemption.status !== "shipped") return;
    publishDemoEvent({
      type: "redemption-status-updated",
      redemptionId: redemption.id,
      memberId: redemption.memberId,
      status: "received",
      fulfillmentMethod: redemption.fulfillmentMethod,
      fulfillmentDetails: redemption.fulfillmentDetails,
    });
    setNotice(`Terima kasih, Beauty Bestie! Penerimaan ${redemption.rewardName} berhasil dikonfirmasi.`);
    setShowNotice(true);
  }

  function resetDemo() {
    resetDemoEvents();
    setFilter("all");
    setShowDemoNote(true);
    setNotice("Demo berhasil direset. Saldo dan data kembali ke kondisi awal.");
    setShowNotice(true);
  }

  return (
    <main className="dashboard-page member-dashboard-page demo-dashboard-page">
      <div className="dashboard-shell member-shell">
        <div className="demo-mode-banner">
          <span className="demo-mode-dot" />
          <span><strong>DEMO MODE</strong> · Akun anggota contoh, bukan akun sungguhan</span>
          <span className="demo-mode-local">LOCAL PREVIEW</span>
        </div>

        <header className="dashboard-top">
          <Link className="brand admin-brand" href="/" aria-label="Kembali ke beranda RE-SKIN"><span className="brand-mark"><Icon name="recycle" size={20} /></span><span>RE-SKIN</span><span className="member-brand-tag">MEMBER</span></Link>
          <div className="admin-top-actions">
            <DemoNotificationCenter role="member" />
            <Link className="btn btn-outline" href="/"><Icon name="arrow-left" size={15} /> Beranda</Link>
            <Link className="btn btn-outline" href="/admin"><Icon name="shield-check" size={15} /> Lihat Admin</Link>
            <button className="btn btn-outline" type="button" onClick={resetDemo}><Icon name="refresh-cw" size={15} /> Reset Demo</button>
            <DemoMemberProfileMenu />
          </div>
        </header>

        <section className="member-welcome-card">
          <div>
            <div className="small-label"><Icon name="sparkles" size={14} /> MEMBER AREA · RE-SKIN</div>
            <h1 className="dashboard-title">Hai, Beauty Bestie!</h1>
            <p className="dashboard-subtitle">Welcome back, Ayu! Setiap kemasan kosong punya kesempatan untuk jadi sesuatu yang bermanfaat. Yuk, kumpulkan SKINPoint dan tukarkan dengan hadiah favoritmu.</p>
            <div className="demo-member-meta"><span><Icon name="mail" size={14} /> ayu.putri@reskin.demo</span><span><Icon name="map-pin" size={14} /> Area Kampus</span></div>
          </div>
          <div className="member-welcome-art" aria-hidden="true"><Icon name="recycle" size={76} /><span>GIVE YOUR<br />PACKAGING<br />A SECOND LIFE</span></div>
        </section>

        {showNotice ? <div className="dashboard-alert success demo-alert"><Icon name="info" size={15} /> <span>{notice}</span><button className="demo-alert-close" type="button" aria-label="Tutup notifikasi" onClick={() => setShowNotice(false)}><Icon name="x" size={14} /></button></div> : null}
        {showDemoNote ? <div className="dashboard-alert success demo-alert"><Icon name="info" size={15} /> Ini pratinjau akun Beauty Bestie. Semua transaksi dan penukaran hanya simulasi lokal, tidak mengirim data ke server atau Supabase.</div> : null}

        <section className="dashboard-grid member-stat-grid" aria-label="Ringkasan akun">
          <article className="dashboard-card member-stat-card member-points-card"><div className="small-label"><Icon name="gift" size={14} /> SALDO SKINPOINT</div><strong>{balance.toLocaleString("id-ID")}</strong><p className="muted">Poin tersedia untuk ditukarkan.</p></article>
          <article className="dashboard-card member-stat-card"><div className="small-label"><Icon name="package-check" size={14} /> KEMASAN DISETORKAN</div><strong>{totalPackages.toLocaleString("id-ID")}</strong><p className="muted">Jumlah kemasan yang lolos verifikasi.</p></article>
          <article className="dashboard-card member-stat-card"><div className="small-label"><Icon name="clock" size={14} /> PICKUP BERJALAN</div><strong>{activePickups.toLocaleString("id-ID")}</strong><p className="muted">Pengajuan yang menunggu atau telah dikonfirmasi.</p></article>
        </section>

        <div className="member-content-grid">
          <section className="dashboard-card member-history-card">
            <div className="member-section-heading"><div><div className="small-label"><Icon name="calendar-clock" size={14} /> AKTIVITAS KAMU</div><h2>Riwayat pickup</h2></div><button className="btn btn-outline" type="button" onClick={() => { setPickupError(""); setShowPickupForm(true); }}>Ajukan pickup</button></div>
            <nav className="demo-member-filters" aria-label="Filter riwayat pickup"><button type="button" className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>Semua</button><button type="button" className={filter === "active" ? "active" : ""} onClick={() => setFilter("active")}>Berjalan</button><button type="button" className={filter === "completed" ? "active" : ""} onClick={() => setFilter("completed")}>Selesai</button></nav>
            {visiblePickups.length ? <div className="member-pickup-list">{visiblePickups.map((pickup) => <article className="member-pickup-row" key={pickup.id}><span className={`member-pickup-icon status-icon-${pickup.status}`}><Icon name="package-check" size={19} /></span><div className="member-pickup-info"><div className="member-pickup-title"><strong>{formatDate(pickup.date)}</strong><span className={`status-pill status-${pickup.status}`}>{statusLabels[pickup.status]}</span></div><p><Icon name="map-pin" size={13} /> {pickup.location}</p><small>{pickup.time} WIB · {pickup.packages} kemasan · {pickup.points.toLocaleString("id-ID")} estimasi poin · {pickup.id}</small>{pickup.note ? <small className="member-pickup-note">Catatanmu: {pickup.note}</small> : null}</div></article>)}</div> : <div className="dashboard-empty">Belum ada pickup pada kategori ini.</div>}
            <div className="demo-member-actions"><button className="btn admin-action-primary" type="button" onClick={() => { setPickupError(""); setShowPickupForm(true); }}><Icon name="plus" size={15} /> Ajukan pickup simulasi</button><button className="btn btn-outline" type="button" onClick={() => setShowDemoNote((current) => !current)}><Icon name="info" size={15} /> {showDemoNote ? "Sembunyikan info" : "Tampilkan info"}</button></div>
          </section>

          <section className="dashboard-card member-points-history-card"><div className="small-label"><Icon name="gift" size={14} /> PERGERAKAN POIN</div><h2>Riwayat SKINPoint</h2><div className="member-transaction-list">{transactions.map((transaction) => <div className="member-transaction-row" key={transaction.id}><span><strong>{transaction.description}</strong><small>{transaction.date} · {transaction.status}</small></span><strong className={transaction.points >= 0 ? "points-positive" : "points-negative"}>{transaction.points > 0 ? "+" : ""}{transaction.points.toLocaleString("id-ID")}</strong></div>)}</div><div className="member-account-note"><Icon name="check-circle" size={15} /> Akun contoh · saldo awal 1.250 SKINPoint</div></section>
        </div>

        <section className="dashboard-card member-reward-center">
          <div className="member-reward-heading">
            <div><div className="small-label"><Icon name="sparkles" size={14} /> REWARD CORNER · BEAUTY BESTIE</div><h2>Hadiah yang bisa kamu tukarkan</h2><p className="muted">Pilih hadiah favoritmu dan gunakan SKINPoint yang sudah terkumpul.</p></div>
            <div className="member-reward-balance"><small>POIN TERSEDIA</small><strong>{balance.toLocaleString("id-ID")} <span>pts</span></strong></div>
          </div>
          <div className="member-reward-grid">
            {rewards.map((reward) => {
              const canRedeem = balance >= reward.points;
              return (
                <article className={`member-reward-card reward-${reward.color}`} key={reward.id}>
                  <div className="member-reward-visual"><Icon name={reward.icon} size={34} /></div>
                  <div className="member-reward-copy"><span>{reward.category}</span><h3>{reward.name}</h3><p>{reward.description}</p></div>
                  <div className="member-reward-price"><strong>{reward.points.toLocaleString("id-ID")} <small>pts</small></strong><span>Mulai dari rentang {reward.range}</span></div>
                  <button className="btn btn-dark member-redeem-button" type="button" disabled={!canRedeem} onClick={() => redeemReward(reward)}>
                    {canRedeem ? <><Icon name="gift" size={15} /> Tukar hadiah</> : <>Butuh {(reward.points - balance).toLocaleString("id-ID")} pts lagi</>}
                  </button>
                </article>
              );
            })}
          </div>
          <p className="member-reward-note">Harga demo menggunakan batas minimum rentang poin pada katalog landing page. Ketersediaan hadiah dan penukaran akhir tetap perlu dikonfirmasi admin.</p>
        </section>

        <section className="dashboard-card member-redemption-section">
          <div className="small-label"><Icon name="gift" size={14} /> PENUKARAN KAMU</div>
          <h2>Riwayat penukaran hadiah</h2>
          {redemptions.length ? <div className="member-redemption-list">{redemptions.map((item) => {
            const statusLabel: Record<RedemptionStatus, string> = {
              pending: "Menunggu persetujuan",
              approved: "Disetujui · disiapkan",
              rejected: "Ditolak · poin kembali",
              ready: "Siap diambil",
              shipped: "Sedang dikirim",
              received: "Selesai · diterima",
            };
            return (
              <article className="member-redemption-row member-redemption-row-detailed" key={item.id}>
                <span className="member-redemption-icon"><Icon name="gift" size={18} /></span>
                <span className="member-redemption-copy"><strong>{item.rewardName}</strong><small>{item.points.toLocaleString("id-ID")} SKINPoint · {formatDate(item.date)} · ID {item.id}</small></span>
                <span className={`status-pill ${item.status === "received" ? "status-completed" : item.status === "rejected" ? "status-cancelled" : item.status === "pending" ? "status-pending" : "status-confirmed"}`}>{statusLabel[item.status]}</span>
                {item.status === "approved" ? <p className="member-redemption-guidance">Permintaan disetujui. Admin sedang menyiapkan hadiah. Detail pengambilan atau pengiriman akan muncul di sini.</p> : null}
                {item.status === "rejected" ? <p className="member-redemption-guidance">{item.adminMessage ?? "Penukaran belum dapat diproses. Poin telah dikembalikan ke saldo."}</p> : null}
                {(item.status === "ready" || item.status === "shipped") ? <div className="member-redemption-fulfillment"><strong>{item.status === "ready" ? "Instruksi pengambilan" : "Informasi pengiriman"}</strong><p>{item.fulfillmentDetails}</p><button className="btn admin-action-primary" type="button" onClick={() => confirmRedemptionReceived(item)}><Icon name="check-circle" size={15} /> Saya Sudah Menerima Hadiah</button><small>Tekan setelah hadiah benar-benar kamu terima.</small></div> : null}
                {item.status === "received" ? <p className="member-redemption-guidance success-text">Penerimaan hadiah sudah kamu konfirmasi. Penukaran selesai. Terima kasih, Beauty Bestie!</p> : null}
              </article>
            );
          })}</div> : <div className="dashboard-empty">Belum ada penukaran. Pilih hadiah di Reward Corner untuk mencoba.</div>}
        </section>

        <div className="demo-member-bottom"><div><strong>Beauty Bestie, setiap empties punya kesempatan kedua!</strong><span>Terus kumpulkan SKINPoint dan bantu bumi lebih bersih.</span></div><Link className="btn btn-dark" href="/#katalog-hadiah">Lihat katalog hadiah <Icon name="arrow-up-right" size={16} /></Link></div>
        <p className="member-footer-note">RE-SKIN Member Preview · Data simulasi untuk evaluasi UI/UX.</p>
        {showPickupForm ? (
          <div className="demo-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowPickupForm(false); }}>
            <section className="demo-pickup-modal" role="dialog" aria-modal="true" aria-labelledby="demo-pickup-title">
              <div className="demo-pickup-modal-heading"><div><div className="small-label"><Icon name="calendar-clock" size={14} /> PICKUP REQUEST</div><h2 id="demo-pickup-title">Ajukan penjemputan</h2><p>Isi detail penjemputanmu. Admin hanya menerima data yang kamu kirim melalui form ini.</p></div><button type="button" className="demo-modal-close" aria-label="Tutup form" onClick={() => setShowPickupForm(false)}><Icon name="x" size={18} /></button></div>
              <form className="demo-pickup-form" onSubmit={submitDemoPickup}>
                <div className="demo-form-grid">
                  <label>Tanggal pickup<input name="date" type="date" min={todayISO()} defaultValue={todayISO()} required /></label>
                  <label>Waktu pickup<input name="time" type="time" required /></label>
                </div>
                <label>Alamat penjemputan<textarea name="location" rows={2} placeholder="Nama gedung, area kampus, nomor kos, atau patokan lokasi" required /></label>
                <label>Nomor WhatsApp aktif<input name="phone" type="tel" placeholder="Contoh: 0812xxxxxxxx" required /></label>
                <div className="demo-package-estimate"><strong>Perkiraan jumlah kemasan</strong><span>Isi perkiraan saja. Jumlah final dan SKINPoint ditentukan admin saat verifikasi.</span><div className="demo-form-grid demo-package-grid"><label>Kecil · 5–40 ml<input name="small" type="number" min="0" step="1" defaultValue="0" required /></label><label>Sedang · 50–100 ml<input name="medium" type="number" min="0" step="1" defaultValue="0" required /></label><label>Besar · 200–500 ml<input name="large" type="number" min="0" step="1" defaultValue="0" required /></label></div></div>
                <label>Catatan tambahan <span className="demo-optional-label">Opsional</span><textarea name="note" rows={2} placeholder="Contoh: mohon hubungi saya saat sudah tiba. Kosongkan jika tidak ada catatan." /></label>
                {pickupError ? <p className="demo-form-error">{pickupError}</p> : null}
                <div className="demo-pickup-form-actions"><button className="btn btn-outline" type="button" onClick={() => setShowPickupForm(false)}>Batal</button><button className="btn btn-dark" type="submit"><Icon name="package-check" size={15} /> Kirim Pengajuan</button></div>
                <small className="demo-form-privacy">Notifikasi admin dikirim setelah kamu menekan tombol Kirim Pengajuan. Catatan kosong tidak akan dibuat atau ditambahkan otomatis.</small>
              </form>
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}
