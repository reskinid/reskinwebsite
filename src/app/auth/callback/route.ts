import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const supabase = await createSupabaseServerClient();

  if (code && supabase) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const nextPath = requestUrl.searchParams.get("next");
      if (nextPath === "/auth/reset-password") {
        return NextResponse.redirect(new URL(nextPath, request.url));
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role,gender")
          .eq("id", user.id)
          .maybeSingle();

        if (profile?.role === "admin") {
          return NextResponse.redirect(new URL("/admin", request.url));
        }

        if (!profile?.gender) {
          return NextResponse.redirect(new URL("/profile-setup", request.url));
        }

        return NextResponse.redirect(new URL("/dashboard", request.url));
      }

      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.redirect(new URL("/?auth=error", request.url));
}
