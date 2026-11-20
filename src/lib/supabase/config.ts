/** Validate Supabase env values and reject the example placeholders. */
export function getSupabasePublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  const validKey =
    (publishableKey.startsWith("sb_") || publishableKey.startsWith("eyJ")) &&
    !publishableKey.includes("xxxxxxxx");

  if (
    !url.startsWith("https://") ||
    url.includes("YOUR_PROJECT_ID") ||
    !validKey
  ) {
    return null;
  }

  return { url, publishableKey };
}
