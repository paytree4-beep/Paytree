// lib/site.ts
//
// Site-wide constants: the public address, whether sign-ups are open, and the
// membership prices. Prices live here, in one place, so the homepage, the
// dashboard and (later) billing can never disagree. The legal text in
// content/legal.ts quotes the same figures and must be updated with them.

/** Public address of the site, with no trailing slash. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.NODE_ENV === "production" ? "https://paytree.me" : "http://localhost:3000")
).replace(/\/+$/, "");

export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, "");

/**
 * Sign-up and log-in screens arrive in the next phase. Until then the homepage
 * must not link to pages that do not exist. Set NEXT_PUBLIC_SIGNUPS_OPEN=true
 * once /signup and /login are live.
 */
export const SIGNUPS_OPEN = process.env.NEXT_PUBLIC_SIGNUPS_OPEN === "true";

/** Membership prices in US dollars. */
export const PRICES = {
  monthly: 2.99,
  annual: 24.99,
} as const;

const money = (value: number) => `$${value.toFixed(2)}`;

export const PRICING = {
  monthly: {
    name: "Monthly membership",
    price: money(PRICES.monthly),
    period: "per month",
    note: "Billed monthly.",
    cta: "Start monthly",
  },
  annual: {
    name: "Annual membership",
    price: money(PRICES.annual),
    period: "per year",
    note: `Equivalent to ${money(PRICES.annual / 12)} per month.`,
    cta: "Start annual",
    badge: `Save ${Math.round((1 - PRICES.annual / (PRICES.monthly * 12)) * 100)}%`,
  },
} as const;
