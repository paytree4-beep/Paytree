// app/dashboard/money/data.ts
//
// Loads every confirmed payment for the signed-in owner from the payment log,
// invoices and split bills (Row Level Security limits it to their rows).
// Each source is read on its own, so one missing table never breaks the rest.

import type { MoneyEntry } from "@/lib/money";
import { shareCents } from "@/lib/splits";
import type { createClient } from "@/lib/supabase/server";

type Client = Awaited<ReturnType<typeof createClient>>;

export async function loadMoneyEntries(supabase: Client, userId: string): Promise<MoneyEntry[]> {
  const entries: MoneyEntry[] = [];

  // 1. The public page's "I've paid" notes the owner marked Received.
  const { data: claims } = await supabase
    .from("payment_claims")
    .select("payer_name, amount_cents, method, note, received_at, created_at")
    .eq("profile_id", userId)
    .eq("status", "received")
    .limit(5000);
  for (const c of (claims ?? []) as {
    payer_name: string;
    amount_cents: number | null;
    method: string | null;
    note: string | null;
    received_at: string | null;
    created_at: string;
  }[]) {
    if (!c.amount_cents) continue;
    entries.push({
      source: "page",
      at: c.received_at ?? c.created_at,
      amountCents: c.amount_cents,
      from: c.payer_name,
      what: c.note ?? "Payment page",
      method: c.method,
      claimedAt: c.created_at,
      href: "/dashboard/log",
    });
  }

  // 2. Invoices the owner confirmed.
  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, customer, title, amount_cents, claimed_method, claimed_at, confirmed_at")
    .eq("owner_id", userId)
    .not("confirmed_at", "is", null)
    .limit(5000);
  for (const i of (invoices ?? []) as {
    id: string;
    claimed_at: string | null;
    customer: string;
    title: string;
    amount_cents: number;
    claimed_method: string | null;
    confirmed_at: string;
  }[]) {
    entries.push({
      source: "invoice",
      at: i.confirmed_at,
      amountCents: i.amount_cents,
      from: i.customer,
      what: i.title,
      method: i.claimed_method,
      claimedAt: i.claimed_at,
      href: `/invoice/${i.id}`,
    });
  }

  // 3. Split-bill shares the owner confirmed.
  const { data: splits } = await supabase
    .from("bill_splits")
    .select("id, title, total_cents, people")
    .eq("owner_id", userId)
    .limit(1000);
  const splitById = new Map(
    ((splits ?? []) as { id: string; title: string; total_cents: number; people: number }[]).map((s) => [s.id, s]),
  );
  if (splitById.size > 0) {
    const ids = [...splitById.keys()];
    const load = (cols: string) =>
      supabase.from("bill_split_payments").select(cols).in("split_id", ids).not("confirmed_at", "is", null).limit(5000);
    const withMethod = await load("split_id, name, created_at, confirmed_at, method");
    const rows = withMethod.error ? (await load("split_id, name, created_at, confirmed_at")).data : withMethod.data;
    for (const p of (rows ?? []) as unknown as { split_id: string; name: string; created_at?: string; confirmed_at: string; method?: string | null }[]) {
      const split = splitById.get(p.split_id);
      if (!split) continue;
      entries.push({
        source: "split",
        at: p.confirmed_at,
        amountCents: shareCents(split.total_cents, split.people),
        from: p.name,
        what: split.title,
        method: p.method ?? null,
        claimedAt: p.created_at ?? null,
        href: `/bill/${p.split_id}`,
      });
    }
  }

  return entries;
}
