// lib/site.ts
//
// Site-wide constants: the public address, whether sign-ups are open, and the
// membership prices. Prices live here, in one place, so the homepage, the
// dashboard and (later) billing can never disagree. The legal text in
// content/legal.ts quotes the same figures and must be updated with them.

/**
 * Public address of the site, with no trailing slash.
 * Order: NEXT_PUBLIC_SITE_URL if set, then the production address Vercel
 * provides automatically (for example paytree-ashy.vercel.app), then a default.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return process.env.NODE_ENV === "production" ? "https://paytree.me" : "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl().replace(/\/+$/, "");

export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, "");

/**
 * Sign-up and log-in are open once Supabase is connected (its public URL is
 * present). Set NEXT_PUBLIC_SIGNUPS_OPEN to "false" to close them again, or to
 * "true" to force them open.
 */
const signupsFlag = process.env.NEXT_PUBLIC_SIGNUPS_OPEN;
export const SIGNUPS_OPEN =
  signupsFlag === "true" ||
  (signupsFlag !== "false" && Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL));

/**
 * "Continue with Google" appears only once Google is set up in Supabase
 * (Authentication > Sign In / Providers > Google). Then set
 * NEXT_PUBLIC_GOOGLE_SIGNIN to "true" in Vercel and redeploy.
 */
export const GOOGLE_SIGNIN = process.env.NEXT_PUBLIC_GOOGLE_SIGNIN === "true";

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
