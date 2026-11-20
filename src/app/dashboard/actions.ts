"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type MemberActionResult = {
  ok: boolean;
  message: string;
};

export async function submitAccountDeletionRequest(formData: FormData): Promise<MemberActionResult> {
  const reason = String(formData.get("reason") ?? "").trim();
  const confirmation = String(formData.get("confirmation") ?? "").trim().toUpperCase();

  if (reason.length < 10) return { ok: false, message: "Jelaskan alasan minimal 10 karakter." };
  if (confirmation !== "HAPUS AKUN") return { ok: false, message: 'Ketik "HAPUS AKUN" untuk mengonfirmasi.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Koneksi Supabase belum tersedia." };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sesi login berakhir. Silakan masuk kembali." };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "member") return { ok: false, message: "Pengajuan ini hanya tersedia untuk akun member." };

  const { error } = await supabase.rpc("submit_account_deletion_request", { p_reason: reason });
  if (error) {
    const message = error.message.includes("already being reviewed")
      ? "Masih ada pengajuan penghapusan akun yang sedang ditinjau admin."
      : "Pengajuan belum berhasil dikirim. Silakan coba kembali.";
    return { ok: false, message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/admin");
  return { ok: true, message: "Pengajuan sudah dikirim kepada admin. Akunmu belum dihapus." };
}

export async function confirmRedemptionReceived(formData: FormData) {
  const redemptionId = String(formData.get("redemptionId") ?? "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(redemptionId)) {
    redirect("/dashboard?error=redemption-confirm-failed");
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/dashboard?error=redemption-confirm-failed");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { error } = await supabase.rpc("member_confirm_redemption_received", {
    p_redemption_request_id: redemptionId,
  });
  if (error) redirect("/dashboard?error=redemption-confirm-failed");

  revalidatePath("/dashboard");
  revalidatePath("/admin");
  redirect("/dashboard?notice=redemption-received");
}
