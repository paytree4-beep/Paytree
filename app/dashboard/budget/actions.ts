"use server";
// app/dashboard/budget/actions.ts
//
// Budget: add spending or income, monthly commitments, and mark a commitment
// paid for this month (which adds it to your spending). Owner only.

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { parseCommitment, parseMove } from "@/lib/budget";
import { dayKey, safeTimeZone } from "@/lib/payment-log";
import { createClient } from "@/lib/supabase/server";

const HERE = "/dashboard/budget";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${HERE}`);
  return { supabase, user };
}

async function today(): Promise<string> {
  return dayKey(new Date(), safeTimeZone((await cookies()).get("pt_tz")?.value));
}

function done(notice?: string): never {
  revalidatePath(HERE);
  revalidatePath("/dashboard/tree");
  redirect(notice ? `${HERE}?notice=${notice}` : HERE);
}

export async function addMove(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const parsed = parseMove((name) => formData.get(name), await today());
  if ("error" in parsed) redirect(`${HERE}?error=${parsed.error}`);
  const move = parsed as Exclude<typeof parsed, { error: unknown }>;
  const { error } = await supabase.from("money_moves").insert({
    owner_id: user.id,
    kind: move.kind,
    amount_cents: move.amountCents,
    category: move.category,
    note: move.note,
    on_date: move.onDate,
  });
  if (error) redirect(`${HERE}?error=save`);
  done(move.kind === "in" ? "income" : "spent");
}

export async function deleteMove(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (UUID.test(id)) await supabase.from("money_moves").delete().eq("id", id).eq("owner_id", user.id);
  done();
}

export async function addCommitment(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const parsed = parseCommitment((name) => formData.get(name));
  if ("error" in parsed) redirect(`${HERE}?error=c_${parsed.error}#commitments`);
  const c = parsed as Exclude<typeof parsed, { error: unknown }>;
  const { error } = await supabase.from("commitments").insert({
    owner_id: user.id,
    name: c.name,
    amount_cents: c.amountCents,
    due_day: c.dueDay,
    category: c.category,
  });
  if (error) redirect(`${HERE}?error=save`);
  done("commitment");
}

export async function deleteCommitment(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (UUID.test(id)) await supabase.from("commitments").delete().eq("id", id).eq("owner_id", user.id);
  done();
}

/** The daily money email (12 noon New York time): on or off. */
export async function setDailySummary(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const on = formData.get("on") === "yes";
  await supabase.from("profiles").update({ daily_summary: on }).eq("id", user.id);
  revalidatePath(HERE);
  redirect(`${HERE}?notice=${on ? "daily_on" : "daily_off"}#daily`);
}

/** Paid this month's rent / phone / subscription: it counts as spending today. */
export async function payCommitment(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) done();
  const { data } = await supabase
    .from("commitments")
    .select("id, name, amount_cents, category")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();
  const c = data as { id: string; name: string; amount_cents: number; category: string } | null;
  if (!c) done();
  const day = await today();
  // Not twice in the same month.
  const { count } = await supabase
    .from("money_moves")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id)
    .eq("commitment_id", c!.id)
    .gte("on_date", `${day.slice(0, 7)}-01`);
  if (!count) {
    await supabase.from("money_moves").insert({
      owner_id: user.id,
      kind: "out",
      amount_cents: c!.amount_cents,
      category: c!.category,
      note: c!.name,
      on_date: day,
      commitment_id: c!.id,
    });
  }
  done("paid");
}
