import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon } from "@/components/Icons";
import LiveNotificationCenter, { type LiveNotification } from "@/components/LiveNotificationCenter";
import LiveMemberProfileMenu from "@/components/LiveMemberProfileMenu";
import LivePickupRequestForm from "@/components/LivePickupRequestForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isDemoModeEnabled } from "@/lib/demo-mode";

export const dynamic = "force-dynamic";

export default async function MemberPickupPage() {
  if (isDemoModeEnabled()) redirect("/dashboard");

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/?auth=unavailable");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const [profileResult, notificationsResult] = await Promise.all([
    supabase.from("profiles").select("full_name,email,role,created_at,avatar_style").eq("id", user.id).maybeSingle(),
    supabase.from("notifications")
      .select("id,user_id,notification_type,title,message,entity_type,entity_id,target_path,is_read,created_at")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
  ]);

  const profile = profileResult.data;
  if (profile?.role === "admin") redirect("/admin");
  if (profile?.role !== "member") redirect("/");

  const name = profile.full_name || user.user_metadata?.full_name || user.email || "Beauty Bestie";
  const joinedAt = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
    : "Baru bergabung";
  const notifications = (notificationsResult.data ?? []) as LiveNotification[];

  return (
    <main className="dashboard-page member-dashboard-page pickup-request-page">
      <div className="dashboard-shell member-shell">
        <header className="dashboard-top">
          <Link className="brand admin-brand dashboard-brand" href="/dashboard" aria-label="Kembali ke dashboard member RE-SKIN">
            <Image src="/reskin-logo-black.png" alt="RE-SKIN" width={2048} height={582} className="dashboard-brand-logo" priority />
            <span className="member-brand-tag">MEMBER</span>
          </Link>
          <div className="admin-top-actions">
            <LiveNotificationCenter userId={user.id} role="member" initialNotifications={notifications} />
            <Link className="btn btn-outline" href="/dashboard"><Icon name="arrow-left" size={15} /> Dashboard</Link>
            <LiveMemberProfileMenu
              name={name}
              email={user.email ?? profile.email ?? ""}
              joinedAt={joinedAt}
              latestDeletion={null}
              avatarStyle={profile.avatar_style ?? user.user_metadata?.avatar_style ?? "female_hijab"}
            />
          </div>
        </header>

        <section className="pickup-page-heading">
          <div>
            <div className="small-label"><Icon name="sparkles" size={14} /> BEAUTY BESTIE PICKUP REQUEST</div>
            <h1 className="dashboard-title">Yuk, jadwalkan <span>pickup-mu!</span></h1>
            <p className="dashboard-subtitle">Pickup gratis untuk alamat yang masuk jangkauan layanan RE-SKIN, termasuk area kampus Universitas Trunodjoyo Madura (UTM). Isi detail kemasan dan lokasi penjemputan; Bestie Care akan membantu memastikan cakupan area serta mengonfirmasi jadwal melalui WhatsApp.</p>
          </div>
          <div className="pickup-heading-art" aria-hidden="true"><Icon name="recycle" size={58} /><span>EMPTY IS<br />NOT OVER</span></div>
        </section>

        <div className="pickup-request-layout">
          <section className="dashboard-card pickup-request-card">
            <LivePickupRequestForm memberName={name} memberEmail={user.email ?? profile.email ?? ""} />
          </section>
          <aside className="pickup-request-aside">
            <section className="dashboard-card pickup-aside-card">
              <span className="pickup-aside-icon"><Icon name="package-check" size={22} /></span>
              <h2>Bagaimana prosesnya?</h2>
              <ol>
                <li><strong>Ajukan pickup</strong><span>Isi jumlah kemasan, tanggal, jam, dan lokasi.</span></li>
                <li><strong>Tim RE-SKIN menerima pengajuan</strong><span>Data tersimpan di sistem. WhatsApp akan terbuka menuju chat Bestie Care dengan rincian pengajuan yang siap dikirim.</span></li>
                <li><strong>Tunggu konfirmasi</strong><span>Bestie Care membantu memastikan cakupan area dan mengonfirmasi jadwal pickup.</span></li>
                <li><strong>Verifikasi kemasan</strong><span>SKINPoint diberikan setelah jumlah dan kondisi kemasan diperiksa.</span></li>
              </ol>
            </section>
            <section className="pickup-aside-reminder">
              <Icon name="info" size={18} />
              <p><strong>Ingat, Beauty Bestie!</strong> Pastikan kemasan sudah kosong, bersih, dan aman ditangani. Jangan mengirim catatan jika memang tidak ada informasi tambahan.</p>
            </section>
          </aside>
        </div>
        <p className="member-footer-note">RE-SKIN · Beauty Bestie Member Area</p>
      </div>
    </main>
  );
}
