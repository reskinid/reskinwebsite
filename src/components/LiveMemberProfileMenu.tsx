"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icons";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { submitAccountDeletionRequest } from "@/app/dashboard/actions";
import { getMemberAvatarPath } from "@/lib/avatar";

type DeletionView = {
  request_code: string;
  reason: string;
  status: string;
  admin_message: string | null;
  created_at: string;
} | null;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export default function LiveMemberProfileMenu({
  name, email, joinedAt, latestDeletion, avatarStyle = "female_hijab",
}: {
  name: string;
  email: string;
  joinedAt: string;
  latestDeletion: DeletionView;
  avatarStyle?: string;
}) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showRequest, setShowRequest] = useState(false);
  const [reason, setReason] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    function openProfileFromHash() {
      if (window.location.hash === "#account-profile") {
        setOpen(true);
        setShowSettings(true);
        requestAnimationFrame(() => rootRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
      }
    }
    function openProfileFromNotification() {
      setOpen(true);
      setShowSettings(true);
      requestAnimationFrame(() => rootRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
    }
    openProfileFromHash();
    window.addEventListener("hashchange", openProfileFromHash);
    window.addEventListener("reskin:open-account-settings", openProfileFromNotification);
    return () => {
      window.removeEventListener("hashchange", openProfileFromHash);
      window.removeEventListener("reskin:open-account-settings", openProfileFromNotification);
    };
  }, []);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setShowRequest(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const avatarSrc = getMemberAvatarPath(avatarStyle);
  const deletionPending = latestDeletion?.status === "pending" || latestDeletion?.status === "approved";
  const deletionStatus = latestDeletion?.status === "pending"
    ? "Menunggu peninjauan admin"
    : latestDeletion?.status === "approved"
      ? "Disetujui · menunggu verifikasi akhir"
      : latestDeletion?.status === "rejected"
        ? "Ditolak · kamu dapat mengajukan kembali"
        : "";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    const formData = new FormData(event.currentTarget);
    setPending(true);
    void (async () => {
      try {
        const result = await submitAccountDeletionRequest(formData);
        if (!result.ok) {
          setError(result.message);
          return;
        }
        setSuccess(result.message);
        setReason("");
        setConfirmation("");
        setShowRequest(false);
        setShowSettings(false);
        setOpen(false);
        router.refresh();
      } finally {
        setPending(false);
      }
    })();
  }

  async function logout() {
    const supabase = createSupabaseBrowserClient();
    if (supabase) await supabase.auth.signOut();
    window.location.assign("/");
  }

  return (
    <>
      <div id="account-profile" className="account-profile-wrap member-profile-wrap notification-target" ref={rootRef}>
        <button
          className={`account-profile-trigger${open ? " is-open" : ""}`}
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-label="Buka profil Beauty Bestie"
        >
          <Image src={avatarSrc} alt="" width={42} height={42} className="account-profile-photo" priority />
          <span className="account-profile-trigger-copy"><strong>{name}</strong><small>Beauty Bestie</small></span>
          <span className="account-profile-chevron" />
        </button>
        {open ? (
          <section className="account-profile-popover" aria-label="Profil Beauty Bestie">
            <div className="account-profile-popover-head">
              <Image src={avatarSrc} alt="" width={54} height={54} className="account-profile-photo account-profile-photo-large" />
              <div><strong>{name}</strong><span>{email}</span><small><Icon name="sparkles" size={12} /> Beauty Bestie · Anggota</small></div>
            </div>
            <div className="account-profile-details">
              <div><span>Status akun</span><strong><i className="account-active-dot" /> Aktif</strong></div>
              <div><span>Bergabung sejak</span><strong>{joinedAt}</strong></div>
            </div>
            {latestDeletion ? (
              <div className={`account-deletion-current status-${latestDeletion.status}`}>
                <strong>Status pengajuan hapus akun</strong>
                <span>{deletionStatus}</span>
                <small>{latestDeletion.request_code} · {formatDate(latestDeletion.created_at)}</small>
                {latestDeletion.admin_message ? <small>{latestDeletion.admin_message}</small> : null}
              </div>
            ) : null}
            <div className={`account-settings-disclosure${showSettings ? " is-open" : ""}`}>
              <button className="account-settings-toggle" type="button" aria-expanded={showSettings} onClick={() => setShowSettings((value) => !value)}>
                <span><Icon name="settings" size={15} /><span><strong>Pengaturan akun &amp; privasi</strong><small>Kelola preferensi dan data akun</small></span></span>
                <Icon name="chevron-down" size={15} />
              </button>
              {showSettings ? (
                <div className="account-settings-content">
                  <p className="account-profile-demo-note">Pengajuan penghapusan tidak langsung menghapus akun. Admin akan meninjau dan menghubungimu untuk proses verifikasi.</p>
                  <button className="account-profile-delete-link" type="button" onClick={() => { setShowRequest(true); setOpen(false); setError(""); setSuccess(""); }} disabled={deletionPending}>
                    <Icon name="x-circle" size={15} /> Ajukan penghapusan akun
                  </button>
                </div>
              ) : null}
            </div>
            <button className="account-profile-logout" type="button" onClick={logout}><Icon name="log-out" size={16} /> Keluar dari akun</button>
          </section>
        ) : null}
      </div>

      {success ? <p className="dashboard-alert success member-profile-feedback">{success}</p> : null}

      {showRequest ? (
        <div className="account-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowRequest(false); }}>
          <section className="account-modal" role="dialog" aria-modal="true" aria-labelledby="account-delete-title">
            <button className="account-modal-close" type="button" onClick={() => setShowRequest(false)} aria-label="Tutup"><Icon name="x" size={18} /></button>
            <div className="account-modal-symbol"><Icon name="alert-circle" size={25} /></div>
            <div className="small-label">PENGATURAN AKUN · RE-SKIN</div>
            <h2 id="account-delete-title">Ajukan penghapusan akun?</h2>
            <p>Permintaanmu akan dikirim kepada admin untuk ditinjau. Akun dan riwayat SKINPoint tidak langsung dihapus saat formulir dikirim.</p>
            <form onSubmit={handleSubmit} className="account-delete-form">
              <label htmlFor="account-delete-reason">Alasan pengajuan</label>
              <textarea id="account-delete-reason" name="reason" value={reason} onChange={(event) => setReason(event.target.value)} rows={3} maxLength={500} placeholder="Ceritakan alasan kamu ingin menghapus akun..." required />
              <label htmlFor="account-delete-confirm">Konfirmasi tindakan</label>
              <input id="account-delete-confirm" name="confirmation" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Ketik HAPUS AKUN" autoComplete="off" required />
              {error ? <p className="account-form-error">{error}</p> : null}
              <div className="account-modal-warning"><Icon name="info" size={15} /> Persetujuan admin belum menghapus akun secara permanen. Verifikasi akhir tetap diperlukan.</div>
              <div className="account-modal-actions">
                <button className="btn btn-outline" type="button" onClick={() => setShowRequest(false)}>Batal</button>
                <button className="btn account-delete-submit" type="submit" disabled={pending || confirmation.trim().toUpperCase() !== "HAPUS AKUN" || reason.trim().length < 10}>{pending ? "Mengirim..." : "Kirim pengajuan"}</button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
