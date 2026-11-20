/**
 * Demo mode is available only in local development.
 * It is enabled automatically when Supabase credentials are missing, or can
 * be forced locally with RE_SKIN_DEMO_MODE=true.
 * Production builds never expose demo dashboards.
 */
export function isDemoModeEnabled() {
  if (process.env.NODE_ENV === "production") return false;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  const hasSupabaseCredentials = Boolean(
    url.startsWith("https://") &&
      !url.includes("YOUR_PROJECT_ID") &&
      (publishableKey.startsWith("sb_") || publishableKey.startsWith("eyJ")) &&
      !publishableKey.includes("xxxxxxxx"),
  );

  return (
    process.env.RE_SKIN_DEMO_MODE === "true" ||
    (process.env.NODE_ENV === "development" && !hasSupabaseCredentials)
  );
}
