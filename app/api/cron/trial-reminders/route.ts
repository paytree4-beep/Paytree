// app/api/cron/trial-reminders/route.ts
//
// Runs once a day (Vercel Cron, see vercel.json). Emails people whose free
// trial ends in 2 days, and again on the last day. Only after billing is
// switched on, never to members, and never the same reminder twice.

import { NextResponse } from "next/server";

import { grantsAccess, trialEndFrom, type SubscriptionRow } from "@/lib/billing";
import { sendEmail } from "@/lib/email";
import { TRIAL_DAYS } from "@/lib/site";
import { billingConfigured } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { shareCents } from "@/lib/splits";
import { reminderDue, reminderEmail, type TrialStats } from "@/lib/trial-reminders";

type Admin = NonNullable<ReturnType<typeof createAdminClient>>;

/** Visits, taps and confirmed payments since the account was made. Never throws. */
async function trialStats(admin: Admin, userId: string, since: string): Promise<TrialStats | null> {
  try {
    const count = async (actions: string[]) => {
      const { count: n } = await admin
        .from("analytics_events")
        .select("id", { count: "exact", head: true })
        .eq("profile_id", userId)
        .in("action", actions)
        .gte("occurred_at", since);
      return typeof n === "number" ? n : 0;
    };
    const [views, taps] = await Promise.all([count(["view"]), count(["open", "copy"])]);

    let confirmedCents = 0;
    const { data: claims } = await admin
      .from("payment_claims")
      .select("amount_cents")
      .eq("profile_id", userId)
      .eq("status", "received");
    for (const c of (claims ?? []) as { amount_cents: number | null }[]) confirmedCents += c.amount_cents ?? 0;
    const { data: invoices } = await admin
      .from("invoices")
      .select("amount_cents")
      .eq("owner_id", userId)
      .not("confirmed_at", "is", null);
    for (const i of (invoices ?? []) as { amount_cents: number }[]) confirmedCents += i.amount_cents;
    const { data: splits } = await admin.from("bill_splits").select("id, total_cents, people").eq("owner_id", userId);
    const splitList = (splits ?? []) as { id: string; total_cents: number; people: number }[];
    if (splitList.length > 0) {
      const { data: pays } = await admin
        .from("bill_split_payments")
        .select("split_id")
        .in("split_id", splitList.map((s) => s.id))
        .not("confirmed_at", "is", null);
      const byId = new Map(splitList.map((s) => [s.id, s]));
      for (const p of (pays ?? []) as { split_id: string }[]) {
        const s = byId.get(p.split_id);
        if (s) confirmedCents += shareCents(s.total_cents, s.people);
      }
    }
    return { views, taps, confirmedCents };
  } catch {
    return null;
  }
}

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse(null, { status: 401 });
  }
  if (!billingConfigured()) return NextResponse.json({ skipped: "billing not configured" });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "no admin client" }, { status: 500 });

  const now = Date.now();
  const since = new Date(now - (TRIAL_DAYS + 1) * 86_400_000).toISOString();
  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id, display_name, created_at")
    .gte("created_at", since)
    .limit(5000);
  if (error) return NextResponse.json({ error: "profiles" }, { status: 500 });

  let sent = 0;
  for (const p of (profiles ?? []) as { id: string; display_name: string; created_at: string }[]) {
    const kind = reminderDue(p.created_at, now);
    if (!kind) continue;

    const { data: sub } = await admin
      .from("subscriptions")
      .select("provider, provider_customer_id, provider_subscription_id, plan, status, current_period_end, cancel_at_period_end")
      .eq("user_id", p.id)
      .maybeSingle();
    if (grantsAccess(sub as SubscriptionRow | null)) continue;

    // Claim this reminder first, so it is never sent twice.
    const { data: claimed } = await admin
      .from("trial_reminders")
      .upsert({ user_id: p.id, kind }, { onConflict: "user_id,kind", ignoreDuplicates: true })
      .select("user_id");
    if (!claimed || claimed.length === 0) continue;

    const { data: userData } = await admin.auth.admin.getUserById(p.id);
    const email = userData?.user?.email;
    const end = trialEndFrom(p.created_at);
    if (!email || !end) continue;

    const message = reminderEmail(kind, p.display_name, end, await trialStats(admin, p.id, p.created_at));
    if (await sendEmail(email, message.subject, message.html, message.text)) sent += 1;
    else await admin.from("trial_reminders").delete().eq("user_id", p.id).eq("kind", kind);
  }

  return NextResponse.json({ sent });
}
