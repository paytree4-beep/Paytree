"use server";
// app/dashboard/harvest/actions.ts
//
// Admin only: marks every unpaid apple of one person as paid.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ADMIN_EMAIL } from "@/lib/referrals";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export async function markApplesPaid(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || (user.email ?? "").toLowerCase() !== ADMIN_EMAIL) redirect("/dashboard");

  const id = formData.get("referrer_id");
  if (typeof id !== "string" || !UUID.test(id)) redirect("/dashboard/harvest");

  const admin = createAdminClient();
  if (admin) {
    await admin
      .from("referral_apples")
      .update({ paid_at: new Date().toISOString() })
      .eq("referrer_id", id)
      .is("paid_at", null);
  }
  revalidatePath("/dashboard/harvest");
  redirect("/dashboard/harvest");
}
