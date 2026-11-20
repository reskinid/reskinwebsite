"use client";

/**
 * WhatsApp click-to-chat helper.
 * NEXT_PUBLIC_RE_SKIN_ADMIN_WHATSAPP must contain the public admin number.
 * Accepts Indonesian local 08... or international +62... formats.
 */
export function getAdminWhatsAppNumber() {
  const raw = process.env.NEXT_PUBLIC_RE_SKIN_ADMIN_WHATSAPP ?? "";
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
}

export function reserveAdminWhatsAppWindow(): WindowProxy | null {
  if (typeof window === "undefined" || !getAdminWhatsAppNumber()) return null;
  // Open synchronously during the member's click/submit gesture so the browser
  // does not block the WhatsApp tab after an asynchronous database request.
  return window.open("about:blank", "_blank");
}

export function openAdminWhatsApp(
  message: string,
  pendingWindow?: WindowProxy | null,
): boolean {
  if (typeof window === "undefined") {
    pendingWindow?.close();
    return false;
  }

  const phone = getAdminWhatsAppNumber();
  if (!phone) {
    pendingWindow?.close();
    return false;
  }

  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  if (pendingWindow && !pendingWindow.closed) {
    pendingWindow.opener = null;
    pendingWindow.location.href = url;
    return true;
  }

  const popup = window.open(url, "_blank");
  if (popup) {
    popup.opener = null;
    return true;
  }

  // If the browser blocks a new tab, keep the action reliable by opening
  // WhatsApp in the current tab instead.
  window.location.assign(url);
  return true;
}
