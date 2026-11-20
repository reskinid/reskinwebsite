"use client";

import { useEffect, useState } from "react";

export const DEMO_MEMBER_ID = "demo-member-ayu";
const STORAGE_KEY = "reskin-demo-events-v1";
const LOCAL_EVENT = "reskin-demo-events-updated";
const CHANNEL_NAME = "reskin-demo-live-channel";

export type DemoPickupStatus = "pending" | "confirmed" | "completed" | "cancelled";
export type RedemptionStatus = "pending" | "approved" | "rejected" | "ready" | "shipped" | "received";
export type RedemptionFulfillmentMethod = "pickup" | "delivery";
export type AccountDeletionStatus = "pending" | "approved" | "rejected";

export type DemoAccountDeletionRequest = {
  id: string;
  memberId: string;
  member: string;
  email: string;
  reason: string;
  date: string;
};

export type DemoPickup = {
  id: string;
  memberId: string;
  member: string;
  email: string;
  date: string;
  time: string;
  location: string;
  phone: string;
  note: string;
  status: DemoPickupStatus;
  small: number;
  medium: number;
  large: number;
  verifiedPackages: number | null;
  verifiedPoints: number | null;
};

export type DemoRedemption = {
  id: string;
  memberId: string;
  member: string;
  rewardId: string;
  rewardName: string;
  points: number;
  date: string;
};

export type RedemptionStatusEvent = {
  type: "redemption-status-updated";
  redemptionId: string;
  memberId: string;
  status: Exclude<RedemptionStatus, "pending">;
  fulfillmentMethod?: RedemptionFulfillmentMethod;
  fulfillmentDetails?: string;
  adminMessage?: string;
};

type DemoEventPayload =
  | { type: "pickup-created"; pickup: DemoPickup }
  | { type: "pickup-status-updated"; pickupId: string; memberId: string; status: DemoPickupStatus; adminMessage?: string }
  | {
      type: "pickup-verified";
      pickupId: string;
      memberId: string;
      small: number;
      medium: number;
      large: number;
      verifiedPackages: number;
      verifiedPoints: number;
    }
  | { type: "redemption-requested"; redemption: DemoRedemption }
  | RedemptionStatusEvent
  | { type: "account-deletion-requested"; request: DemoAccountDeletionRequest }
  | { type: "account-deletion-status-updated"; requestId: string; memberId: string; status: Exclude<AccountDeletionStatus, "pending">; adminMessage: string }
  // Kept only so an old open demo tab/event from V2 can still be read safely.
  | { type: "redemption-processed"; redemptionId: string; memberId: string; status: "approved" | "rejected" };

export type DemoEvent = DemoEventPayload & {
  id: string;
  at: string;
};

function readEvents(): DemoEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];

    // V2 created a fake pickup with a hard-coded note, address and phone.
    // Drop that synthetic record so it is never presented as member-submitted data.
    const cleaned = (parsed as DemoEvent[]).filter((event) => !(
      event.type === "pickup-created" &&
      event.pickup?.id?.startsWith("RSK-DEMO-") &&
      event.pickup?.note === "Pengajuan pickup dari member area demo."
    ));
    if (cleaned.length !== parsed.length) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch {
    return [];
  }
}

function notifyTabs() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(LOCAL_EVENT));
  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({ type: "refresh" });
    channel.close();
  }
}

export function publishDemoEvent(payload: DemoEventPayload) {
  if (typeof window === "undefined") return;
  const event = {
    ...payload,
    id: `demo-event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
  } as DemoEvent;

  const events = readEvents();
  events.push(event);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-150)));
  } catch {
    // The in-memory event still notifies the current tab if storage is unavailable.
  }
  notifyTabs();
}

export function resetDemoEvents() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage restrictions in local preview.
  }
  notifyTabs();
}

export function useDemoEvents() {
  const [events, setEvents] = useState<DemoEvent[]>([]);

  useEffect(() => {
    const refresh = () => setEvents(readEvents());
    refresh();

    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) refresh();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(LOCAL_EVENT, refresh);

    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.addEventListener("message", refresh);
    }

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(LOCAL_EVENT, refresh);
      channel?.removeEventListener("message", refresh);
      channel?.close();
    };
  }, []);

  return events;
}
