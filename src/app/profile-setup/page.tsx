import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ProfileSetupForm from "@/components/ProfileSetupForm";

export const dynamic = "force-dynamic";

export default async function ProfileSetupPage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,gender,avatar_style,full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role === "admin") redirect("/admin");
  if (profile?.gender) redirect("/dashboard");

  const fullName = String(
    profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || "",
  );
  const email = user.email ?? "";

  return <ProfileSetupForm fullName={fullName} email={email} />;
}
