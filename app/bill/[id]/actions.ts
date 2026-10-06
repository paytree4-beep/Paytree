"use server";
// app/bill/[id]/actions.ts
//
// "I've paid" on a split bill. Anyone with the link can mark themselves as
// paid, so names are cleaned and the list can never grow past the number of
// people on the bill.

import { redirect } from "next/navigation";

import { cleanPayerName, isSplitId } from "@/lib/splits";
import { createAdminClient } from "@/lib/supabase/admin";

export async function markSplitPaid(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!isSplitId(id)) redirect("/");
  if (String(formData.get("website") ?? "") !== "") redirect(`/bill/${id}?paid=1`);

  const name = cleanPayerName(formData.get("name"));
  if (!name) redirect(`/bill/${id}?error=name#paid`);

  const admin = createAdminClient();
  if (!admin) redirect(`/bill/${id}?error=save#paid`);

  const { data: split } = await admin.from("bill_splits").select("people").eq("id", id).maybeSingle();
  if (!split) redirect("/");
  const { count } = await admin
    .from("bill_split_payments")
    .select("id", { count: "exact", head: true })
    .eq("split_id", id);
  if (typeof count === "number" && count >= (split as { people: number }).people) redirect(`/bill/${id}?error=full#paid`);

  const { error } = await admin.from("bill_split_payments").insert({ split_id: id, name });
  if (error) redirect(`/bill/${id}?error=save#paid`);
  redirect(`/bill/${id}?paid=1`);
}
