// lib/billing.ts
//
// SERVER ONLY. Reads and writes the subscriptions table with the service
// role, and answers "is this page allowed to be public?".

import { TRIAL_DAYS } from "./site";
import { createAdminClient } from "./supabase/admin";
import {
  billingConfigured,
  normalizeStatus,
  periodEnd,
  planForPrice,
  type StripeSubscription,
} from "./stripe";

export interface SubscriptionRow {
  provider: string;
  provider_customer_id: string | null;
  provider_subscription_id: string | null;
  plan: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

/** True when the row grants access now (same rule as has_active_subscription in SQL). */
export function grantsAccess(row: SubscriptionRow | null): boolean {
  if (!row) return false;
  if (row.provider === "comp" && row.status === "active") return true;
  if (["active", "trialing", "past_due", "canceled"].includes(row.status)) {
    return Boolean(row.current_period_end && new Date(row.current_period_end).getTime() > Date.now());
  }
  return false;
}

export type AccessReason = "prelaunch" | "member" | "trial" | "ended";

export interface Access {
  /** True when the public page is live. */
  active: boolean;
  reason: AccessReason;
  /** When the free trial ends (or ended), ISO string. */
  trialEndsAt: string | null;
  /** Whole days left in the trial, 0 when it has ended. */
  trialDaysLeft: number;
}

export function trialEndFrom(createdAt: string | null | undefined): Date | null {
  if (!createdAt) return null;
  const start = new Date(createdAt).getTime();
  if (Number.isNaN(start)) return null;
  return new Date(start + TRIAL_DAYS * 86_400_000);
}

/**
 * Decides whether a page is live. Before billing is configured (no Stripe
 * keys), every page is live. After that: members are live, accounts inside
 * their free trial are live, and everyone else is paused (never deleted).
 */
export function computeAccess(
  createdAt: string | null | undefined,
  subscription: SubscriptionRow | null,
  now = Date.now(),
): Access {
  const end = trialEndFrom(createdAt);
  const trialEndsAt = end ? end.toISOString() : null;
  const msLeft = end ? end.getTime() - now : 0;
  const trialDaysLeft = msLeft > 0 ? Math.ceil(msLeft / 86_400_000) : 0;

  if (!billingConfigured()) return { active: true, reason: "prelaunch", trialEndsAt, trialDaysLeft };
  if (grantsAccess(subscription)) return { active: true, reason: "member", trialEndsAt, trialDaysLeft };
  if (msLeft > 0) return { active: true, reason: "trial", trialEndsAt, trialDaysLeft };
  return { active: false, reason: "ended", trialEndsAt, trialDaysLeft: 0 };
}

/** Access for any account, read with the service role (used by public pages). */
export async function accessFor(userId: string): Promise<Access> {
  if (!billingConfigured()) return computeAccess(null, null);
  const admin = createAdminClient();
  if (!admin) return { active: false, reason: "ended", trialEndsAt: null, trialDaysLeft: 0 };

  const [{ data: profile }, { data: sub }] = await Promise.all([
    admin.from("profiles").select("created_at").eq("id", userId).maybeSingle(),
    admin
      .from("subscriptions")
      .select("provider, provider_customer_id, provider_subscription_id, plan, status, current_period_end, cancel_at_period_end")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);
  return computeAccess(
    (profile as { created_at?: string } | null)?.created_at,
    (sub as SubscriptionRow | null) ?? null,
  );
}

/** Applies a verified Stripe event atomically with its idempotency record. */
export async function applyStripeSubscriptionEvent(
  event: { id: string; type: string; created: number },
  userId: string,
  sub: StripeSubscription,
): Promise<boolean> {
  const admin = createAdminClient();
  if (!admin) throw new Error("admin_client_missing");

  const plan = planForPrice(sub.items?.data?.[0]?.price?.id);
  if (!plan || !sub.id || typeof sub.customer !== "string") throw new Error("unknown_subscription");
  const { data, error } = await admin.rpc("apply_stripe_subscription_event", {
    p_event_id: event.id,
    p_event_type: event.type,
    p_event_created: event.created,
    p_user_id: userId,
    p_customer_id: sub.customer,
    p_subscription_id: sub.id,
    p_plan: plan,
    p_status: normalizeStatus(sub.status),
    p_period_end: periodEnd(sub),
    p_cancel_at_period_end: Boolean(sub.cancel_at_period_end),
  });
  if (error) throw new Error(`apply_subscription_event: ${error.message}`);
  return data === true;
}
