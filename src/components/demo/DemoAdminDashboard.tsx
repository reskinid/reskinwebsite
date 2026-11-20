"use client";

import Image from "next/image";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { Icon } from "@/components/Icons";
import DemoNotificationCenter from "@/components/demo/DemoNotificationCenter";
import AdminProfileMenu from "@/components/AdminProfileMenu";
import { publishDemoEvent, resetDemoEvents, useDemoEvents, type DemoEvent, type DemoPickup, type DemoRedemption, type RedemptionStatus, type RedemptionFulfillmentMethod } from "@/lib/demo-sync";

type PickupStatus = "pending" | "confirmed" | "completed" | "cancelled";
type Pickup = {
  id: string;
  memberId?: string;
  member: string;
  email: string;
  date: string;
  time: string;
  location: string;
  phone: string;
  note: string;
  status: PickupStatus;
  small: number;
  medium: number;
  large: number;
  verifiedPackages: number | null;
  verifiedPoints: number | null;
};
type Transaction = {
  id: string;
  member: string;
  description: string;
  date: string;
  points: number;
};
type AdminRedemption = DemoRedemption & {
  status: RedemptionStatus;
  fulfillmentMethod?: RedemptionFulfillmentMethod;
  fulfillmentDetails?: string;
  adminMessage?: string;
};

const initialPickups: Pickup[] = [
  {
    id: "RSK-26021",
    member: "Nadia Putri",
    email: "nadia.putri@example.com",
    date: "2026-11-21",
    time: "09:00",
    location: "Kos Melati, Area Kampus",
    phone: "0812-0000-1122",
    note: "Tolong hubungi 10 menit sebelum tiba.",
    status: "pending",
    small: 3,
    medium: 2,
    large: 1,
    verifiedPackages: null,
    verifiedPoints: null,
  },
  {
    id: "RSK-26020",
    member: "Alya Rahma",
    email: "alya.rahma@example.com",
    date: "2026-11-21",
    time: "13:30",
    location: "Gerbang Utama Kampus",
    phone: "0813-0000-2233",
    note: "Saya membawa botol serum dan toner.",
    status: "pending",
    small: 4,
    medium: 3,
    large: 0,
    verifiedPackages: null,
    verifiedPoints: null,
  },
  {
    id: "RSK-26019",
    member: "Salsabila N.",
    email: "salsabila.n@example.com",
    date: "2026-11-22",
    time: "10:00",
    location: "Kos Putri Mawar, Area Kampus",
    phone: "0857-0000-3344",
    note: "",
    status: "confirmed",
    small: 5,
    medium: 2,
    large: 1,
    verifiedPackages: null,
    verifiedPoints: null,
  },
  {
    id: "RSK-26018",
    member: "Dinda Maharani",
    email: "dinda.m@example.com",
    date: "2026-11-18",
    time: "11:00",
    location: "Area Parkir Perpustakaan",
    phone: "0821-0000-4455",
    note: "",
    status: "completed",
    small: 4,
    medium: 2,
    large: 1,
    verifiedPackages: 7,
    verifiedPoints: 55,
  },
  {
    id: "RSK-26017",
    member: "Keisha Anindya",
    email: "keisha.a@example.com",
    date: "2026-11-17",
    time: "15:00",
    location: "Kos Anggrek, Area Kampus",
    phone: "0819-0000-5566",
    note: "",
    status: "completed",
    small: 2,
    medium: 4,
    large: 1,
    verifiedPackages: 7,
    verifiedPoints: 65,
  },
  {
    id: "RSK-26016",
    member: "Mira Safitri",
    email: "mira.s@example.com",
    date: "2026-11-16",
    time: "09:30",
    location: "Halte Kampus",
    phone: "0812-0000-6677",
    note: "",
    status: "cancelled",
    small: 2,
    medium: 1,
    large: 0,
    verifiedPackages: null,
    verifiedPoints: null,
  },
];

const initialTransactions: Transaction[] = [
  { id: "TRX-0081", member: "Dinda Maharani", description: "Verifikasi pickup RSK-26018", date: "18 Nov 2026", points: 55 },
  { id: "TRX-0080", member: "Keisha Anindya", description: "Verifikasi pickup RSK-26017", date: "17 Nov 2026", points: 65 },
  { id: "TRX-0079", member: "Nadia Putri", description: "Bonus partisipasi RE-SKIN", date: "15 Nov 2026", points: 50 },
  { id: "TRX-0078", member: "Alya Rahma", description: "Verifikasi pickup sebelumnya", date: "14 Nov 2026", points: 60 },
];

const initialMembers = [
  { name: "Ayu Putri · Beauty Bestie", email: "ayu.putri@reskin.demo", role: "Anggota", joined: "19 Nov 2026" },
  { name: "Nadia Putri", email: "nadia.putri@example.com", role: "Anggota", joined: "19 Nov 2026" },
  { name: "Alya Rahma", email: "alya.rahma@example.com", role: "Anggota", joined: "18 Nov 2026" },
  { name: "Salsabila N.", email: "salsabila.n@example.com", role: "Anggota", joined: "17 Nov 2026" },
  { name: "Dinda Maharani", email: "dinda.m@example.com", role: "Anggota", joined: "16 Nov 2026" },
  { name: "Keisha Anindya", email: "keisha.a@example.com", role: "Anggota", joined: "15 Nov 2026" },
  { name: "RE-SKIN Admin", email: "admin@reskin.demo", role: "Admin", joined: "01 Nov 2026" },
];

const statusLabels: Record<PickupStatus, string> = {
  pending: "Menunggu",
  confirmed: "Dikonfirmasi",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

const filters: { value: "all" | PickupStatus; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "pending", label: "Menunggu" },
  { value: "confirmed", label: "Dikonfirmasi" },
  { value: "completed", label: "Selesai" },
  { value: "cancelled", label: "Dibatalkan" },
];

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function DemoAdminDashboard() {
  const events = useDemoEvents();
  const [filter, setFilter] = useState<"all" | PickupStatus>("all");
  const [pickupSearch, setPickupSearch] = useState("");
  const [pickupMonth, setPickupMonth] = useState("");
  const [pickupYear, setPickupYear] = useState("");
  const [pickupSort, setPickupSort] = useState<"newest" | "oldest">("newest");
  const [redemptionSearch, setRedemptionSearch] = useState("");
  const [redemptionMonth, setRedemptionMonth] = useState("");
  const [redemptionYear, setRedemptionYear] = useState("");
  const [redemptionSort, setRedemptionSort] = useState<"newest" | "oldest">("newest");
  const [notice, setNotice] = useState("Ini adalah data simulasi. Perubahan tersinkron antar-tab browser.");

  const pickups = useMemo(() => {
    let current = [...initialPickups];
    for (const event of events) {
      if (event.type === "pickup-created") {
        current = [event.pickup, ...current.filter((item) => item.id !== event.pickup.id)];
      }
      if (event.type === "pickup-status-updated") {
        current = current.map((item) => item.id === event.pickupId ? { ...item, status: event.status } : item);
      }
      if (event.type === "pickup-verified") {
        current = current.map((item) => item.id === event.pickupId
          ? { ...item, status: "completed", small: event.small, medium: event.medium, large: event.large, verifiedPackages: event.verifiedPackages, verifiedPoints: event.verifiedPoints }
          : item);
      }
    }
    return current;
  }, [events]);

  const transactions = useMemo(() => {
    const current = [...initialTransactions];
    for (const event of events) {
      if (event.type === "pickup-verified") {
        const pickup = pickups.find((item) => item.id === event.pickupId);
        current.unshift({
          id: event.id,
          member: pickup?.member ?? "Beauty Bestie",
          description: `Verifikasi pickup ${event.pickupId}`,
          date: "Hari ini",
          points: event.verifiedPoints,
        });
      }
    }
    return current;
  }, [events, pickups]);

  const redemptions = useMemo<AdminRedemption[]>(() => events
    .filter((event): event is Extract<DemoEvent, { type: "redemption-requested" }> => event.type === "redemption-requested")
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
    .reverse(), [events]);

  const deletionRequests = useMemo(() => events
    .filter((event): event is Extract<DemoEvent, { type: "account-deletion-requested" }> => event.type === "account-deletion-requested")
    .map((event) => {
      const latest = [...events].reverse().find((candidate) =>
        candidate.type === "account-deletion-status-updated" && candidate.requestId === event.request.id
      );
      return {
        ...event.request,
        status: latest?.type === "account-deletion-status-updated" ? latest.status : "pending" as const,
        adminMessage: latest?.type === "account-deletion-status-updated" ? latest.adminMessage : undefined,
      };
    })
    .reverse(), [events]);

  const pendingDeletionCount = deletionRequests.filter((request) => request.status === "pending").length;

  const pendingCount = pickups.filter((pickup) => pickup.status === "pending").length;
  const confirmedCount = pickups.filter((pickup) => pickup.status === "confirmed").length;
  const completedCount = 13 + pickups.filter((pickup) => pickup.status === "completed").length - initialPickups.filter((pickup) => pickup.status === "completed").length;
  const distributedPoints = 8450 + transactions
    .filter((item) => item.id.startsWith("demo-event-") && item.points > 0)
    .reduce((sum, item) => sum + item.points, 0);
  const pickupYears = useMemo(
    () => Array.from(new Set(pickups.map((pickup) => pickup.date.slice(0, 4)))).filter(Boolean).sort((a, b) => b.localeCompare(a)),
    [pickups],
  );
  const redemptionYears = useMemo(
    () => Array.from(new Set(redemptions.map((item) => item.date.slice(0, 4)))).filter(Boolean).sort((a, b) => b.localeCompare(a)),
    [redemptions],
  );
  const visiblePickups = useMemo(() => {
    const query = pickupSearch.trim().toLowerCase();
    return pickups
      .filter((pickup) => filter === "all" || pickup.status === filter)
      .filter((pickup) => !query || pickup.id.toLowerCase().includes(query))
      .filter((pickup) => !pickupMonth || pickup.date.slice(5, 7) === pickupMonth)
      .filter((pickup) => !pickupYear || pickup.date.slice(0, 4) === pickupYear)
      .sort((a, b) => {
        const aTime = new Date(`${a.date}T${a.time || "00:00"}:00`).getTime();
        const bTime = new Date(`${b.date}T${b.time || "00:00"}:00`).getTime();
        return pickupSort === "newest" ? bTime - aTime : aTime - bTime;
      });
  }, [filter, pickups, pickupSearch, pickupMonth, pickupYear, pickupSort]);
  const visibleRedemptions = useMemo(() => {
    const query = redemptionSearch.trim().toLowerCase();
    return redemptions
      .filter((item) => !query || item.id.toLowerCase().includes(query))
      .filter((item) => !redemptionMonth || item.date.slice(5, 7) === redemptionMonth)
      .filter((item) => !redemptionYear || item.date.slice(0, 4) === redemptionYear)
      .sort((a, b) => {
        const aTime = new Date(`${a.date}T00:00:00`).getTime();
        const bTime = new Date(`${b.date}T00:00:00`).getTime();
        return redemptionSort === "newest" ? bTime - aTime : aTime - bTime;
      });
  }, [redemptions, redemptionSearch, redemptionMonth, redemptionYear, redemptionSort]);

  function updateStatus(id: string, status: PickupStatus) {
    const pickup = pickups.find((item) => item.id === id);
    publishDemoEvent({ type: "pickup-status-updated", pickupId: id, memberId: pickup?.memberId ?? "", status });
    setNotice(status === "confirmed" ? "Pickup berhasil dikonfirmasi. Member akan menerima notifikasi." : "Pickup dibatalkan. Member akan menerima notifikasi.");
  }

  function verifyPickup(event: FormEvent<HTMLFormElement>, pickup: Pickup) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const small = Math.max(0, Number(form.get("small") ?? 0));
    const medium = Math.max(0, Number(form.get("medium") ?? 0));
    const large = Math.max(0, Number(form.get("large") ?? 0));
    const packages = small + medium + large;
    if (![small, medium, large].every((quantity) => Number.isSafeInteger(quantity) && quantity >= 0) || packages < 1) {
      setNotice("Masukkan minimal satu kemasan untuk menyelesaikan simulasi verifikasi.");
      return;
    }
    const points = small * 5 + medium * 10 + large * 15;
    publishDemoEvent({
      type: "pickup-verified",
      pickupId: pickup.id,
      memberId: pickup.memberId ?? "",
      small,
      medium,
      large,
      verifiedPackages: packages,
      verifiedPoints: points,
    });
    setNotice(`Verifikasi simulasi berhasil. ${packages} kemasan dan ${points.toLocaleString("id-ID")} SKINPoint dicatat. Member akan menerima notifikasi.`);
  }

  function processRedemption(redemptionId: string, memberId: string, status: "approved" | "rejected") {
    publishDemoEvent({
      type: "redemption-status-updated",
      redemptionId,
      memberId,
      status,
      adminMessage: status === "rejected" ? "Stok hadiah belum tersedia atau permintaan belum dapat dipenuhi. SKINPoint dikembalikan ke saldo." : "Permintaan disetujui. Hadiah sedang disiapkan; detail penyerahan akan dikirim setelah siap.",
    });
    setNotice(status === "approved"
      ? "Permintaan disetujui. Member diberi tahu bahwa hadiah sedang disiapkan; penukaran belum selesai."
      : "Permintaan ditolak. Poin demo dikembalikan ke saldo member.");
  }

  function setRedemptionFulfillment(event: FormEvent<HTMLFormElement>, redemption: AdminRedemption) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const method = String(form.get("method") ?? "pickup") as RedemptionFulfillmentMethod;
    const details = String(form.get("details") ?? "").trim();
    if ((method !== "pickup" && method !== "delivery") || !details) {
      setNotice("Pilih metode penyerahan dan isi detail yang akan diterima member.");
      return;
    }
    publishDemoEvent({
      type: "redemption-status-updated",
      redemptionId: redemption.id,
      memberId: redemption.memberId,
      status: method === "pickup" ? "ready" : "shipped",
      fulfillmentMethod: method,
      fulfillmentDetails: details,
      adminMessage: method === "pickup" ? "Hadiah siap diambil sesuai detail yang diberikan." : "Hadiah sudah diserahkan ke proses pengiriman sesuai detail yang diberikan.",
    });
    setNotice(method === "pickup"
      ? "Instruksi pengambilan dikirim ke Member Area. Tunggu Beauty Bestie mengonfirmasi hadiah diterima."
      : "Informasi pengiriman dikirim ke Member Area. Tunggu Beauty Bestie mengonfirmasi hadiah diterima.");
  }

  function reviewAccountDeletion(requestId: string, memberId: string, status: "approved" | "rejected") {
    publishDemoEvent({
      type: "account-deletion-status-updated",
      requestId,
      memberId,
      status,
      adminMessage: status === "approved"
        ? "Admin menyetujui pengajuan. Tim RE-SKIN akan menghubungi untuk verifikasi akhir sebelum penghapusan permanen."
        : "Admin belum dapat menyetujui pengajuan ini. Silakan hubungi tim RE-SKIN jika ingin mengajukan kembali.",
    });
    setNotice(status === "approved"
      ? "Pengajuan disetujui untuk proses verifikasi akhir. Akun belum dihapus otomatis."
      : "Pengajuan penghapusan akun ditolak. Member telah menerima pemberitahuan.");
  }

  function resetDemo() {
    resetDemoEvents();
    setFilter("all");
    setNotice("Data simulasi admin dan member berhasil direset.");
  }

  return (
    <main className="dashboard-page admin-dashboard-page demo-dashboard-page">
      <div className="dashboard-shell admin-shell">
        <div className="demo-mode-banner">
          <span className="demo-mode-dot" />
          <span><strong>DEMO MODE</strong> · Data contoh, bukan data pengguna sungguhan</span>
          <span className="demo-mode-local">LOCAL PREVIEW</span>
        </div>

        <header className="dashboard-top admin-topbar">
          <Link className="brand admin-brand dashboard-brand" href="/" aria-label="Kembali ke beranda RE-SKIN">
            <Image src="/reskin-logo-black.png" alt="RE-SKIN" width={2048} height={582} className="dashboard-brand-logo" priority />
            <span className="admin-brand-tag">ADMIN</span>
          </Link>
          <div className="admin-top-actions">
            <DemoNotificationCenter role="admin" />
            <Link className="btn btn-outline" href="/"><Icon name="arrow-left" size={15} /> Beranda</Link>
            <Link className="btn btn-outline" href="/dashboard"><Icon name="users" size={15} /> Lihat Member</Link>
            <button className="btn btn-outline" type="button" onClick={resetDemo}><Icon name="refresh-cw" size={15} /> Reset Demo</button>
            <AdminProfileMenu name="Admin RE-SKIN" email="admin@reskin.demo" role="Administrator" joinedAt="01 Nov 2026" demo />
          </div>
        </header>

        <div className="admin-heading-row">
          <div>
            <div className="small-label"><Icon name="shield-check" size={14} /> ADMIN CONTROL CENTER</div>
            <h1 className="dashboard-title">Dashboard Admin</h1>
            <p className="dashboard-subtitle">Selamat datang, Admin RE-SKIN. Kelola penjemputan, verifikasi kemasan, anggota, dan distribusi SKINPoint.</p>
          </div>
          <div className="admin-secure-note"><Icon name="shield-check" size={17} /> Pratinjau tampilan admin</div>
        </div>

        <div className="dashboard-alert success demo-alert"><Icon name="info" size={15} /> {notice}</div>

        <section className="dashboard-grid admin-stat-grid" aria-label="Ringkasan RE-SKIN">
          <article className="dashboard-card admin-stat-card"><div className="small-label"><Icon name="users" size={14} /> TOTAL ANGGOTA</div><strong>24</strong><p className="muted">Akun anggota dalam data contoh.</p></article>
          <article className="dashboard-card admin-stat-card"><div className="small-label"><Icon name="clock" size={14} /> MENUNGGU TINDAKAN</div><strong>{pendingCount.toLocaleString("id-ID")}</strong><p className="muted">Pengajuan yang belum diproses.</p></article>
          <article className="dashboard-card admin-stat-card"><div className="small-label"><Icon name="package-check" size={14} /> PICKUP SELESAI</div><strong>{completedCount.toLocaleString("id-ID")}</strong><p className="muted">Termasuk riwayat simulasi sebelumnya.</p></article>
          <article className="dashboard-card admin-stat-card"><div className="small-label"><Icon name="gift" size={14} /> SKINPOINT TERCATAT</div><strong>{distributedPoints.toLocaleString("id-ID")}</strong><p className="muted">Poin contoh dan hasil simulasi verifikasi.</p></article>
        </section>

        <section className="dashboard-card admin-workspace-card">
          <div className="admin-section-heading">
            <div><div className="small-label"><Icon name="dashboard" size={14} /> OPERASIONAL</div><h2>Kelola pengajuan pickup</h2><p className="muted">Coba konfirmasi jadwal, batalkan pengajuan, atau verifikasi kemasan. Semua tindakan hanya simulasi.</p></div>
            <div className="admin-mini-counts"><span>{pendingCount} menunggu</span><span>{confirmedCount} dikonfirmasi</span></div>
          </div>

          <nav className="admin-filter-tabs" aria-label="Filter status pickup">
            {filters.map((tab) => <button key={tab.value} type="button" className={filter === tab.value ? "active" : ""} onClick={() => setFilter(tab.value)}>{tab.label}</button>)}
          </nav>

          <div className="admin-request-tools" aria-label="Pencarian dan filter tanggal pickup">
            <label className="admin-request-search">
              <span><Icon name="search" size={15} /> Cari nomor pengajuan</span>
              <input type="search" value={pickupSearch} onChange={(event) => setPickupSearch(event.target.value)} placeholder="Contoh: RSK-26021" />
            </label>
            <label>
              <span>Bulan</span>
              <select value={pickupMonth} onChange={(event) => setPickupMonth(event.target.value)}>
                <option value="">Semua bulan</option>
                <option value="01">Januari</option>
                <option value="02">Februari</option>
                <option value="03">Maret</option>
                <option value="04">April</option>
                <option value="05">Mei</option>
                <option value="06">Juni</option>
                <option value="07">Juli</option>
                <option value="08">Agustus</option>
                <option value="09">September</option>
                <option value="10">Oktober</option>
                <option value="11">November</option>
                <option value="12">Desember</option>
              </select>
            </label>
            <label>
              <span>Tahun</span>
              <select value={pickupYear} onChange={(event) => setPickupYear(event.target.value)}>
                <option value="">Semua tahun</option>
                {pickupYears.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            </label>
            <label>
              <span>Urutkan tanggal</span>
              <select value={pickupSort} onChange={(event) => setPickupSort(event.target.value as "newest" | "oldest")}>
                <option value="newest">Terbaru</option>
                <option value="oldest">Terlama</option>
              </select>
            </label>
            <button className="admin-request-reset" type="button" onClick={() => { setPickupSearch(""); setPickupMonth(""); setPickupYear(""); setPickupSort("newest"); setFilter("all"); }}>
              <Icon name="refresh-cw" size={14} /> Reset
            </button>
          </div>

          <div className="admin-filter-summary">Menampilkan <strong>{visiblePickups.length}</strong> dari {pickups.length} pengajuan pickup</div>
          <div className="admin-pickup-list">
            {visiblePickups.length ? visiblePickups.map((pickup) => (
              <article className="admin-pickup-card" key={pickup.id}>
                <div className="admin-pickup-main">
                  <div className="admin-pickup-title-row">
                    <div><span className={`status-pill status-${pickup.status}`}>{statusLabels[pickup.status]}</span><h3>{pickup.member}</h3><p className="muted">{pickup.email}</p></div>
                    <div className="admin-pickup-date">{formatDate(pickup.date)}<span>{pickup.time} WIB</span></div>
                  </div>
                  <div className="admin-pickup-details"><span><Icon name="map-pin" size={14} /> {pickup.location}</span><span>WhatsApp: {pickup.phone}</span><span>{pickup.verifiedPackages ?? (pickup.small + pickup.medium + pickup.large)} kemasan{pickup.verifiedPackages !== null ? " terverifikasi" : " diajukan"} · {(pickup.verifiedPoints ?? (pickup.small * 5 + pickup.medium * 10 + pickup.large * 15)).toLocaleString("id-ID")} poin</span></div>
                  <div className="admin-item-chips"><span>5–40 ml: {pickup.small} diajukan</span><span>50–100 ml: {pickup.medium} diajukan</span><span>200–500 ml: {pickup.large} diajukan</span></div>
                  {pickup.note ? <p className="admin-member-note">Catatan anggota: {pickup.note}</p> : null}
                  <small className="demo-reference-id">ID: {pickup.id} · {pickup.memberId ? "Dikirim melalui form member" : "Data contoh awal"}</small>
                </div>
                <div className={`admin-pickup-actions admin-pickup-actions-${pickup.status}`}>
                  {pickup.status === "pending" ? <>
                    <button className="btn admin-action-primary" type="button" onClick={() => updateStatus(pickup.id, "confirmed")}><Icon name="check-circle" size={15} /> Konfirmasi</button>
                    <button className="btn btn-outline admin-action-danger" type="button" onClick={() => updateStatus(pickup.id, "cancelled")}><Icon name="x-circle" size={15} /> Batalkan</button>
                  </> : null}
                  {pickup.status === "confirmed" ? <>
                    <form className="admin-verify-form" onSubmit={(event) => verifyPickup(event, pickup)}>
                      <strong>Jumlah kemasan yang lolos verifikasi</strong>
                      <label>5–40 ml<input name="small" type="number" min="0" step="1" defaultValue={pickup.small} required /></label>
                      <label>50–100 ml<input name="medium" type="number" min="0" step="1" defaultValue={pickup.medium} required /></label>
                      <label>200–500 ml<input name="large" type="number" min="0" step="1" defaultValue={pickup.large} required /></label>
                      <button className="btn admin-action-primary" type="submit"><Icon name="package-check" size={15} /> Verifikasi & beri poin</button>
                    </form>
                    <button className="btn btn-outline admin-action-danger" type="button" onClick={() => updateStatus(pickup.id, "cancelled")}><Icon name="x-circle" size={15} /> Batalkan</button>
                  </> : null}
                  {pickup.status === "completed" ? <span className="admin-complete-label"><Icon name="check-circle" size={16} /> Poin sudah diproses</span> : null}
                  {pickup.status === "cancelled" ? <span className="muted">Tidak ada tindakan lanjutan.</span> : null}
                </div>
              </article>
            )) : <div className="dashboard-empty">{pickups.length ? "Tidak ada pengajuan pickup yang cocok dengan pencarian atau filter tanggal." : "Belum ada pengajuan pada kategori ini."}</div>}
          </div>
          <p className="admin-data-note">Demo: pengajuan dan perubahan status tersimpan di browser ini agar tab Admin dan Member dapat tersinkron. Tekan Reset Demo untuk mengembalikan data awal.</p>
        </section>

        <section className="dashboard-card admin-redemption-workspace">
          <div className="admin-section-heading">
            <div>
              <div className="small-label"><Icon name="gift" size={14} /> REWARD MANAGEMENT</div>
              <h2>Permintaan penukaran hadiah</h2>
              <p className="muted">Persetujuan hanya langkah awal. Setelah itu atur pengambilan atau pengiriman, lalu tunggu konfirmasi penerimaan dari member.</p>
            </div>
            <div className="admin-mini-counts"><span>{redemptions.filter((item) => item.status === "pending").length} menunggu</span><span>{redemptions.filter((item) => item.status === "ready" || item.status === "shipped").length} menunggu diterima</span></div>
          </div>
          <div className="admin-request-tools admin-request-tools-rewards" aria-label="Pencarian dan filter tanggal penukaran hadiah">
            <label className="admin-request-search">
              <span><Icon name="search" size={15} /> Cari nomor pengajuan</span>
              <input type="search" value={redemptionSearch} onChange={(event) => setRedemptionSearch(event.target.value)} placeholder="Contoh: RDM-DEMO-..." />
            </label>
            <label>
              <span>Bulan</span>
              <select value={redemptionMonth} onChange={(event) => setRedemptionMonth(event.target.value)}>
                <option value="">Semua bulan</option>
                <option value="01">Januari</option>
                <option value="02">Februari</option>
                <option value="03">Maret</option>
                <option value="04">April</option>
                <option value="05">Mei</option>
                <option value="06">Juni</option>
                <option value="07">Juli</option>
                <option value="08">Agustus</option>
                <option value="09">September</option>
                <option value="10">Oktober</option>
                <option value="11">November</option>
                <option value="12">Desember</option>
              </select>
            </label>
            <label>
              <span>Tahun</span>
              <select value={redemptionYear} onChange={(event) => setRedemptionYear(event.target.value)}>
                <option value="">Semua tahun</option>
                {redemptionYears.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            </label>
            <label>
              <span>Urutkan tanggal</span>
              <select value={redemptionSort} onChange={(event) => setRedemptionSort(event.target.value as "newest" | "oldest")}>
                <option value="newest">Terbaru</option>
                <option value="oldest">Terlama</option>
              </select>
            </label>
            <button className="admin-request-reset" type="button" onClick={() => { setRedemptionSearch(""); setRedemptionMonth(""); setRedemptionYear(""); setRedemptionSort("newest"); }}>
              <Icon name="refresh-cw" size={14} /> Reset
            </button>
          </div>
          <div className="admin-filter-summary">Menampilkan <strong>{visibleRedemptions.length}</strong> dari {redemptions.length} permintaan hadiah</div>
          {visibleRedemptions.length ? <div className="admin-redemption-list">{visibleRedemptions.map((item) => (
            <article className="admin-redemption-row admin-redemption-row-detailed" key={item.id}>
              <span className="admin-redemption-icon"><Icon name="gift" size={19} /></span>
              <div className="admin-redemption-info">
                <strong>{item.rewardName}</strong>
                <span>{item.member} · {item.points.toLocaleString("id-ID")} SKINPoint · {item.date}</span>
                <small>ID: {item.id}</small>
                {item.status === "approved" ? <small className="admin-redemption-help">Sudah disetujui. Lengkapi instruksi penyerahan di bawah.</small> : null}
                {(item.status === "ready" || item.status === "shipped") ? <small className="admin-redemption-help">{item.status === "ready" ? "Siap diambil" : "Dikirim"}: {item.fulfillmentDetails} · Menunggu konfirmasi Beauty Bestie.</small> : null}
                {item.status === "rejected" ? <small className="admin-redemption-help">{item.adminMessage ?? "Permintaan ditolak."}</small> : null}
                {item.status === "received" ? <small className="admin-redemption-help admin-redemption-complete">Beauty Bestie sudah mengonfirmasi hadiah diterima. Penukaran selesai.</small> : null}
              </div>
              {item.status === "pending" ? (
                <div className="admin-redemption-actions">
                  <button className="btn admin-action-primary" type="button" onClick={() => processRedemption(item.id, item.memberId, "approved")}><Icon name="check-circle" size={14} /> Setujui</button>
                  <button className="btn btn-outline admin-action-danger" type="button" onClick={() => processRedemption(item.id, item.memberId, "rejected")}><Icon name="x-circle" size={14} /> Tolak</button>
                </div>
              ) : null}
              {item.status === "approved" ? (
                <form className="admin-redemption-fulfillment-form" onSubmit={(event) => setRedemptionFulfillment(event, item)}>
                  <label>Metode penyerahan<select name="method" defaultValue="pickup"><option value="pickup">Diambil langsung</option><option value="delivery">Dikirim ke alamat member</option></select></label>
                  <label>Detail untuk member<textarea name="details" rows={2} placeholder="Diambil: lokasi dan jadwal. Dikirim: nama kurir dan nomor resi/alamat konfirmasi." required /></label>
                  <button className="btn admin-action-primary" type="submit"><Icon name="package-check" size={14} /> Kirim instruksi hadiah</button>
                </form>
              ) : null}
              {(item.status === "ready" || item.status === "shipped") ? <span className="status-pill status-confirmed">Menunggu konfirmasi member</span> : null}
              {item.status === "received" ? <span className="status-pill status-completed">Diterima member</span> : null}
              {item.status === "rejected" ? <span className="status-pill status-cancelled">Ditolak</span> : null}
            </article>
          ))}</div> : <div className="dashboard-empty">{redemptions.length ? "Tidak ada pengajuan hadiah yang cocok dengan pencarian atau filter tanggal." : "Belum ada permintaan penukaran hadiah. Coba ajukan dari member area."}</div>}
        </section>

        <section className="dashboard-card admin-deletion-workspace">
          <div className="admin-section-heading">
            <div>
              <div className="small-label"><Icon name="shield-check" size={14} /> ACCOUNT MANAGEMENT</div>
              <h2>Pengajuan penghapusan akun</h2>
              <p className="muted">Tinjau alasan dari anggota. Persetujuan admin belum menghapus akun secara otomatis; verifikasi akhir tetap diperlukan.</p>
            </div>
            <div className="admin-mini-counts"><span>{pendingDeletionCount} menunggu peninjauan</span></div>
          </div>
          {deletionRequests.length ? (
            <div className="admin-deletion-list">
              {deletionRequests.map((request) => (
                <article className="admin-deletion-row" key={request.id}>
                  <span className="admin-deletion-avatar"><Icon name="users" size={18} /></span>
                  <div className="admin-deletion-info">
                    <strong>{request.member}</strong>
                    <span>{request.email} · {request.date}</span>
                    <p>{request.reason}</p>
                    <small>ID: {request.id}</small>
                    {request.adminMessage ? <small className="admin-deletion-message">{request.adminMessage}</small> : null}
                  </div>
                  {request.status === "pending" ? (
                    <div className="admin-deletion-actions">
                      <button className="btn admin-action-primary" type="button" onClick={() => reviewAccountDeletion(request.id, request.memberId, "approved")}><Icon name="check-circle" size={14} /> Setujui</button>
                      <button className="btn btn-outline admin-action-danger" type="button" onClick={() => reviewAccountDeletion(request.id, request.memberId, "rejected")}><Icon name="x-circle" size={14} /> Tolak</button>
                    </div>
                  ) : (
                    <span className={`status-pill ${request.status === "approved" ? "status-confirmed" : "status-cancelled"}`}>
                      {request.status === "approved" ? "Disetujui · verifikasi akhir" : "Ditolak"}
                    </span>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty">Belum ada pengajuan penghapusan akun dari anggota.</div>
          )}
        </section>

        <div className="admin-lower-grid">
          <section className="dashboard-card"><div className="small-label"><Icon name="users" size={14} /> ANGGOTA TERBARU</div><h2 className="admin-lower-title">Pengguna RE-SKIN</h2><div className="admin-member-list">{initialMembers.map((member) => <div className="admin-member-row" key={member.email}><span className="admin-avatar">{member.name.slice(0, 1)}</span><span className="admin-member-info"><strong>{member.name}</strong><small>{member.email} · {member.joined}</small></span><span className={`admin-role-tag ${member.role === "Admin" ? "admin-role-tag-admin" : ""}`}>{member.role}</span></div>)}</div></section>
          <section className="dashboard-card"><div className="small-label"><Icon name="gift" size={14} /> TRANSAKSI TERBARU</div><h2 className="admin-lower-title">Riwayat SKINPoint</h2><div className="admin-transaction-list">{transactions.slice(0, 8).map((transaction) => <div className="admin-transaction-row" key={transaction.id}><span className="admin-transaction-icon"><Icon name="gift" size={16} /></span><span className="admin-member-info"><strong>{transaction.member}</strong><small>{transaction.description} · {transaction.date}</small></span><strong className="points-positive">+{transaction.points.toLocaleString("id-ID")}</strong></div>)}</div></section>
        </div>

        <p className="member-footer-note">RE-SKIN Admin Preview · Data simulasi untuk evaluasi UI/UX.</p>
      </div>
    </main>
  );
}
