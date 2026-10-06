"use server";
// app/dashboard/split/actions.ts
//
// Create and delete "Split the bill" links. Runs as the signed-in owner.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isSplitId, newSplitId, parseSplit } from "@/lib/splits";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/split");
  return { supabase, user };
}

export async function createSplit(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const parsed = parseSplit((name) => formData.get(name));
  if ("error" in parsed) redirect(`/dashboard/split?error=${parsed.error}`);
  const split = parsed as Exclude<typeof parsed, { error: unknown }>;

  for (let attempt = 0; attempt < 3; attempt++) {
    const id = newSplitId();
    const { error } = await supabase.from("bill_splits").insert({
      id,
      owner_id: user.id,
      title: split.title,
      total_cents: split.totalCents,
      people: split.people,
      ...(split.eventDate ? { event_date: split.eventDate } : {}),
    });
    if (!error) {
      revalidatePath("/dashboard/split");
      redirect(`/dashboard/split?created=${id}`);
    }
    if (error.code !== "23505") break;
  }
  redirect("/dashboard/split?error=save");
}

export async function deleteSplit(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!isSplitId(id)) redirect("/dashboard/split");
  await supabase.from("bill_splits").delete().eq("id", id).eq("owner_id", user.id);
  revalidatePath("/dashboard/split");
  redirect("/dashboard/split");
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The owner checked their app: this person's money arrived. */
export async function confirmSplitPayment(formData: FormData): Promise<void> {
  const { supabase } = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (UUID.test(id)) {
    await supabase.from("bill_split_payments").update({ confirmed_at: new Date().toISOString() }).eq("id", id);
  }
  revalidatePath("/dashboard/split");
  redirect("/dashboard/split");
}

/** The money never arrived (or a prank): remove the name. */
export async function removeSplitPayment(formData: FormData): Promise<void> {
  const { supabase } = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (UUID.test(id)) await supabase.from("bill_split_payments").delete().eq("id", id);
  revalidatePath("/dashboard/split");
  redirect("/dashboard/split");
}
