"use server";
// app/dashboard/harvest/actions.ts
//
// Admin only: marks one person's apples as bought (paid).

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ADMIN_EMAIL } from "@/lib/referrals";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";


const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function markApplesPaid(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || (user.email ?? "").toLowerCase() !== ADMIN_EMAIL) redirect("/dashboard");

  const referrerId = String(formData.get("referrer_id") ?? "");
  if (!UUID.test(referrerId)) redirect("/dashboard/harvest?error=1");

  const admin = createAdminClient();
  if (!admin) redirect("/dashboard/harvest?error=1");
  const { error } = await admin
    .from("referral_apples")
    .update({ paid_at: new Date().toISOString() })
    .eq("referrer_id", referrerId)
    .is("paid_at", null);
  if (error) redirect("/dashboard/harvest?error=1");

  revalidatePath("/dashboard/harvest");
  redirect("/dashboard/harvest?done=1");
}
