"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") redirect("/dashboard");
  return supabase;
}

function validUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function parseQuantity(value: FormDataEntryValue | null) {
  const parsed = Number(value ?? 0);
  return Number.isSafeInteger(parsed) && parsed >= 0 && parsed <= 1000000 ? parsed : null;
}

export async function updatePickupStatus(formData: FormData) {
  const pickupId = String(formData.get("pickupId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!validUuid(pickupId) || !["confirmed", "cancelled"].includes(status)) {
    redirect("/admin?error=invalid-action");
  }

  const supabase = await requireAdmin();
  const { error } = await supabase.rpc("admin_update_pickup_status", {
    p_pickup_request_id: pickupId,
    p_status: status,
  });

  if (error) redirect("/admin?error=update-failed");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  redirect(`/admin?notice=${status === "confirmed" ? "pickup-confirmed" : "pickup-cancelled"}`);
}

export async function completePickup(formData: FormData) {
  const pickupId = String(formData.get("pickupId") ?? "");
  const smallQuantity = parseQuantity(formData.get("smallQuantity"));
  const mediumQuantity = parseQuantity(formData.get("mediumQuantity"));
  const largeQuantity = parseQuantity(formData.get("largeQuantity"));

  if (!validUuid(pickupId) || smallQuantity === null || mediumQuantity === null || largeQuantity === null) {
    redirect("/admin?error=invalid-verification");
    return;
  }
  const verifiedSmall = smallQuantity as number;
  const verifiedMedium = mediumQuantity as number;
  const verifiedLarge = largeQuantity as number;
  if (verifiedSmall + verifiedMedium + verifiedLarge < 1) {
    redirect("/admin?error=empty-verification");
  }

  const supabase = await requireAdmin();
  const { error } = await supabase.rpc("admin_complete_pickup", {
    p_pickup_request_id: pickupId,
    p_small_quantity: verifiedSmall,
    p_medium_quantity: verifiedMedium,
    p_large_quantity: verifiedLarge,
  });

  if (error) redirect("/admin?error=verification-failed");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  redirect("/admin?notice=pickup-completed");
}


export async function reviewRedemption(formData: FormData) {
  const redemptionId = String(formData.get("redemptionId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const adminMessage = String(formData.get("adminMessage") ?? "").trim();

  if (!validUuid(redemptionId) || !["approved", "rejected"].includes(decision)) {
    redirect("/admin?error=invalid-action");
  }

  const supabase = await requireAdmin();
  const { error } = await supabase.rpc("admin_review_redemption", {
    p_redemption_request_id: redemptionId,
    p_decision: decision,
    p_admin_message: adminMessage || null,
  });

  if (error) redirect("/admin?error=redemption-review-failed");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  redirect("/admin?notice=redemption-reviewed");
}

export async function setRedemptionFulfillment(formData: FormData) {
  const redemptionId = String(formData.get("redemptionId") ?? "");
  const method = String(formData.get("method") ?? "");
  const details = String(formData.get("details") ?? "").trim();

  if (!validUuid(redemptionId) || !["pickup", "delivery"].includes(method) || details.length < 3) {
    redirect("/admin?error=invalid-fulfillment");
  }

  const supabase = await requireAdmin();
  const { error } = await supabase.rpc("admin_set_redemption_fulfillment", {
    p_redemption_request_id: redemptionId,
    p_method: method,
    p_details: details,
  });

  if (error) redirect("/admin?error=fulfillment-failed");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  redirect("/admin?notice=fulfillment-sent");
}

export async function reviewAccountDeletion(formData: FormData) {
  const requestId = String(formData.get("requestId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const adminMessage = String(formData.get("adminMessage") ?? "").trim();

  if (!validUuid(requestId) || !["approved", "rejected"].includes(decision)) {
    redirect("/admin?error=invalid-action");
  }

  const supabase = await requireAdmin();
  const { error } = await supabase.rpc("admin_review_account_deletion", {
    p_request_id: requestId,
    p_decision: decision,
    p_admin_message: adminMessage || null,
  });

  if (error) redirect("/admin?error=deletion-review-failed");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  redirect("/admin?notice=deletion-reviewed");
}
