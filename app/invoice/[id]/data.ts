// app/invoice/[id]/data.ts
//
// Loads a public invoice and its owner's page, with the service role (the
// customer is not signed in). Shared by the page and its link preview.

import { getProfileByUsername } from "@/lib/profiles";
import { isSplitId } from "@/lib/splits";
import { createAdminClient } from "@/lib/supabase/admin";

export type PublicInvoice = {
  id: string;
  owner_id: string;
  customer: string;
  title: string;
  amount_cents: number;
  due_date: string | null;
  note: string | null;
  claimed_at: string | null;
  claimed_method: string | null;
  confirmed_at: string | null;
};

export async function loadInvoice(id: string) {
  if (!isSplitId(id)) return null;
  const admin = createAdminClient();
  if (!admin) return null;
  const { data } = await admin
    .from("invoices")
    .select("id, owner_id, customer, title, amount_cents, due_date, note, claimed_at, claimed_method, confirmed_at")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const invoice = data as PublicInvoice;
  const { data: owner } = await admin.from("profiles").select("username").eq("id", invoice.owner_id).maybeSingle();
  const username = (owner as { username?: string } | null)?.username;
  const profile = username ? await getProfileByUsername(username) : null;
  if (!profile || profile.paused) return null;
  return { invoice, profile };
}
