"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, type IconName } from "@/components/Icons";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type LiveNotification = {
  id: string;
  user_id: string;
  notification_type: string;
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: string | null;
  target_path: string;
  is_read: boolean;
  created_at: string;
};

type NotificationFilter = "all" | "activity" | "updates";
type UserRole = "admin" | "member";

function notificationIcon(type: string): IconName {
  if (type.includes("pickup")) return "package";
  if (type.includes("redemption")) return "gift";
  if (type.includes("account_deletion")) return "shield-check";
  return "info";
}

function notificationCategory(item: LiveNotification) {
  const type = item.notification_type.toLowerCase();
  const isUpdate = type.includes("updated") || type.includes("received") || type.includes("reviewed");
  const topic = item.entity_type === "pickup_request"
    ? "Pickup"
    : item.entity_type === "redemption_request"
      ? "Hadiah"
      : item.entity_type === "account_deletion_request"
        ? "Akun"
        : "Informasi";

  return {
    group: isUpdate ? "updates" as const : "activity" as const,
    label: isUpdate ? "Pembaruan status" : "Aktivitas baru",
    topic,
  };
}

function notificationTargetPath(item: LiveNotification, role: UserRole) {
  // Prefer entity-aware deep links so the user lands on the exact request, not only the dashboard.
  if (item.entity_id) {
    if (item.entity_type === "pickup_request") {
      return `${role === "admin" ? "/admin" : "/dashboard"}#pickup-${item.entity_id}`;
    }
    if (item.entity_type === "redemption_request") {
      return `${role === "admin" ? "/admin" : "/dashboard"}#redemption-${item.entity_id}`;
    }
    if (item.entity_type === "account_deletion_request") {
      return role === "admin"
        ? `/admin#account-deletion-${item.entity_id}`
        : "/dashboard#account-profile";
    }
  }

  // Only allow internal application paths from the notification row.
  const fallback = item.target_path || (role === "admin" ? "/admin" : "/dashboard");
  return fallback.startsWith("/") && !fallback.startsWith("//")
    ? fallback
    : role === "admin" ? "/admin" : "/dashboard";
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Baru saja";
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LiveNotificationCenter({
  userId,
  role,
  initialNotifications,
}: {
  userId: string;
  role: UserRole;
  initialNotifications: LiveNotification[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [notifications, setNotifications] = useState(initialNotifications);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    setNotifications(initialNotifications);
  }, [initialNotifications]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase || !userId) return;

    const channel = supabase
      .channel(`reskin-notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const incoming = payload.new as LiveNotification;
          setNotifications((current) => [
            incoming,
            ...current.filter((item) => item.id !== incoming.id),
          ].slice(0, 100));
          router.refresh();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as LiveNotification;
          setNotifications((current) =>
            current.map((item) => item.id === updated.id ? updated : item),
          );
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, router]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications],
  );

  const filteredNotifications = useMemo(() => {
    if (filter === "all") return notifications;
    return notifications.filter((item) => notificationCategory(item).group === filter);
  }, [filter, notifications]);

  async function markRead(id: string) {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return false;
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("user_id", userId)
      .eq("is_read", false);
    if (!error) {
      setNotifications((current) =>
        current.map((item) => item.id === id ? { ...item, is_read: true } : item),
      );
      return true;
    }
    return false;
  }

  async function markAllRead() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase || unreadCount === 0 || markingAll) return;
    setMarkingAll(true);
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    if (!error) {
      setNotifications((current) => current.map((item) => ({ ...item, is_read: true })));
    }
    setMarkingAll(false);
  }

  async function openItem(item: LiveNotification) {
    if (!item.is_read) await markRead(item.id);
    setOpen(false);
    if (role === "member" && item.entity_type === "account_deletion_request") {
      window.dispatchEvent(new Event("reskin:open-account-settings"));
    }
    router.push(notificationTargetPath(item, role));
  }

  return (
    <div className="demo-notification-wrap live-notification-wrap">
      <button
        className={`demo-notification-trigger${unreadCount ? " has-unread" : ""}`}
        type="button"
        aria-label={`Notifikasi${unreadCount ? `, ${unreadCount} belum dibaca` : ""}`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name="bell" size={19} />
        {unreadCount > 0 ? <span className="demo-notification-count">{unreadCount > 9 ? "9+" : unreadCount}</span> : null}
      </button>

      {open ? (
        <div className="demo-notification-panel">
          <div className="demo-notification-heading">
            <div><strong>Notifikasi</strong><small>{unreadCount} belum dibaca · {notifications.length} riwayat terbaru</small></div>
            <button type="button" onClick={markAllRead} disabled={!unreadCount || markingAll}>
              {markingAll ? "Menyimpan..." : "Tandai semua dibaca"}
            </button>
          </div>

          <div className="demo-notification-filters" role="tablist" aria-label="Filter notifikasi">
            <button type="button" role="tab" aria-selected={filter === "all"} className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>Semua</button>
            <button type="button" role="tab" aria-selected={filter === "activity"} className={filter === "activity" ? "active" : ""} onClick={() => setFilter("activity")}>Aktivitas</button>
            <button type="button" role="tab" aria-selected={filter === "updates"} className={filter === "updates" ? "active" : ""} onClick={() => setFilter("updates")}>Pembaruan status</button>
          </div>

          {filteredNotifications.length ? (
            <div className="demo-notification-list">
              {filteredNotifications.map((item) => {
                const category = notificationCategory(item);
                return (
                  <button
                    className={`demo-notification-item${item.is_read ? " is-read" : " is-unread"}`}
                    key={item.id}
                    type="button"
                    onClick={() => void openItem(item)}
                  >
                    <span className="demo-notification-icon"><Icon name={notificationIcon(item.notification_type)} size={16} /></span>
                    <span className="demo-notification-copy">
                      <small className={`demo-notification-kind ${category.group === "updates" ? "is-update" : "is-activity"}`}>
                        {category.label} · {category.topic}
                      </small>
                      <strong>{item.title}</strong>
                      <span>{item.message}</span>
                      <small className="demo-notification-time">{formatTime(item.created_at)}</small>
                    </span>
                    {!item.is_read ? <span className="demo-notification-unread-dot" /> : null}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="demo-notification-empty"><Icon name="bell" size={22} /><span>{filter === "all" ? "Belum ada notifikasi." : filter === "activity" ? "Belum ada aktivitas baru." : "Belum ada pembaruan status."}</span></div>
          )}
          <div className="demo-notification-footnote">Riwayat notifikasi tetap tersimpan di akun RE-SKIN. Klik notifikasi untuk membuka pengajuan terkait.</div>
        </div>
      ) : null}
    </div>
  );
}
