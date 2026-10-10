// lib/referrals.ts
//
// The apple basket (referral program, launch offer). Pure helpers.
//
// Every user has a referral link: paytree.to/?ref=<username>. When someone who
// came through it subscribes and pays for the first time, the referrer gets an
// apple in their basket:
//   every new paying member -> one apple worth $0.25
// The offer runs until December 31, 2026. On Harvest Day (January 1, 2027)
// PayTree buys every apple and pays the owners.

export type ApplePlan = "monthly" | "annual";

export const APPLE_VALUE_CENTS: Record<ApplePlan, number> = { monthly: 25, annual: 25 };

/** Last moment a new subscription earns an apple (end of Dec 31, New York). */
export const OFFER_ENDS_AT = Date.parse("2027-01-01T05:00:00Z");
/** The day PayTree buys the apples. */
export const HARVEST_DAY = Date.parse("2027-01-01T17:00:00Z");

export function offerOpen(now: number): boolean {
  return now < OFFER_ENDS_AT;
}

export function daysUntilHarvest(now: number): number {
  return Math.max(0, Math.ceil((HARVEST_DAY - now) / 86_400_000));
}

export interface AppleRow {
  plan: ApplePlan;
  amount_cents: number;
  paid_at: string | null;
}

export interface Basket {
  red: number;
  green: number;
  /** Value of apples not paid yet. */
  owedCents: number;
  /** Value already paid out. */
  paidCents: number;
}

export function summarizeBasket(apples: AppleRow[]): Basket {
  const b: Basket = { red: 0, green: 0, owedCents: 0, paidCents: 0 };
  for (const a of apples) {
    if (a.plan === "annual") b.red += 1;
    else b.green += 1;
    if (a.paid_at) b.paidCents += a.amount_cents;
    else b.owedCents += a.amount_cents;
  }
  return b;
}

/** Reads "?ref=" safely: a valid link name, else null. */
export function cleanRef(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const v = raw.trim().toLowerCase();
  return /^[a-z0-9][a-z0-9_.-]{2,29}$/.test(v) ? v : null;
}

/** The PayTree owner, who sees the Harvest page. */
export const ADMIN_EMAIL = "paytree4@gmail.com";
