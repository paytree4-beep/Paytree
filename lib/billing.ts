// lib/billing.ts
//
// SERVER ONLY. Reads and writes the subscriptions table with the service
// role, and answers "is this page allowed to be public?".

import { FREE_METHOD_LIMIT } from "./site";
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
  if (row.status === "active" || row.status === "trialing") return true;
  if (row.status === "past_due" || row.status === "canceled") {
    return Boolean(row.current_period_end && new Date(row.current_period_end).getTime() > Date.now());
  }
  return false;
}

/**
 * Whether this account has a paid membership. While billing is not configured
 * (no Stripe keys yet) everyone counts as a member, so nothing is limited
 * before launch. If the check itself cannot run, the account is treated as
 * free (the safe side).
 */
export async function pageIsPaid(userId: string): Promise<boolean> {
  if (!billingConfigured()) return true;
  const admin = createAdminClient();
  if (!admin) return false;
  const { data, error } = await admin.rpc("has_active_subscription", { uid: userId });
  if (error) return false;
  return data === true;
}

/**
 * How many payment methods this account may show. Unlimited (null) for
 * members, and for everyone while billing is not configured.
 */
export async function methodLimitFor(userId: string): Promise<number | null> {
  return (await pageIsPaid(userId)) ? null : FREE_METHOD_LIMIT;
}

/** Saves a Stripe subscription for a user. Uses the service role. */
export async function saveStripeSubscription(userId: string, sub: StripeSubscription): Promise<void> {
  const admin = createAdminClient();
  if (!admin) throw new Error("admin_client_missing");

  const plan = planForPrice(sub.items?.data?.[0]?.price?.id) ?? "monthly";
  const { error } = await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      provider: "stripe",
      provider_customer_id: sub.customer,
      provider_subscription_id: sub.id,
      plan,
      status: normalizeStatus(sub.status),
      current_period_end: periodEnd(sub),
      cancel_at_period_end: Boolean(sub.cancel_at_period_end),
    },
    { onConflict: "user_id" },
  );
  if (error) throw new Error(`save_subscription: ${error.message}`);
}
