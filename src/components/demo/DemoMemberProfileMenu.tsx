"use client";

import Image from "next/image";
import { useMemo, useRef, useState, type FormEvent } from "react";
import { Icon } from "@/components/Icons";
import {
  DEMO_MEMBER_ID,
  publishDemoEvent,
  useDemoEvents,
  type AccountDeletionStatus,
} from "@/lib/demo-sync";

type DeletionRequestView = {
  id: string;
  reason: string;
  date: string;
  status: AccountDeletionStatus;
  adminMessage?: string;
};

function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export default function DemoMemberProfileMenu() {
  const events = useDemoEvents();
  const [open, setOpen] = useState(false);
  const [showRequest, setShowRequest] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [reason, setReason] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const latestRequest = useMemo<DeletionRequestView | null>(() => {
    const requests = events.filter((event) =>
      event.type === "account-deletion-requested" && event.request.memberId === DEMO_MEMBER_ID
    );
    const latest = requests[requests.length - 1];
    if (!latest || latest.type !== "account-deletion-requested") return null;
    const update = [...events].reverse().find((event) =>
      event.type === "account-deletion-status-updated" && event.requestId === latest.request.id
    );
    return {
      id: latest.request.id,
      reason: latest.request.reason,
      date: latest.request.date,
      status: update?.type === "account-deletion-status-updated" ? update.status : "pending",
      adminMessage: update?.type === "account-deletion-status-updated" ? update.adminMessage : undefined,
    };
  }, [events]);

  function logout() {
    setOpen(false);
    // Demo Mode has no authenticated session to revoke; return to the public landing page.
    window.location.assign("/");
  }

  function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanReason = reason.trim();
    if (cleanReason.length < 10) {
      setError("Jelaskan alasan minimal 10 karakter agar admin dapat meninjau permintaanmu.");
      return;
    }
    if (confirmation.trim().toUpperCase() !== "HAPUS AKUN") {
      setError('Ketik "HAPUS AKUN" sebagai konfirmasi.');
      return;
    }
    if (latestRequest?.status === "pending") {
      setError("Masih ada pengajuan yang menunggu peninjauan admin.");
      return;
    }

    const requestId = `DEL-DEMO-${Date.now().toString().slice(-7)}`;
    publishDemoEvent({
      type: "account-deletion-requested",
      request: {
        id: requestId,
        memberId: DEMO_MEMBER_ID,
        member: "Ayu Putri",
        email: "ayu.putri@reskin.demo",
        reason: cleanReason,
        date: todayISO(),
      },
    });
    setReason("");
    setConfirmation("");
    setError("");
    setShowRequest(false);
    setOpen(false);
  }

  const statusLabel = latestRequest?.status === "pending"
    ? "Menunggu peninjauan"
    : latestRequest?.status === "approved"
      ? "Disetujui · menunggu proses akhir"
      : latestRequest?.status === "rejected"
        ? "Ditolak · kamu dapat mengajukan kembali"
        : "";

  return (
    <>
      <div className="account-profile-wrap member-profile-wrap" ref={rootRef}>
        <button
          className={`account-profile-trigger${open ? " is-open" : ""}`}
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-label="Buka profil Beauty Bestie"
        >
          <Image src="/member-avatar.svg" alt="Foto profil Ayu Putri" width={42} height={42} className="account-profile-photo" priority />
          <span className="account-profile-trigger-copy">
            <strong>Ayu Putri</strong>
            <small>Beauty Bestie</small>
          </span>
          <span className="account-profile-chevron" />
        </button>
        {open ? (
          <section className="account-profile-popover" aria-label="Profil Beauty Bestie">
            <div className="account-profile-popover-head">
              <Image src="/member-avatar.svg" alt="" width={54} height={54} className="account-profile-photo account-profile-photo-large" />
              <div>
                <strong>Ayu Putri</strong>
                <span>ayu.putri@reskin.demo</span>
                <small><Icon name="sparkles" size={12} /> Beauty Bestie · Anggota</small>
              </div>
            </div>
            <div className="account-profile-details">
              <div><span>Status akun</span><strong><i className="account-active-dot" /> Aktif</strong></div>
              <div><span>Bergabung sejak</span><strong>19 Nov 2026</strong></div>
            </div>
            {latestRequest ? (
              <div className={`account-deletion-current status-${latestRequest.status}`}>
                <strong>Status pengajuan hapus akun</strong>
                <span>{statusLabel}</span>
                {latestRequest.adminMessage ? <small>{latestRequest.adminMessage}</small> : null}
              </div>
            ) : null}
            <div className={`account-settings-disclosure${showAccountSettings ? " is-open" : ""}`}>
              <button
                className="account-settings-toggle"
                type="button"
                aria-expanded={showAccountSettings}
                onClick={() => setShowAccountSettings((value) => !value)}
              >
                <span>
                  <Icon name="settings" size={15} />
                  <span>
                    <strong>Pengaturan akun &amp; privasi</strong>
                    <small>Kelola preferensi dan data akun</small>
                  </span>
                </span>
                <Icon name="chevron-down" size={15} />
              </button>
              {showAccountSettings ? (
                <div className="account-settings-content">
                  <p className="account-profile-demo-note">Pengajuan penghapusan tidak langsung menghapus akun. Admin akan meninjau dan menghubungimu untuk proses verifikasi.</p>
                  <button
                    className="account-profile-delete-link"
                    type="button"
                    onClick={() => { setShowRequest(true); setOpen(false); setError(""); }}
                    disabled={latestRequest?.status === "pending" || latestRequest?.status === "approved"}
                  >
                    <Icon name="x-circle" size={15} /> Ajukan penghapusan akun
                  </button>
                </div>
              ) : null}
            </div>
            <button className="account-profile-logout" type="button" onClick={logout}>
              <Icon name="log-out" size={16} /> Keluar dari akun
            </button>
          </section>
        ) : null}
      </div>

      {showRequest ? (
        <div className="account-modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setShowRequest(false);
        }}>
          <section className="account-modal" role="dialog" aria-modal="true" aria-labelledby="account-delete-title">
            <button className="account-modal-close" type="button" onClick={() => setShowRequest(false)} aria-label="Tutup"><Icon name="x" size={18} /></button>
            <div className="account-modal-symbol"><Icon name="alert-circle" size={25} /></div>
            <div className="small-label">PENGATURAN AKUN · RE-SKIN</div>
            <h2 id="account-delete-title">Ajukan penghapusan akun?</h2>
            <p>Permintaanmu akan dikirim kepada admin untuk ditinjau. Akun dan riwayat SKINPoint tidak langsung dihapus saat formulir dikirim.</p>
            <form onSubmit={submitRequest} className="account-delete-form">
              <label htmlFor="account-delete-reason">Alasan pengajuan</label>
              <textarea
                id="account-delete-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Ceritakan alasan kamu ingin menghapus akun..."
                required
              />
              <label htmlFor="account-delete-confirm">Konfirmasi tindakan</label>
              <input
                id="account-delete-confirm"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                placeholder="Ketik HAPUS AKUN"
                autoComplete="off"
                required
              />
              {error ? <p className="account-form-error">{error}</p> : null}
              <div className="account-modal-warning"><Icon name="info" size={15} /> Setelah admin menyetujui, proses penghapusan permanen tetap memerlukan verifikasi akhir.</div>
              <div className="account-modal-actions">
                <button className="btn btn-outline" type="button" onClick={() => setShowRequest(false)}>Batal</button>
                <button className="btn account-delete-submit" type="submit" disabled={confirmation.trim().toUpperCase() !== "HAPUS AKUN" || reason.trim().length < 10}>Kirim pengajuan</button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
