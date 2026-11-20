import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon } from "@/components/Icons";
import LiveNotificationCenter, { type LiveNotification } from "@/components/LiveNotificationCenter";
import LiveMemberProfileMenu from "@/components/LiveMemberProfileMenu";
import MemberRedeemButton from "@/components/MemberRedeemButton";
import { confirmRedemptionReceived } from "./actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import DemoMemberDashboard from "@/components/demo/DemoMemberDashboard";
import { isDemoModeEnabled } from "@/lib/demo-mode";

export const dynamic = "force-dynamic";

type PickupRow = {
  id: string;
  request_code: string;
  pickup_date: string;
  pickup_time: string;
  location: string;
  phone: string;
  note: string | null;
  status: string;
  total_packages: number;
  estimated_points: number;
  verified_total_packages: number | null;
  verified_points: number | null;
  created_at: string;
};
type TransactionRow = {
  id: string;
  points: number;
  transaction_type: string;
  status: string;
  description: string | null;
  created_at: string;
};
type RewardRow = {
  id: string;
  name: string;
  category: string;
  description: string;
  points_cost: number | null;
  stock: number;
  min_points: number;
  max_points: number;
  image_url: string | null;
};
type RedemptionRow = {
  id: string;
  request_code: string;
  reward_name: string;
  points_cost: number;
  status: string;
  fulfillment_method: string | null;
  fulfillment_details: string | null;
  admin_message: string | null;
  created_at: string;
};
type DeletionRow = {
  request_code: string;
  reason: string;
  status: string;
  admin_message: string | null;
  created_at: string;
};

const pickupStatusLabels: Record<string, string> = {
  pending: "Menunggu konfirmasi",
  confirmed: "Pickup dikonfirmasi",
  completed: "Selesai diverifikasi",
  cancelled: "Dibatalkan",
};
const redemptionStatusLabels: Record<string, string> = {
  pending: "Menunggu persetujuan",
  approved: "Disetujui · disiapkan",
  rejected: "Ditolak · poin kembali",
  ready: "Siap diambil",
  shipped: "Sedang dikirim",
  received: "Selesai · diterima",
};

function formatDate(value: string) {
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function rewardIcon(category: string): "sparkles" | "gift" | "shopping-bag" {
  const value = category.toLowerCase();
  if (value.includes("beauty") || value.includes("kosmetik")) return "shopping-bag";
  if (value.includes("aksesori")) return "gift";
  return "sparkles";
}

function rewardColor(index: number) {
  return ["pink", "lavender", "mint", "yellow"][index % 4];
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  if (isDemoModeEnabled()) return <DemoMemberDashboard />;

  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const [
    profileResult,
    pickupsResult,
    transactionsResult,
    balanceResult,
    rewardsResult,
    redemptionsResult,
    deletionResult,
    notificationsResult,
  ] = await Promise.all([
    supabase.from("profiles").select("full_name,email,role,created_at,avatar_style").eq("id", user.id).maybeSingle(),
    supabase.from("pickup_requests")
      .select("id,request_code,pickup_date,pickup_time,location,phone,note,status,total_packages,estimated_points,verified_total_packages,verified_points,created_at")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
    supabase.from("point_transactions")
      .select("id,points,transaction_type,status,description,created_at")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(30),
    supabase.rpc("get_my_point_balance"),
    supabase.from("rewards")
      .select("id,name,category,description,points_cost,stock,min_points,max_points,image_url")
      .eq("is_active", true).order("created_at", { ascending: true }),
    supabase.from("redemption_requests")
      .select("id,request_code,reward_name,points_cost,status,fulfillment_method,fulfillment_details,admin_message,created_at")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
    supabase.from("account_deletion_requests")
      .select("request_code,reason,status,admin_message,created_at")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(1),
    supabase.from("notifications")
      .select("id,user_id,notification_type,title,message,entity_type,entity_id,target_path,is_read,created_at")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
  ]);

  const profile = profileResult.data;
  if (profile?.role === "admin") redirect("/admin");

  const pickups = (pickupsResult.data ?? []) as PickupRow[];
  const transactions = (transactionsResult.data ?? []) as TransactionRow[];
  const rewards = (rewardsResult.data ?? []) as RewardRow[];
  const redemptions = (redemptionsResult.data ?? []) as RedemptionRow[];
  const latestDeletion = ((deletionResult.data ?? [])[0] ?? null) as DeletionRow | null;
  const notifications = (notificationsResult.data ?? []) as LiveNotification[];
  const pointBalance = Number(balanceResult.data ?? 0);
  const completedPickups = pickups.filter((pickup) => pickup.status === "completed");
  const totalPackages = completedPickups.reduce(
    (total, pickup) => total + Number(pickup.verified_total_packages ?? 0),
    0,
  );
  const activePickups = pickups.filter((pickup) => ["pending", "confirmed"].includes(pickup.status)).length;
  const name = profile?.full_name || user.user_metadata?.full_name || user.email || "Beauty Bestie";
  const firstName = String(name).trim().split(/\s+/)[0] || "Beauty Bestie";
  const joinedAt = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
    : "Baru bergabung";

  return (
    <main className="dashboard-page member-dashboard-page">
      <div className="dashboard-shell member-shell">
        <header className="dashboard-top">
          <Link className="brand admin-brand" href="/" aria-label="Kembali ke beranda RE-SKIN">
            <span className="brand-mark"><Icon name="recycle" size={20} /></span>
            <span>RE-SKIN</span>
            <span className="member-brand-tag">MEMBER</span>
          </Link>
          <div className="admin-top-actions">
            <LiveNotificationCenter userId={user.id} role="member" initialNotifications={notifications} />
            <Link className="btn btn-outline" href="/"><Icon name="arrow-left" size={15} /> Beranda</Link>
            <LiveMemberProfileMenu
              name={name}
              email={user.email ?? profile?.email ?? ""}
              joinedAt={joinedAt}
              latestDeletion={latestDeletion}
              avatarStyle={profile?.avatar_style ?? user.user_metadata?.avatar_style ?? "female_hijab"}
            />
          </div>
        </header>

        <section className="member-welcome-card">
          <div>
            <div className="small-label"><Icon name="sparkles" size={14} /> MEMBER AREA · RE-SKIN</div>
            <h1 className="dashboard-title">Hai, Beauty Bestie!</h1>
            <p className="dashboard-subtitle">
              Welcome back, {firstName}! Pantau SKINPoint, perjalanan pickup, dan hadiah favoritmu di satu tempat.
            </p>
            <div className="demo-member-meta">
              <span><Icon name="mail" size={14} /> {user.email}</span>
              <span><Icon name="shield-check" size={14} /> Akun terhubung</span>
            </div>
            <div className="member-welcome-actions">
              <Link className="btn btn-dark" href="/dashboard/pickup"><Icon name="package-check" size={15} /> Ajukan Pickup <Icon name="arrow-up-right" size={15} /></Link>
              <Link className="btn btn-outline" href="#reward-corner">Lihat hadiah <Icon name="gift" size={15} /></Link>
            </div>
          </div>
          <div className="member-welcome-art" aria-hidden="true">
            <Icon name="recycle" size={76} />
            <span>GIVE YOUR<br />PACKAGING<br />A SECOND LIFE</span>
          </div>
        </section>

        {params.notice === "redemption-received" ? (
          <div className="dashboard-alert success"><Icon name="check-circle" size={15} /> Penerimaan hadiah berhasil dikonfirmasi. Terima kasih, Beauty Bestie!</div>
        ) : null}
        {params.error === "redemption-confirm-failed" ? (
          <div className="dashboard-alert error">Konfirmasi penerimaan belum berhasil. Silakan muat ulang dan coba kembali.</div>
        ) : null}

        <section className="dashboard-grid member-stat-grid" aria-label="Ringkasan akun">
          <article className="dashboard-card member-stat-card member-points-card">
            <div className="small-label"><Icon name="gift" size={14} /> SALDO SKINPOINT</div>
            <strong>{pointBalance.toLocaleString("id-ID")}</strong>
            <p className="muted">Poin tersedia untuk ditukarkan.</p>
          </article>
          <article className="dashboard-card member-stat-card">
            <div className="small-label"><Icon name="package-check" size={14} /> KEMASAN DISETORKAN</div>
            <strong>{totalPackages.toLocaleString("id-ID")}</strong>
            <p className="muted">Jumlah kemasan yang lolos verifikasi.</p>
          </article>
          <article className="dashboard-card member-stat-card">
            <div className="small-label"><Icon name="clock" size={14} /> PICKUP BERJALAN</div>
            <strong>{activePickups.toLocaleString("id-ID")}</strong>
            <p className="muted">Pengajuan yang menunggu atau telah dikonfirmasi.</p>
          </article>
        </section>

        <div className="member-content-grid">
          <section className="dashboard-card member-history-card">
            <div className="member-section-heading">
              <div><div className="small-label"><Icon name="calendar-clock" size={14} /> AKTIVITAS KAMU</div><h2>Riwayat pickup</h2></div>
              <Link className="btn btn-outline" href="/dashboard/pickup">Ajukan pickup</Link>
            </div>
            {pickups.length ? (
              <div className="member-pickup-list">
                {pickups.map((pickup) => (
                  <article id={`pickup-${pickup.id}`} className="member-pickup-row notification-target" key={pickup.id}>
                    <span className={`member-pickup-icon status-icon-${pickup.status}`}><Icon name="package-check" size={19} /></span>
                    <div className="member-pickup-info">
                      <div className="member-pickup-title">
                        <strong>{formatDate(pickup.pickup_date)}</strong>
                        <span className={`status-pill status-${pickup.status}`}>{pickupStatusLabels[pickup.status] ?? pickup.status}</span>
                      </div>
                      <p><Icon name="map-pin" size={13} /> {pickup.location}</p>
                      <small>{String(pickup.pickup_time).slice(0, 5)} WIB · {pickup.verified_total_packages ?? pickup.total_packages} kemasan · {pickup.verified_points !== null ? `${Number(pickup.verified_points).toLocaleString("id-ID")} poin terverifikasi` : `estimasi ${Number(pickup.estimated_points).toLocaleString("id-ID")} poin`} · {pickup.request_code}</small>
                      {pickup.note ? <small className="member-pickup-note">Catatanmu: {pickup.note}</small> : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="dashboard-empty">Belum ada pengajuan pickup. Mulai kumpulkan kemasan kosongmu dan ajukan penjemputan.</div>
            )}
          </section>

          <section className="dashboard-card member-points-history-card">
            <div className="small-label"><Icon name="gift" size={14} /> PERGERAKAN POIN</div>
            <h2>Riwayat SKINPoint</h2>
            {transactions.length ? (
              <div className="member-transaction-list">
                {transactions.map((transaction) => (
                  <div className="member-transaction-row" key={transaction.id}>
                    <span>
                      <strong>{transaction.description || (transaction.transaction_type === "earned" ? "Poin kemasan" : transaction.transaction_type === "redeemed" ? "Penukaran hadiah" : "Penyesuaian poin")}</strong>
                      <small>{new Date(transaction.created_at).toLocaleDateString("id-ID")} · {transaction.status === "approved" ? "Disetujui" : transaction.status === "pending" ? "Menunggu" : "Ditolak"}</small>
                    </span>
                    <strong className={Number(transaction.points) >= 0 ? "points-positive" : "points-negative"}>
                      {Number(transaction.points) > 0 ? "+" : ""}{Number(transaction.points).toLocaleString("id-ID")}
                    </strong>
                  </div>
                ))}
              </div>
            ) : (
              <div className="dashboard-empty">Belum ada transaksi SKINPoint. Poin akan muncul setelah kemasan diverifikasi admin.</div>
            )}
            <div className="member-account-note"><Icon name="check-circle" size={15} /> Akun terhubung dengan {user.email}</div>
          </section>
        </div>

        <section className="dashboard-card member-reward-center" id="reward-corner">
          <div className="member-reward-heading">
            <div>
              <div className="small-label"><Icon name="sparkles" size={14} /> REWARD CORNER · BEAUTY BESTIE</div>
              <h2>Hadiah yang bisa kamu tukarkan</h2>
              <p className="muted">Pilih hadiah favoritmu dan gunakan SKINPoint yang sudah terkumpul.</p>
            </div>
            <div className="member-reward-balance"><small>POIN TERSEDIA</small><strong>{pointBalance.toLocaleString("id-ID")} <span>pts</span></strong></div>
          </div>
          {rewards.length ? (
            <div className="member-reward-grid">
              {rewards.map((reward, index) => (
                <article className={`member-reward-card reward-${rewardColor(index)}`} key={reward.id}>
                  <div className="member-reward-visual"><Icon name={rewardIcon(reward.category)} size={34} /></div>
                  <div className="member-reward-copy"><span>{reward.category}</span><h3>{reward.name}</h3><p>{reward.description}</p></div>
                  <div className="member-reward-price">
                    <strong>{reward.points_cost ? reward.points_cost.toLocaleString("id-ID") : "Belum ditetapkan"} <small>{reward.points_cost ? "pts" : ""}</small></strong>
                    <span>{reward.stock > 0 ? `Stok tersedia: ${reward.stock}` : "Stok belum tersedia"}</span>
                  </div>
                  <MemberRedeemButton
                    rewardId={reward.id}
                    rewardName={reward.name}
                    pointsCost={reward.points_cost}
                    stock={reward.stock}
                    balance={pointBalance}
                    memberName={name}
                    memberEmail={user.email ?? ""}
                  />
                </article>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty">
              Katalog hadiah belum tersedia. Admin sedang menyiapkan harga poin dan stok sebelum hadiah dapat ditukarkan.
            </div>
          )}
          <p className="member-reward-note">SKINPoint akan ditahan saat pengajuan penukaran dikirim. Jika admin menolak, poin dikembalikan ke saldo secara otomatis.</p>
        </section>

        <section className="dashboard-card member-redemption-section">
          <div className="small-label"><Icon name="gift" size={14} /> PENUKARAN KAMU</div>
          <h2>Riwayat penukaran hadiah</h2>
          {redemptions.length ? (
            <div className="member-redemption-list">
              {redemptions.map((item) => (
                <article id={`redemption-${item.id}`} className="member-redemption-row member-redemption-row-detailed notification-target" key={item.id}>
                  <span className="member-redemption-icon"><Icon name="gift" size={18} /></span>
                  <span className="member-redemption-copy">
                    <strong>{item.reward_name}</strong>
                    <small>{item.points_cost.toLocaleString("id-ID")} SKINPoint · {formatDate(item.created_at)} · {item.request_code}</small>
                  </span>
                  <span className={`status-pill ${item.status === "received" ? "status-completed" : item.status === "rejected" ? "status-cancelled" : item.status === "pending" ? "status-pending" : "status-confirmed"}`}>
                    {redemptionStatusLabels[item.status] ?? item.status}
                  </span>
                  {item.status === "approved" ? <p className="member-redemption-guidance">Permintaan disetujui. Admin sedang menyiapkan hadiah. Detail pengambilan atau pengiriman akan muncul di sini.</p> : null}
                  {item.status === "rejected" ? <p className="member-redemption-guidance">{item.admin_message ?? "Penukaran belum dapat diproses. Poin telah dikembalikan ke saldo."}</p> : null}
                  {(item.status === "ready" || item.status === "shipped") ? (
                    <div className="member-redemption-fulfillment">
                      <strong>{item.status === "ready" ? "Instruksi pengambilan" : "Informasi pengiriman"}</strong>
                      <p>{item.fulfillment_details}</p>
                      <form action={confirmRedemptionReceived}>
                        <input type="hidden" name="redemptionId" value={item.id} />
                        <button className="btn admin-action-primary" type="submit"><Icon name="check-circle" size={15} /> Saya Sudah Menerima Hadiah</button>
                      </form>
                      <small>Tekan setelah hadiah benar-benar kamu terima.</small>
                    </div>
                  ) : null}
                  {item.status === "received" ? <p className="member-redemption-guidance success-text">Penerimaan hadiah sudah kamu konfirmasi. Penukaran selesai. Terima kasih, Beauty Bestie!</p> : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty">Belum ada penukaran hadiah. Hadiah akan muncul di sini setelah kamu mengajukan penukaran.</div>
          )}
        </section>

        <div className="demo-member-bottom">
          <div><strong>Beauty Bestie, setiap empties punya kesempatan kedua!</strong><span>Terus kumpulkan SKINPoint dan bantu bumi lebih bersih.</span></div>
          <Link className="btn btn-dark" href="/#katalog-hadiah">Lihat katalog hadiah <Icon name="arrow-up-right" size={16} /></Link>
        </div>
        <p className="member-footer-note">RE-SKIN · Beauty Bestie Member Area</p>
      </div>
    </main>
  );
}
