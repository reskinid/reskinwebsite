"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/Icons";
import { DEMO_MEMBER_ID, useDemoEvents, type DemoEvent, type RedemptionStatusEvent } from "@/lib/demo-sync";

type Role = "admin" | "member";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  time: string;
  icon: "package" | "gift" | "check-circle" | "info";
};

function makeNotification(event: DemoEvent, role: Role): NotificationItem | null {
  if (role === "admin") {
    if (event.type === "pickup-created") {
      const pickup = event.pickup;
      const noteText = pickup.note?.trim() ?? "";
      const note = noteText ? ` Catatan member: ${noteText}` : "";
      return {
        id: event.id,
        title: "Pengajuan pickup baru",
        message: `${pickup.member} · ${pickup.date} pukul ${pickup.time} · ${pickup.location}.${note}`,
        time: event.at,
        icon: "package",
      };
    }
    if (event.type === "redemption-requested") {
      return {
        id: event.id,
        title: "Permintaan tukar hadiah",
        message: `${event.redemption.member} ingin menukar ${event.redemption.rewardName}.`,
        time: event.at,
        icon: "gift",
      };
    }
    if (event.type === "redemption-status-updated" && event.status === "received") {
      return {
        id: event.id,
        title: "Hadiah dikonfirmasi diterima",
        message: `Beauty Bestie telah mengonfirmasi penerimaan hadiah. ID penukaran ${event.redemptionId}.`,
        time: event.at,
        icon: "check-circle",
      };
    }
    if (event.type === "account-deletion-requested") {
      return {
        id: event.id,
        title: "Pengajuan penghapusan akun",
        message: `${event.request.member} mengajukan penghapusan akun. Alasan: ${event.request.reason}`,
        time: event.at,
        icon: "info",
      };
    }
    if (event.type === "account-deletion-status-updated") {
      return {
        id: event.id,
        title: event.status === "approved" ? "Pengajuan hapus akun disetujui" : "Pengajuan hapus akun ditolak",
        message: `Permintaan ${event.requestId} telah ${event.status === "approved" ? "disetujui untuk proses verifikasi akhir" : "ditolak"}.`,
        time: event.at,
        icon: event.status === "approved" ? "check-circle" : "info",
      };
    }
    return null;
  }

  if (event.type === "pickup-created" && event.pickup.memberId === DEMO_MEMBER_ID) {
    return {
      id: event.id,
      title: "Pengajuan pickup terkirim",
      message: `Pengajuan ${event.pickup.id} sudah masuk ke daftar admin.`,
      time: event.at,
      icon: "package",
    };
  }
  if (event.type === "pickup-status-updated" && event.memberId === DEMO_MEMBER_ID) {
    const status = event.status === "confirmed" ? "dikonfirmasi admin" : event.status === "cancelled" ? "dibatalkan admin" : event.status;
    return {
      id: event.id,
      title: "Status pickup diperbarui",
      message: `Pickup ${event.pickupId} ${status}.${event.adminMessage ? ` Pesan admin: ${event.adminMessage}` : ""}`,
      time: event.at,
      icon: "info",
    };
  }
  if (event.type === "pickup-verified" && event.memberId === DEMO_MEMBER_ID) {
    return {
      id: event.id,
      title: "SKINPoint bertambah!",
      message: `${event.verifiedPackages} kemasan lolos verifikasi. +${event.verifiedPoints.toLocaleString("id-ID")} SKINPoint masuk ke saldo demo.`,
      time: event.at,
      icon: "check-circle",
    };
  }
  if (event.type === "redemption-requested" && event.redemption.memberId === DEMO_MEMBER_ID) {
    return {
      id: event.id,
      title: "Permintaan hadiah terkirim",
      message: `Penukaran ${event.redemption.rewardName} menunggu konfirmasi admin. Poin ditahan sementara.`,
      time: event.at,
      icon: "gift",
    };
  }
  if (event.type === "redemption-processed" && event.memberId === DEMO_MEMBER_ID) {
    return {
      id: event.id,
      title: event.status === "approved" ? "Penukaran disetujui" : "Penukaran belum disetujui",
      message: event.status === "approved"
        ? "Admin menyetujui permintaan hadiahmu. Hadiah sedang disiapkan."
        : "Admin menolak permintaan hadiah. Poin demo dikembalikan ke saldo.",
      time: event.at,
      icon: event.status === "approved" ? "check-circle" : "info",
    };
  }
  if (event.type === "account-deletion-requested" && event.request.memberId === DEMO_MEMBER_ID) {
    return {
      id: event.id,
      title: "Pengajuan penghapusan terkirim",
      message: `Permintaan ${event.request.id} telah dikirim ke admin untuk ditinjau. Akunmu belum dihapus.`,
      time: event.at,
      icon: "info",
    };
  }
  if (event.type === "account-deletion-status-updated" && event.memberId === DEMO_MEMBER_ID) {
    return {
      id: event.id,
      title: event.status === "approved" ? "Pengajuan hapus akun disetujui" : "Pengajuan hapus akun ditolak",
      message: event.adminMessage,
      time: event.at,
      icon: event.status === "approved" ? "check-circle" : "info",
    };
  }
  if (event.type === "redemption-status-updated" && event.memberId === DEMO_MEMBER_ID) {
    const statusMessages: Record<RedemptionStatusEvent["status"], { title: string; message: string; icon: NotificationItem["icon"] }> = {
      approved: { title: "Penukaran disetujui", message: "Admin menyetujui permintaanmu. Hadiah sedang disiapkan.", icon: "check-circle" },
      rejected: { title: "Penukaran belum disetujui", message: `Admin belum dapat memproses penukaran. ${event.adminMessage ?? "Poin dikembalikan ke saldo."}`, icon: "info" },
      ready: { title: "Hadiah siap diambil", message: `Hadiahmu siap diambil. ${event.fulfillmentDetails ?? "Silakan cek dashboard untuk detail."}`, icon: "gift" },
      shipped: { title: "Hadiah sedang dikirim", message: `Hadiahmu telah diserahkan ke proses pengiriman. ${event.fulfillmentDetails ?? "Silakan cek dashboard untuk detail."}`, icon: "package" },
      received: { title: "Penukaran selesai", message: "Konfirmasi penerimaan berhasil. Terima kasih sudah menjadi bagian dari RE-SKIN!", icon: "check-circle" },
    };
    const item = statusMessages[event.status];
    return { id: event.id, title: item.title, message: item.message, time: event.at, icon: item.icon };
  }
  return null;
}

function relativeTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Baru saja";
  return date.toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function DemoNotificationCenter({ role }: { role: Role }) {
  const events = useDemoEvents();
  const notificationWrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);
  const readKey = `reskin-demo-read-${role}-v1`;

  // Keep demo notifications dismissible on touch screens and keyboards too.
  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!notificationWrapRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    try {
      setReadIds(JSON.parse(window.localStorage.getItem(readKey) || "[]"));
    } catch {
      setReadIds([]);
    }
  }, [readKey]);

  useEffect(() => {
    const syncRead = (event: StorageEvent) => {
      if (event.key !== readKey) return;
      try {
        setReadIds(JSON.parse(event.newValue || "[]"));
      } catch {
        setReadIds([]);
      }
    };
    window.addEventListener("storage", syncRead);
    return () => window.removeEventListener("storage", syncRead);
  }, [readKey]);

  const notifications = useMemo(
    () => events.map((event) => makeNotification(event, role)).filter((item): item is NotificationItem => Boolean(item)).reverse(),
    [events, role],
  );
  const unreadCount = notifications.filter((item) => !readIds.includes(item.id)).length;

  function markAllRead() {
    const next = notifications.map((item) => item.id);
    setReadIds(next);
    try {
      window.localStorage.setItem(readKey, JSON.stringify(next));
    } catch {
      // Read state is a convenience in local demo mode.
    }
  }

  return (
    <div ref={notificationWrapRef} className={`demo-notification-wrap${open ? " is-open" : ""}`}>
      <button
        className={`demo-notification-trigger${unreadCount ? " has-unread" : ""}`}
        type="button"
        aria-label={`Notifikasi${unreadCount ? `, ${unreadCount} belum dibaca` : ""}`}
        aria-expanded={open}
        aria-controls={`notification-panel-${role}`}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name="bell" size={19} />
        {unreadCount > 0 ? <span className="demo-notification-count">{unreadCount > 9 ? "9+" : unreadCount}</span> : null}
      </button>

      {open ? (
        <div className="demo-notification-panel" id={`notification-panel-${role}`} role="region" aria-label="Panel notifikasi">
          <div className="demo-notification-heading">
            <div className="demo-notification-heading-copy"><strong>Notifikasi</strong><small>{unreadCount} belum dibaca</small></div>
            <div className="demo-notification-heading-actions">
              <button type="button" onClick={markAllRead} disabled={!unreadCount}>Tandai dibaca</button>
              <button className="demo-notification-close" type="button" onClick={() => setOpen(false)} aria-label="Tutup notifikasi">
                <Icon name="x" size={17} />
              </button>
            </div>
          </div>
          {notifications.length ? (
            <div className="demo-notification-list">
              {notifications.slice(0, 12).map((item) => {
                const isRead = readIds.includes(item.id);
                return (
                  <div className={`demo-notification-item${isRead ? " is-read" : " is-unread"}`} key={item.id}>
                    <span className="demo-notification-icon"><Icon name={item.icon} size={16} /></span>
                    <span className="demo-notification-copy">
                      <strong>{item.title}</strong>
                      <span>{item.message}</span>
                      <small>{relativeTime(item.time)}</small>
                    </span>
                    {!isRead ? <span className="demo-notification-unread-dot" /> : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="demo-notification-empty"><Icon name="bell" size={22} /><span>Belum ada notifikasi baru.</span></div>
          )}
          <div className="demo-notification-footnote">Notifikasi demo tersinkron antar-tab browser pada perangkat ini.</div>
        </div>
      ) : null}
    </div>
  );
}
