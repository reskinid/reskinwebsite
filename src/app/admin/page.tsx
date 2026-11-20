import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon } from "@/components/Icons";
import AdminProfileMenu from "@/components/AdminProfileMenu";
import LiveNotificationCenter, { type LiveNotification } from "@/components/LiveNotificationCenter";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  completePickup,
  updatePickupStatus,
  reviewRedemption,
  setRedemptionFulfillment,
  reviewAccountDeletion,
} from "./actions";
import DemoAdminDashboard from "@/components/demo/DemoAdminDashboard";
import { isDemoModeEnabled } from "@/lib/demo-mode";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  status?: string; notice?: string; error?: string; q?: string; month?: string; year?: string; sort?: string;
  rq?: string; rmonth?: string; ryear?: string; rsort?: string;
}>;
type ProfileRow = { id: string; full_name: string | null; email: string | null; role: string; created_at: string };
type PickupRow = {
  id: string;
  request_code: string;
  user_id: string;
  pickup_date: string;
  pickup_time: string;
  location: string;
  phone: string;
  note: string | null;
  total_packages: number;
  estimated_points: number;
  verified_total_packages: number | null;
  verified_points: number | null;
  status: string;
  created_at: string;
};
type TransactionRow = {
  id: string;
  user_id: string;
  pickup_request_id: string | null;
  points: number;
  transaction_type: string;
  status: string;
  description: string | null;
  created_at: string;
};
type PickupItemRow = { pickup_request_id: string; size_band: string; quantity: number; verified_quantity: number | null };
type RedemptionRow = {
  id: string;
  request_code: string;
  user_id: string;
  reward_name: string;
  points_cost: number;
  status: string;
  fulfillment_method: string | null;
  fulfillment_details: string | null;
  admin_message: string | null;
  created_at: string;
};
type DeletionRow = {
  id: string;
  request_code: string;
  user_id: string | null;
  reason: string;
  status: string;
  admin_message: string | null;
  created_at: string;
};


const statusLabels: Record<string, string> = {
  pending: "Menunggu",
  confirmed: "Dikonfirmasi",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

const monthOptions = [
  ["01", "Januari"], ["02", "Februari"], ["03", "Maret"], ["04", "April"],
  ["05", "Mei"], ["06", "Juni"], ["07", "Juli"], ["08", "Agustus"],
  ["09", "September"], ["10", "Oktober"], ["11", "November"], ["12", "Desember"],
] as const;

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function AdminDashboardPage({ searchParams }: { searchParams: SearchParams }) {
  if (isDemoModeEnabled()) return <DemoAdminDashboard />;

  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("full_name,role")
    .eq("id", user.id)
    .maybeSingle();

  if (adminProfile?.role !== "admin") redirect("/dashboard");

  const [profilesResult, pickupsResult, transactionsResult, pointTotalResult, redemptionsResult, deletionsResult, notificationsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,full_name,email,role,created_at")
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("pickup_requests")
      .select("id,request_code,user_id,pickup_date,pickup_time,location,phone,note,total_packages,estimated_points,verified_total_packages,verified_points,status,created_at")
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("point_transactions")
      .select("id,user_id,pickup_request_id,points,transaction_type,status,description,created_at")
      .order("created_at", { ascending: false })
      .limit(500),
    supabase.rpc("admin_get_approved_point_total"),
    supabase.from("redemption_requests")
      .select("id,request_code,user_id,reward_name,points_cost,status,fulfillment_method,fulfillment_details,admin_message,created_at")
      .order("created_at", { ascending: false }).limit(500),
    supabase.from("account_deletion_requests")
      .select("id,request_code,user_id,reason,status,admin_message,created_at")
      .order("created_at", { ascending: false }).limit(300),
    supabase.from("notifications")
      .select("id,user_id,notification_type,title,message,entity_type,entity_id,target_path,is_read,created_at")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
  ]);

  const profiles = (profilesResult.data ?? []) as ProfileRow[];
  const pickups = (pickupsResult.data ?? []) as PickupRow[];
  const transactions = (transactionsResult.data ?? []) as TransactionRow[];
  const redemptions = (redemptionsResult.data ?? []) as RedemptionRow[];
  const deletions = (deletionsResult.data ?? []) as DeletionRow[];
  const notifications = (notificationsResult.data ?? []) as LiveNotification[];
  const pickupIds = pickups.map((pickup) => pickup.id);
  const pickupItemsResult = pickupIds.length
    ? await supabase
        .from("pickup_items")
        .select("pickup_request_id,size_band,quantity,verified_quantity")
        .in("pickup_request_id", pickupIds)
    : { data: [] as PickupItemRow[] };
  const pickupItems = (pickupItemsResult.data ?? []) as PickupItemRow[];

  const profileById = new Map<string, ProfileRow>(profiles.map((profile) => [profile.id, profile]));
  const itemsByPickup = new Map<string, { size_band: string; quantity: number; verified_quantity: number | null }[]>();
  for (const item of pickupItems) {
    const current = itemsByPickup.get(item.pickup_request_id) ?? [];
    current.push({ size_band: item.size_band, quantity: item.quantity, verified_quantity: item.verified_quantity });
    itemsByPickup.set(item.pickup_request_id, current);
  }

  const memberCount = profiles.filter((profile) => profile.role !== "admin").length;
  const pendingPickupCount = pickups.filter((pickup) => pickup.status === "pending").length;
  const pendingRedemptionCount = redemptions.filter((item) => item.status === "pending").length;
  const pendingDeletionCount = deletions.filter((item) => item.status === "pending").length;
  const pendingCount = pendingPickupCount + pendingRedemptionCount + pendingDeletionCount;
  const confirmedCount = pickups.filter((pickup) => pickup.status === "confirmed").length;
  const completedCount = pickups.filter((pickup) => pickup.status === "completed").length;
  const distributedPoints = Number(pointTotalResult.data ?? 0);
  const filter = ["pending", "confirmed", "completed", "cancelled"].includes(params.status ?? "")
    ? (params.status ?? "all")
    : "all";
  const searchQuery = (params.q ?? "").trim().toLowerCase();
  const selectedMonth = /^([0][1-9]|1[0-2])$/.test(params.month ?? "") ? params.month! : "";
  const selectedYear = /^20\d{2}$/.test(params.year ?? "") ? params.year! : "";
  const dateSort = params.sort === "oldest" ? "oldest" : "newest";
  const visiblePickups = pickups
    .filter((pickup) => filter === "all" || pickup.status === filter)
    .filter((pickup) => !searchQuery || pickup.request_code.toLowerCase().includes(searchQuery))
    .filter((pickup) => !selectedMonth || pickup.pickup_date.slice(5, 7) === selectedMonth)
    .filter((pickup) => !selectedYear || pickup.pickup_date.slice(0, 4) === selectedYear)
    .sort((a, b) => {
      const aDate = `${a.pickup_date}T${String(a.pickup_time).slice(0, 5)}`;
      const bDate = `${b.pickup_date}T${String(b.pickup_time).slice(0, 5)}`;
      return dateSort === "newest" ? bDate.localeCompare(aDate) : aDate.localeCompare(bDate);
    });
  const availableYears = Array.from(new Set(pickups.map((pickup) => pickup.pickup_date.slice(0, 4)))).filter(Boolean).sort((a, b) => b.localeCompare(a));
  const redemptionSearch = (params.rq ?? "").trim().toLowerCase();
  const redemptionMonth = /^([0][1-9]|1[0-2])$/.test(params.rmonth ?? "") ? params.rmonth! : "";
  const redemptionYear = /^20\d{2}$/.test(params.ryear ?? "") ? params.ryear! : "";
  const redemptionSort = params.rsort === "oldest" ? "oldest" : "newest";
  const redemptionYears = Array.from(new Set(redemptions.map((item) => item.created_at.slice(0, 4)))).sort((a, b) => b.localeCompare(a));
  const visibleRedemptions = redemptions
    .filter((item) => !redemptionSearch || item.request_code.toLowerCase().includes(redemptionSearch))
    .filter((item) => !redemptionMonth || item.created_at.slice(5, 7) === redemptionMonth)
    .filter((item) => !redemptionYear || item.created_at.slice(0, 4) === redemptionYear)
    .sort((a, b) => redemptionSort === "newest" ? b.created_at.localeCompare(a.created_at) : a.created_at.localeCompare(b.created_at));
  const buildAdminHref = (nextStatus: string, preserveFilters = true) => {
    const query = new URLSearchParams();
    if (nextStatus !== "all") query.set("status", nextStatus);
    if (preserveFilters && params.q) query.set("q", params.q);
    if (preserveFilters && selectedMonth) query.set("month", selectedMonth);
    if (preserveFilters && selectedYear) query.set("year", selectedYear);
    if (preserveFilters && dateSort !== "newest") query.set("sort", dateSort);
    const value = query.toString();
    return value ? `/admin?${value}` : "/admin";
  };

  const noticeText: Record<string, string> = {
    "pickup-confirmed": "Pengajuan pickup berhasil dikonfirmasi.",
    "pickup-cancelled": "Pengajuan pickup berhasil dibatalkan.",
    "pickup-completed": "Pickup selesai diverifikasi dan SKINPoint telah dicatat.",
    "redemption-reviewed": "Keputusan penukaran hadiah berhasil disimpan.",
    "fulfillment-sent": "Instruksi pengambilan/pengiriman hadiah berhasil dikirim ke member.",
    "deletion-reviewed": "Keputusan pengajuan penghapusan akun berhasil disimpan.",
  };
  const errorText: Record<string, string> = {
    "invalid-action": "Permintaan tidak valid. Silakan muat ulang halaman.",
    "update-failed": "Status pickup tidak dapat diperbarui. Periksa status dan hak akses database.",
    "verification-failed": "Verifikasi gagal. Pastikan pickup sudah dikonfirmasi dan rincian kemasan valid.",
    "invalid-verification": "Jumlah kemasan terverifikasi harus berupa bilangan bulat nol atau lebih.",
    "empty-verification": "Masukkan minimal satu kemasan yang berhasil diverifikasi.",
    "redemption-review-failed": "Penukaran tidak dapat diproses. Periksa status pengajuan.",
    "invalid-fulfillment": "Lengkapi metode dan detail penyerahan hadiah.",
    "fulfillment-failed": "Instruksi hadiah belum berhasil disimpan.",
    "deletion-review-failed": "Pengajuan penghapusan akun tidak dapat diproses.",
  };

  return (
    <main className="dashboard-page admin-dashboard-page">
      <div className="dashboard-shell admin-shell">
        <header className="dashboard-top admin-topbar">
          <Link className="brand admin-brand dashboard-brand" href="/" aria-label="Kembali ke beranda RE-SKIN">
            <Image src="/reskin-logo-black.png" alt="RE-SKIN" width={2048} height={582} className="dashboard-brand-logo" priority />
            <span className="admin-brand-tag">ADMIN</span>
          </Link>
          <div className="admin-top-actions">
            <LiveNotificationCenter userId={user.id} role="admin" initialNotifications={notifications} />
            <Link className="btn btn-outline" href="/"><Icon name="arrow-left" size={15} /> Beranda</Link>
            <AdminProfileMenu name={adminProfile.full_name || user.email || "Admin RE-SKIN"} email={user.email || ""} role="Administrator" joinedAt={new Date(user.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })} />
          </div>
        </header>

        <div className="admin-heading-row">
          <div>
            <div className="small-label"><Icon name="shield-check" size={14} /> ADMIN CONTROL CENTER</div>
            <h1 className="dashboard-title">Dashboard Admin</h1>
            <p className="dashboard-subtitle">
              Selamat datang, {adminProfile.full_name || user.email}. Kelola penjemputan, verifikasi kemasan, anggota, dan distribusi SKINPoint.
            </p>
          </div>
          <div className="admin-secure-note"><Icon name="shield-check" size={17} /> Akses terbatas untuk admin</div>
        </div>

        {params.notice && noticeText[params.notice] ? <div className="dashboard-alert success">{noticeText[params.notice]}</div> : null}
        {params.error && errorText[params.error] ? <div className="dashboard-alert error">{errorText[params.error]}</div> : null}

        <section className="dashboard-grid admin-stat-grid" aria-label="Ringkasan RE-SKIN">
          <article className="dashboard-card admin-stat-card">
            <div className="small-label"><Icon name="users" size={14} /> TOTAL ANGGOTA</div>
            <strong>{memberCount.toLocaleString("id-ID")}</strong>
            <p className="muted">Akun yang terdaftar di RE-SKIN.</p>
          </article>
          <article className="dashboard-card admin-stat-card">
            <div className="small-label"><Icon name="clock" size={14} /> MENUNGGU TINDAKAN</div>
            <strong>{pendingCount.toLocaleString("id-ID")}</strong>
            <p className="muted">Pengajuan yang belum diproses.</p>
          </article>
          <article className="dashboard-card admin-stat-card">
            <div className="small-label"><Icon name="package-check" size={14} /> PICKUP SELESAI</div>
            <strong>{completedCount.toLocaleString("id-ID")}</strong>
            <p className="muted">Total pengajuan yang diverifikasi selesai.</p>
          </article>
          <article className="dashboard-card admin-stat-card">
            <div className="small-label"><Icon name="gift" size={14} /> SKINPOINT TERCATAT</div>
            <strong>{distributedPoints.toLocaleString("id-ID")}</strong>
            <p className="muted">Akumulasi transaksi poin berstatus disetujui.</p>
          </article>
        </section>

        <section className="dashboard-card admin-workspace-card">
          <div className="admin-section-heading">
            <div>
              <div className="small-label"><Icon name="dashboard" size={14} /> OPERASIONAL</div>
              <h2>Kelola pengajuan pickup</h2>
              <p className="muted">Konfirmasi jadwal, batalkan pengajuan, atau verifikasi kemasan setelah diterima.</p>
            </div>
            <div className="admin-mini-counts">
              <span>{pendingPickupCount} menunggu</span>
              <span>{confirmedCount} dikonfirmasi</span>
            </div>
          </div>

          <nav className="admin-filter-tabs" aria-label="Filter status pickup">
            {[{ value: "all", label: "Semua" }, { value: "pending", label: "Menunggu" }, { value: "confirmed", label: "Dikonfirmasi" }, { value: "completed", label: "Selesai" }, { value: "cancelled", label: "Dibatalkan" }].map((tab) => (
              <Link key={tab.value} className={filter === tab.value ? "active" : ""} href={buildAdminHref(tab.value)}>
                {tab.label}
              </Link>
            ))}
          </nav>

          <form className="admin-request-tools" method="get" action="/admin" aria-label="Pencarian dan filter tanggal pickup">
            {filter !== "all" ? <input type="hidden" name="status" value={filter} /> : null}
            <label className="admin-request-search">
              <span><Icon name="search" size={15} /> Cari nomor pengajuan</span>
              <input type="search" name="q" defaultValue={params.q ?? ""} placeholder="Contoh: RSK-26021" />
            </label>
            <label>
              <span>Bulan</span>
              <select name="month" defaultValue={selectedMonth}>
                <option value="">Semua bulan</option>
                {monthOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label>
              <span>Tahun</span>
              <select name="year" defaultValue={selectedYear}>
                <option value="">Semua tahun</option>
                {availableYears.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            </label>
            <label>
              <span>Urutkan tanggal</span>
              <select name="sort" defaultValue={dateSort}>
                <option value="newest">Terbaru</option>
                <option value="oldest">Terlama</option>
              </select>
            </label>
            <button className="admin-request-apply" type="submit"><Icon name="search" size={14} /> Terapkan</button>
            <Link className="admin-request-reset" href={buildAdminHref(filter, false)}><Icon name="refresh-cw" size={14} /> Reset</Link>
          </form>

          <div className="admin-filter-summary">Menampilkan <strong>{visiblePickups.length}</strong> dari {pickups.length} pengajuan pickup</div>
          <div className="admin-pickup-list">
            {visiblePickups.length ? visiblePickups.map((pickup) => {
              const member = profileById.get(pickup.user_id);
              const items = itemsByPickup.get(pickup.id) ?? [];
              return (
                <article id={`pickup-${pickup.id}`} className="admin-pickup-card notification-target" key={pickup.id}>
                  <div className="admin-pickup-main">
                    <div className="admin-pickup-title-row">
                      <div>
                        <span className={`status-pill status-${pickup.status}`}>{statusLabels[pickup.status] ?? pickup.status}</span>
                        <h3>{member?.full_name || member?.email || "Anggota RE-SKIN"}</h3>
                        <p className="muted">{member?.email || "Email tidak tersedia"}</p>
                      </div>
                      <div className="admin-pickup-date">{formatDate(pickup.pickup_date)}<span>{String(pickup.pickup_time).slice(0, 5)} WIB</span></div>
                    </div>
                    <div className="admin-pickup-details">
                      <span><Icon name="map-pin" size={14} /> {pickup.location}</span>
                      <span>WhatsApp: {pickup.phone}</span>
                      <span>{pickup.verified_total_packages ?? pickup.total_packages} kemasan{pickup.verified_total_packages !== null ? " terverifikasi" : " diajukan"} · {Number(pickup.verified_points ?? pickup.estimated_points).toLocaleString("id-ID")} poin</span>
                      <small>Nomor pengajuan: {pickup.request_code}</small>
                    </div>
                    <div className="admin-item-chips">
                      {items.length ? items.map((item) => (
                        <span key={`${pickup.id}-${item.size_band}`}>{item.size_band}: {item.quantity} diajukan{item.verified_quantity !== null ? ` · ${item.verified_quantity} lolos` : ""}</span>
                      )) : <span>Rincian kemasan belum tersedia</span>}
                    </div>
                    {pickup.note ? <p className="admin-member-note">Catatan anggota: {pickup.note}</p> : null}
                  </div>
                  <div className={`admin-pickup-actions admin-pickup-actions-${pickup.status}`}>
                    {pickup.status === "pending" ? (
                      <>
                        <form action={updatePickupStatus}><input type="hidden" name="pickupId" value={pickup.id} /><input type="hidden" name="status" value="confirmed" /><button className="btn admin-action-primary" type="submit"><Icon name="check-circle" size={15} /> Konfirmasi</button></form>
                        <form action={updatePickupStatus}><input type="hidden" name="pickupId" value={pickup.id} /><input type="hidden" name="status" value="cancelled" /><button className="btn btn-outline admin-action-danger" type="submit"><Icon name="x-circle" size={15} /> Batalkan</button></form>
                      </>
                    ) : null}
                    {pickup.status === "confirmed" ? (
                      <>
                        <form action={completePickup} className="admin-verify-form">
                          <input type="hidden" name="pickupId" value={pickup.id} />
                          <strong>Jumlah kemasan yang lolos verifikasi</strong>
                          {[{ band: "5-40ml", name: "smallQuantity", label: "5–40 ml", fallback: 0 }, { band: "50-100ml", name: "mediumQuantity", label: "50–100 ml", fallback: 0 }, { band: "200-500ml", name: "largeQuantity", label: "200–500 ml", fallback: 0 }].map((field) => (
                            <label key={field.name}>{field.label}<input name={field.name} type="number" min="0" step="1" defaultValue={items.find((item) => item.size_band === field.band)?.quantity ?? field.fallback} required /></label>
                          ))}
                          <button className="btn admin-action-primary" type="submit"><Icon name="package-check" size={15} /> Verifikasi selesai & beri poin</button>
                        </form>
                        <form action={updatePickupStatus}><input type="hidden" name="pickupId" value={pickup.id} /><input type="hidden" name="status" value="cancelled" /><button className="btn btn-outline admin-action-danger" type="submit"><Icon name="x-circle" size={15} /> Batalkan</button></form>
                      </>
                    ) : null}
                    {pickup.status === "completed" ? <span className="admin-complete-label"><Icon name="check-circle" size={16} /> Poin sudah diproses</span> : null}
                    {pickup.status === "cancelled" ? <span className="muted">Tidak ada tindakan lanjutan.</span> : null}
                  </div>
                </article>
              );
            }) : <div className="dashboard-empty">Belum ada pengajuan pada kategori ini.</div>}
          </div>
          <p className="admin-data-note">Menampilkan maksimal 500 pengajuan terbaru. Poin hanya diberikan setelah admin menyelesaikan verifikasi.</p>
        </section>

        <section className="dashboard-card admin-redemption-workspace">
          <div className="admin-section-heading">
            <div>
              <div className="small-label"><Icon name="gift" size={14} /> REWARD MANAGEMENT</div>
              <h2>Permintaan penukaran hadiah</h2>
              <p className="muted">Setujui atau tolak pengajuan. Jika disetujui, isi instruksi pengambilan/pengiriman dan tunggu konfirmasi penerimaan dari Beauty Bestie.</p>
            </div>
            <div className="admin-mini-counts">
              <span>{pendingRedemptionCount} menunggu</span>
              <span>{redemptions.filter((item) => item.status === "ready" || item.status === "shipped").length} menunggu diterima</span>
            </div>
          </div>
          <form className="admin-request-tools admin-request-tools-rewards" method="get" action="/admin" aria-label="Pencarian dan filter tanggal penukaran hadiah">
            {filter !== "all" ? <input type="hidden" name="status" value={filter} /> : null}
            {params.q ? <input type="hidden" name="q" value={params.q} /> : null}
            {selectedMonth ? <input type="hidden" name="month" value={selectedMonth} /> : null}
            {selectedYear ? <input type="hidden" name="year" value={selectedYear} /> : null}
            {dateSort !== "newest" ? <input type="hidden" name="sort" value={dateSort} /> : null}
            <label className="admin-request-search">
              <span><Icon name="search" size={15} /> Cari nomor penukaran</span>
              <input type="search" name="rq" defaultValue={params.rq ?? ""} placeholder="Contoh: RDM-2611-000001" />
            </label>
            <label><span>Bulan</span><select name="rmonth" defaultValue={redemptionMonth}>
              <option value="">Semua bulan</option>
              {monthOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select></label>
            <label><span>Tahun</span><select name="ryear" defaultValue={redemptionYear}>
              <option value="">Semua tahun</option>
              {redemptionYears.map((year) => <option key={year} value={year}>{year}</option>)}
            </select></label>
            <label><span>Urutkan tanggal</span><select name="rsort" defaultValue={redemptionSort}>
              <option value="newest">Terbaru</option><option value="oldest">Terlama</option>
            </select></label>
            <button className="admin-request-apply" type="submit"><Icon name="search" size={14} /> Terapkan</button>
            <Link className="admin-request-reset" href="/admin"><Icon name="refresh-cw" size={14} /> Reset filter</Link>
          </form>
          <div className="admin-filter-summary">Menampilkan <strong>{visibleRedemptions.length}</strong> dari {redemptions.length} permintaan hadiah</div>
          {visibleRedemptions.length ? (
            <div className="admin-redemption-list">
              {visibleRedemptions.map((item) => {
                const member = profileById.get(item.user_id);
                return (
                  <article id={`redemption-${item.id}`} className="admin-redemption-row admin-redemption-row-detailed notification-target" key={item.id}>
                    <span className="admin-redemption-icon"><Icon name="gift" size={19} /></span>
                    <div className="admin-redemption-info">
                      <strong>{item.reward_name}</strong>
                      <span>{member?.full_name || member?.email || "Beauty Bestie"} · {item.points_cost.toLocaleString("id-ID")} SKINPoint · {new Date(item.created_at).toLocaleDateString("id-ID")}</span>
                      <small>Nomor pengajuan: {item.request_code}</small>
                      {item.status === "approved" ? <small className="admin-redemption-help">Disetujui. Lengkapi instruksi penyerahan di bawah.</small> : null}
                      {(item.status === "ready" || item.status === "shipped") ? <small className="admin-redemption-help">{item.status === "ready" ? "Siap diambil" : "Sedang dikirim"}: {item.fulfillment_details} · Menunggu konfirmasi Beauty Bestie.</small> : null}
                      {item.status === "rejected" ? <small className="admin-redemption-help">{item.admin_message || "Permintaan ditolak."}</small> : null}
                      {item.status === "received" ? <small className="admin-redemption-help admin-redemption-complete">Beauty Bestie sudah mengonfirmasi hadiah diterima. Penukaran selesai.</small> : null}
                    </div>
                    {item.status === "pending" ? (
                      <div className="admin-redemption-actions">
                        <form action={reviewRedemption}>
                          <input type="hidden" name="redemptionId" value={item.id} />
                          <input type="hidden" name="decision" value="approved" />
                          <button className="btn admin-action-primary" type="submit"><Icon name="check-circle" size={14} /> Setujui</button>
                        </form>
                        <form action={reviewRedemption}>
                          <input type="hidden" name="redemptionId" value={item.id} />
                          <input type="hidden" name="decision" value="rejected" />
                          <button className="btn btn-outline admin-action-danger" type="submit"><Icon name="x-circle" size={14} /> Tolak</button>
                        </form>
                      </div>
                    ) : null}
                    {item.status === "approved" ? (
                      <form className="admin-redemption-fulfillment-form" action={setRedemptionFulfillment}>
                        <input type="hidden" name="redemptionId" value={item.id} />
                        <label>Metode penyerahan<select name="method" defaultValue="pickup"><option value="pickup">Diambil langsung</option><option value="delivery">Dikirim ke alamat member</option></select></label>
                        <label>Detail untuk member<textarea name="details" rows={2} placeholder="Lokasi dan jadwal pengambilan, atau detail kurir dan pengiriman." required /></label>
                        <button className="btn admin-action-primary" type="submit"><Icon name="package-check" size={14} /> Kirim instruksi hadiah</button>
                      </form>
                    ) : null}
                    {(item.status === "ready" || item.status === "shipped") ? <span className="status-pill status-confirmed">Menunggu konfirmasi member</span> : null}
                    {item.status === "received" ? <span className="status-pill status-completed">Diterima member</span> : null}
                    {item.status === "rejected" ? <span className="status-pill status-cancelled">Ditolak</span> : null}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="dashboard-empty">{redemptions.length ? "Tidak ada permintaan yang cocok dengan filter." : "Belum ada permintaan penukaran hadiah."}</div>
          )}
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
          {deletions.length ? (
            <div className="admin-deletion-list">
              {deletions.map((request) => {
                const member = request.user_id ? profileById.get(request.user_id) : undefined;
                return (
                  <article id={`account-deletion-${request.id}`} className="admin-deletion-row notification-target" key={request.id}>
                    <span className="admin-deletion-avatar"><Icon name="users" size={18} /></span>
                    <div className="admin-deletion-info">
                      <strong>{member?.full_name || member?.email || "Akun member"}</strong>
                      <span>{member?.email || "Email tidak tersedia"} · {new Date(request.created_at).toLocaleDateString("id-ID")}</span>
                      <p>{request.reason}</p>
                      <small>Nomor pengajuan: {request.request_code}</small>
                      {request.admin_message ? <small className="admin-deletion-message">{request.admin_message}</small> : null}
                    </div>
                    {request.status === "pending" ? (
                      <div className="admin-deletion-actions">
                        <form action={reviewAccountDeletion}>
                          <input type="hidden" name="requestId" value={request.id} />
                          <input type="hidden" name="decision" value="approved" />
                          <button className="btn admin-action-primary" type="submit"><Icon name="check-circle" size={14} /> Setujui</button>
                        </form>
                        <form action={reviewAccountDeletion}>
                          <input type="hidden" name="requestId" value={request.id} />
                          <input type="hidden" name="decision" value="rejected" />
                          <button className="btn btn-outline admin-action-danger" type="submit"><Icon name="x-circle" size={14} /> Tolak</button>
                        </form>
                      </div>
                    ) : (
                      <span className={`status-pill ${request.status === "approved" ? "status-confirmed" : "status-cancelled"}`}>
                        {request.status === "approved" ? "Disetujui · verifikasi akhir" : "Ditolak"}
                      </span>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="dashboard-empty">Belum ada pengajuan penghapusan akun dari anggota.</div>
          )}
        </section>

        <div className="admin-lower-grid">
          <section className="dashboard-card">
            <div className="small-label"><Icon name="users" size={14} /> ANGGOTA TERBARU</div>
            <h2 className="admin-lower-title">Pengguna RE-SKIN</h2>
            {profiles.length ? <div className="admin-member-list">{profiles.slice(0, 8).map((profile) => (
              <div className="admin-member-row" key={profile.id}>
                <span className="admin-avatar">{(profile.full_name || profile.email || "R").slice(0, 1).toUpperCase()}</span>
                <span className="admin-member-info"><strong>{profile.full_name || "Nama belum diisi"}</strong><small>{profile.email}</small></span>
                <span className={`admin-role-tag ${profile.role === "admin" ? "admin-role-tag-admin" : ""}`}>{profile.role === "admin" ? "Admin" : "Anggota"}</span>
              </div>
            ))}</div> : <div className="dashboard-empty">Belum ada anggota.</div>}
          </section>
          <section className="dashboard-card">
            <div className="small-label"><Icon name="gift" size={14} /> TRANSAKSI TERBARU</div>
            <h2 className="admin-lower-title">Riwayat SKINPoint</h2>
            {transactions.length ? <div className="admin-transaction-list">{transactions.slice(0, 8).map((transaction) => {
              const member = profileById.get(transaction.user_id);
              return <div className="admin-transaction-row" key={transaction.id}>
                <span className="admin-transaction-icon"><Icon name="gift" size={16} /></span>
                <span className="admin-member-info"><strong>{member?.full_name || member?.email || "Anggota"}</strong><small>{transaction.description || transaction.transaction_type} · {new Date(transaction.created_at).toLocaleDateString("id-ID")}</small></span>
                <strong className={Number(transaction.points) >= 0 ? "points-positive" : "points-negative"}>{Number(transaction.points) > 0 ? "+" : ""}{Number(transaction.points).toLocaleString("id-ID")}</strong>
              </div>;
            })}</div> : <div className="dashboard-empty">Belum ada transaksi poin.</div>}
          </section>
        </div>
      </div>
    </main>
  );
}
