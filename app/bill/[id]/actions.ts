"use server";
// app/bill/[id]/actions.ts
//
// "I've paid" on a split bill. Anyone with the link can mark themselves as
// paid. It shows as "waiting" until the owner confirms the money arrived.

import { redirect } from "next/navigation";

import { METHOD_IDS } from "@/lib/profiles";
import { cleanPayerName, isSplitId } from "@/lib/splits";
import { createAdminClient } from "@/lib/supabase/admin";

export async function markSplitPaid(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!isSplitId(id)) redirect("/");
  if (String(formData.get("website") ?? "") !== "") redirect(`/bill/${id}?paid=1`);

  const name = cleanPayerName(formData.get("name"));
  if (!name) redirect(`/bill/${id}?error=name#paid`);

  // The box unlocks after the payer opened one of the payment methods.
  const rawMethod = String(formData.get("method") ?? "");
  const method = METHOD_IDS.find((m) => m === rawMethod);
  if (!method) redirect(`/bill/${id}?error=method#paid`);

  const admin = createAdminClient();
  if (!admin) redirect(`/bill/${id}?error=save#paid`);

  const { data: split } = await admin.from("bill_splits").select("people").eq("id", id).maybeSingle();
  if (!split) redirect("/");
  const people = (split as { people: number }).people;
  const { data: rows } = await admin.from("bill_split_payments").select("confirmed_at").eq("split_id", id).limit(200);
  const all = (rows ?? []) as { confirmed_at: string | null }[];
  const confirmed = all.filter((r) => r.confirmed_at).length;
  if (confirmed >= people) redirect(`/bill/${id}?error=full#paid`);
  // Room for everyone, plus a little slack, so a prank cannot fill the list.
  if (all.length >= people * 2 + 5) redirect(`/bill/${id}?error=busy#paid`);

  let { error } = await admin.from("bill_split_payments").insert({ split_id: id, name, method });
  // Before the "method" column exists, save without it.
  if (error) ({ error } = await admin.from("bill_split_payments").insert({ split_id: id, name }));
  if (error) redirect(`/bill/${id}?error=save#paid`);
  redirect(`/bill/${id}?paid=1`);
}
