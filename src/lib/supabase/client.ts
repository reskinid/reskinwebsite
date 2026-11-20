"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

function getBrowserSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  const validKey =
    (publishableKey.startsWith("sb_") || publishableKey.startsWith("eyJ")) &&
    !publishableKey.includes("xxxxxxxx");

  if (!url.startsWith("https://") || url.includes("YOUR_PROJECT_ID") || !validKey) {
    return null;
  }

  return { url, publishableKey };
}

export function isSupabaseConfigured() {
  return Boolean(getBrowserSupabaseConfig());
}

export function createSupabaseBrowserClient(): SupabaseClient | null {
  const config = getBrowserSupabaseConfig();
  if (!config) return null;
  if (!browserClient) {
    browserClient = createBrowserClient(config.url, config.publishableKey);
  }
  return browserClient;
}
