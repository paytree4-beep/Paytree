"use server";
// app/bill/[id]/actions.ts
//
// "I've paid" on a split bill. Anyone with the link can mark themselves as
// paid. It shows as "waiting" until the owner confirms the money arrived.

import { redirect } from "next/navigation";

import { getProfileByUsername, METHOD_IDS, resolveMethods } from "@/lib/profiles";
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

  const { data: split } = await admin.from("bill_splits").select("owner_id").eq("id", id).maybeSingle();
  if (!split) redirect("/");
  const ownerId = (split as { owner_id: string }).owner_id;
  const { data: owner } = await admin.from("profiles").select("username").eq("id", ownerId).maybeSingle();
  const username = (owner as { username?: string } | null)?.username;
  const profile = username ? await getProfileByUsername(username) : null;
  if (!profile || profile.paused) redirect("/");
  if (!resolveMethods(profile.payments).some((m) => m.id === method)) {
    redirect(`/bill/${id}?error=method#paid`);
  }

  const { data: result, error } = await admin.rpc("claim_split_payment", {
    p_split_id: id,
    p_name: name,
    p_method: method,
  });
  if (error) redirect(`/bill/${id}?error=save#paid`);
  if (result === "full" || result === "busy") redirect(`/bill/${id}?error=${result}#paid`);
  if (result === "missing") redirect("/");
  if (result !== "created") redirect(`/bill/${id}?error=save#paid`);
  redirect(`/bill/${id}?paid=1`);
}
