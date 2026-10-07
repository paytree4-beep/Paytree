// app/api/cron/daily-summary/route.ts
//
// Turned off for now: it is not in vercel.json, so it never runs. To turn it
// back on, add { "path": "/api/cron/daily-summary", "schedule": "0 16 * * *" }
// to the crons in vercel.json. When on, it runs once a day at 12 noon New York time.
// Emails each owner what came in and went out yesterday, only on days with
// activity, only if they kept the email on, and never twice for one day.

import { NextResponse } from "next/server";

import {
  SUMMARY_TIME_ZONE,
  dailySummaryEmail,
  emptyDay,
  hasActivity,
  previousDay,
  type OwnerDay,
} from "@/lib/daily-summary";
import { sendEmail } from "@/lib/email";
import { dayKey } from "@/lib/payment-log";
import { shareCents } from "@/lib/splits";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse(null, { status: 401 });
  }
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "no admin client" }, { status: 500 });

  const tz = SUMMARY_TIME_ZONE;
  const yesterday = previousDay(dayKey(new Date(), tz));
  const month = yesterday.slice(0, 7);
  const monthStart = `${month}-01`;
  // A little before the month starts, for time zones; filtered by day below.
  const since = new Date(new Date(`${monthStart}T00:00:00Z`).getTime() - 86_400_000).toISOString();
  const local = (iso: string) => dayKey(new Date(iso), tz);

  const days = new Map<string, OwnerDay>();
  const get = (id: string) => {
    let d = days.get(id);
    if (!d) days.set(id, (d = emptyDay()));
    return d;
  };
  const addPayTree = (owner: string, iso: string, cents: number) => {
    const day = local(iso);
    if (day.slice(0, 7) !== month || day > yesterday) return;
    const d = get(owner);
    d.monthIn += cents;
    if (day === yesterday) d.payTreeIn += cents;
  };

  // Money in and out the owners added themselves.
  const { data: moves } = await admin
    .from("money_moves")
    .select("owner_id, kind, amount_cents, category, on_date")
    .gte("on_date", monthStart)
    .lte("on_date", yesterday)
    .limit(100000);
  for (const m of (moves ?? []) as { owner_id: string; kind: string; amount_cents: number; category: string; on_date: string }[]) {
    const d = get(m.owner_id);
    if (m.kind === "in") {
      d.monthIn += m.amount_cents;
      if (m.on_date === yesterday) d.otherIn += m.amount_cents;
    } else {
      d.monthOut += m.amount_cents;
      if (m.on_date === yesterday) {
        d.spent += m.amount_cents;
        d.byCategory[m.category] = (d.byCategory[m.category] ?? 0) + m.amount_cents;
      }
    }
  }

  // PayTree payments the owners confirmed.
  const { data: claims } = await admin
    .from("payment_claims")
    .select("profile_id, amount_cents, received_at")
    .eq("status", "received")
    .gte("received_at", since)
    .limit(100000);
  for (const c of (claims ?? []) as { profile_id: string; amount_cents: number | null; received_at: string }[]) {
    if (c.amount_cents) addPayTree(c.profile_id, c.received_at, c.amount_cents);
  }

  const { data: invoices } = await admin
    .from("invoices")
    .select("owner_id, amount_cents, confirmed_at")
    .gte("confirmed_at", since)
    .limit(100000);
  for (const i of (invoices ?? []) as { owner_id: string; amount_cents: number; confirmed_at: string }[]) {
    addPayTree(i.owner_id, i.confirmed_at, i.amount_cents);
  }

  const { data: splitPays } = await admin
    .from("bill_split_payments")
    .select("split_id, confirmed_at")
    .gte("confirmed_at", since)
    .limit(100000);
  const pays = (splitPays ?? []) as { split_id: string; confirmed_at: string }[];
  if (pays.length > 0) {
    const ids = [...new Set(pays.map((p) => p.split_id))];
    const { data: splits } = await admin.from("bill_splits").select("id, owner_id, total_cents, people").in("id", ids);
    const byId = new Map(
      ((splits ?? []) as { id: string; owner_id: string; total_cents: number; people: number }[]).map((s) => [s.id, s]),
    );
    for (const p of pays) {
      const s = byId.get(p.split_id);
      if (s) addPayTree(s.owner_id, p.confirmed_at, shareCents(s.total_cents, s.people));
    }
  }

  const owners = [...days.entries()].filter(([, d]) => hasActivity(d));
  if (owners.length === 0) return NextResponse.json({ day: yesterday, sent: 0 });

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, display_name, daily_summary")
    .in(
      "id",
      owners.map(([id]) => id),
    );
  const profileById = new Map(
    ((profiles ?? []) as { id: string; display_name: string; daily_summary?: boolean | null }[]).map((p) => [p.id, p]),
  );

  let sent = 0;
  for (const [id, day] of owners) {
    const profile = profileById.get(id);
    if (!profile || profile.daily_summary === false) continue;

    // Claim the day first, so a retry never sends it twice.
    const { data: claimed } = await admin
      .from("daily_summaries")
      .upsert({ user_id: id, day: yesterday }, { onConflict: "user_id,day", ignoreDuplicates: true })
      .select("user_id");
    if (!claimed || claimed.length === 0) continue;

    const { data: userData } = await admin.auth.admin.getUserById(id);
    const email = userData?.user?.email;
    if (!email) continue;
    const message = dailySummaryEmail(profile.display_name, yesterday, day);
    if (await sendEmail(email, message.subject, message.html, message.text)) sent += 1;
    else await admin.from("daily_summaries").delete().eq("user_id", id).eq("day", yesterday);
  }

  return NextResponse.json({ day: yesterday, sent });
}
