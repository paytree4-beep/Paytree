"use server";
// app/dashboard/log/actions.ts
//
// Owner actions for the payment log. They run as the signed-in user, so Row
// Level Security only lets people change their own rows.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/log");
  return { supabase, user };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Turns the "I've paid" button on the public page on or off. */
export async function setPaymentLog(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const enable = formData.get("enable") === "1";
  const from = formData.get("from") === "log" ? "/dashboard/log" : "/dashboard";
  const { error } = await supabase
    .from("profiles")
    .update({ payment_log_enabled: enable })
    .eq("id", user.id);
  if (error) redirect(`${from}?error=log`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/log");
  redirect(`${from}?notice=${enable ? "log-on" : "log-off"}${from === "/dashboard" ? "#log" : ""}`);
}

/** Received / Not received / back to waiting. */
export async function setClaimStatus(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!UUID.test(id) || !["pending", "received", "dismissed"].includes(status)) {
    redirect("/dashboard/log?error=update");
  }
  const { error } = await supabase
    .from("payment_claims")
    .update({ status, received_at: status === "received" ? new Date().toISOString() : null })
    .eq("id", id)
    .eq("profile_id", user.id);
  if (error) redirect("/dashboard/log?error=update");
  revalidatePath("/dashboard/log");
  redirect("/dashboard/log");
}

/** Removes one entry for good. */
export async function deleteClaim(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) redirect("/dashboard/log?error=update");
  const { error } = await supabase.from("payment_claims").delete().eq("id", id).eq("profile_id", user.id);
  if (error) redirect("/dashboard/log?error=update");
  revalidatePath("/dashboard/log");
  redirect("/dashboard/log");
}
