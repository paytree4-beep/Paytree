// lib/stripe.ts
//
// SERVER ONLY. A small Stripe client built on fetch, so the app does not
// depend on a particular version of the Stripe SDK. Covers exactly what
// PayTree needs: Checkout for new subscriptions, the Customer Portal for
// managing them, reading a subscription, cancelling one, and verifying
// webhook signatures.
//
// Environment (Vercel > Settings > Environment Variables):
//   STRIPE_SECRET_KEY       sk_live_... (or sk_test_... while testing). SECRET.
//   STRIPE_WEBHOOK_SECRET   whsec_... from the webhook endpoint. SECRET.
//   STRIPE_PRICE_MONTHLY    price_... for $4.99 / month
//   STRIPE_PRICE_ANNUAL     price_... for $39.99 / year

import { createHmac, timingSafeEqual } from "node:crypto";

export type Plan = "monthly" | "annual";

export function billingConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_PRICE_MONTHLY &&
      process.env.STRIPE_PRICE_ANNUAL,
  );
}

export function priceFor(plan: Plan): string | null {
  const id = plan === "monthly" ? process.env.STRIPE_PRICE_MONTHLY : process.env.STRIPE_PRICE_ANNUAL;
  return id && /^price_[A-Za-z0-9]+$/.test(id) ? id : null;
}

export function planForPrice(priceId: unknown): Plan | null {
  if (typeof priceId !== "string") return null;
  if (priceId === process.env.STRIPE_PRICE_MONTHLY) return "monthly";
  if (priceId === process.env.STRIPE_PRICE_ANNUAL) return "annual";
  return null;
}

type Params = Record<string, string | number | boolean | undefined>;

async function stripe<T>(method: "GET" | "POST" | "DELETE", path: string, params?: Params): Promise<T> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("stripe_not_configured");

  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(params ?? {})) {
    if (v !== undefined) body.set(k, String(v));
  }

  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      ...(method === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: method === "POST" ? body : undefined,
    cache: "no-store",
  });

  const json = (await response.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(`stripe_${response.status}: ${json.error?.message ?? "request failed"}`);
  }
  return json;
}

export interface StripeSubscription {
  id: string;
  customer: string;
  status: string;
  cancel_at_period_end: boolean;
  current_period_end?: number;
  metadata?: Record<string, string>;
  items?: { data?: { current_period_end?: number; price?: { id?: string } }[] };
}

export async function createCheckoutSession(opts: {
  plan: Plan;
  userId: string;
  email: string | undefined;
  customerId: string | null;
  origin: string;
}): Promise<string> {
  const price = priceFor(opts.plan);
  if (!price) throw new Error("price_missing");

  const session = await stripe<{ url: string }>("POST", "checkout/sessions", {
    mode: "subscription",
    "line_items[0][price]": price,
    "line_items[0][quantity]": 1,
    client_reference_id: opts.userId,
    "metadata[user_id]": opts.userId,
    "subscription_data[metadata][user_id]": opts.userId,
    allow_promotion_codes: true,
    ...(opts.customerId ? { customer: opts.customerId } : { customer_email: opts.email }),
    success_url: `${opts.origin}/dashboard?notice=subscribed`,
    cancel_url: `${opts.origin}/dashboard?notice=checkout-cancelled`,
  });
  return session.url;
}

export async function createPortalSession(customerId: string, origin: string): Promise<string> {
  const session = await stripe<{ url: string }>("POST", "billing_portal/sessions", {
    customer: customerId,
    return_url: `${origin}/dashboard`,
  });
  return session.url;
}

export function getSubscription(id: string): Promise<StripeSubscription> {
  return stripe<StripeSubscription>("GET", `subscriptions/${encodeURIComponent(id)}`);
}

export function cancelSubscription(id: string): Promise<StripeSubscription> {
  return stripe<StripeSubscription>("DELETE", `subscriptions/${encodeURIComponent(id)}`);
}

/** Period end lives on the subscription in older API versions, on its items in newer ones. */
export function periodEnd(sub: StripeSubscription): string | null {
  const seconds = sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end;
  return typeof seconds === "number" ? new Date(seconds * 1000).toISOString() : null;
}

/** Maps Stripe's statuses onto the ones the database accepts. */
export function normalizeStatus(status: string): string {
  switch (status) {
    case "active":
    case "trialing":
    case "past_due":
    case "canceled":
    case "paused":
    case "incomplete":
      return status;
    case "unpaid":
      return "past_due";
    case "incomplete_expired":
      return "canceled";
    default:
      return "incomplete";
  }
}

/**
 * Verifies the Stripe-Signature header against the raw request body.
 * Rejects anything older than five minutes so a captured request cannot be
 * replayed later.
 */
export function verifyWebhook(rawBody: string, header: string | null): boolean {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !header) return false;

  let timestamp = "";
  const signatures: string[] = [];
  for (const part of header.split(",")) {
    const [key, value] = part.split("=", 2);
    if (key === "t") timestamp = value ?? "";
    if (key === "v1" && value) signatures.push(value);
  }
  if (!/^\d+$/.test(timestamp) || signatures.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;

  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`, "utf8").digest();
  return signatures.some((sig) => {
    if (!/^[0-9a-f]{64}$/.test(sig)) return false;
    const given = Buffer.from(sig, "hex");
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}
