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
import { reminderDue, reminderEmail } from "@/lib/trial-reminders";

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

    const message = reminderEmail(kind, p.display_name, end);
    if (await sendEmail(email, message.subject, message.html, message.text)) sent += 1;
    else await admin.from("trial_reminders").delete().eq("user_id", p.id).eq("kind", kind);
  }

  return NextResponse.json({ sent });
}
