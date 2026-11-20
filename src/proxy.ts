import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Do not contact Supabase at all when the developer explicitly previews demo UI.
  if (process.env.NODE_ENV !== "production" && process.env.RE_SKIN_DEMO_MODE === "true") {
    return supabaseResponse;
  }

  const config = getSupabasePublicConfig();
  if (!config) return supabaseResponse;

  const supabase = createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
        Object.entries(headers ?? {}).forEach(([name, value]) => {
          if (value) supabaseResponse.headers.set(name, value);
        });
      },
    },
  });

  // getClaims verifies the JWT and refreshes the cookie-backed session when needed.
  await supabase.auth.getClaims();
  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
