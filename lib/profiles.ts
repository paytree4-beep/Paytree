// lib/profiles.ts
//
// Data model, validation and link building for a PayTree.me public page.
// Everything in this file runs on the server. The browser only ever receives
// the already-validated `ResolvedMethod[]` that `resolveMethods` returns, so a
// bad or malicious value stored in the database can never become a link.

import { avatarUrl } from "./avatar";

export const METHOD_IDS = [
  "cashapp",
  "venmo",
  "paypal",
  "stripe",
  "square",
  "wise",
  "custom",
  "zelle",
  "applecash",
  "chime",
  "ach",
  "wire",
  "check",
  "crypto",
] as const;

export type MethodId = (typeof METHOD_IDS)[number];

export type MethodGroup = "online" | "bank" | "crypto";

/** Names of the Lucide icons used on the public page (see payment-methods.tsx). */
export type MethodIcon =
  | "dollar-sign"
  | "wallet"
  | "credit-card"
  | "mail"
  | "phone"
  | "building"
  | "globe"
  | "coins"
  | "smartphone" // Apple Cash
  | "bell" // Chime
  | "landmark" // Wire transfer
  | "banknote" // Check by mail
  | "shopping-bag" // Square
  | "link"; // Custom link

/** PayTree accepts one crypto method: USDT on the Tron network (TRC-20). */
export const CRYPTO_COIN = "USDT";
export const CRYPTO_NETWORK = "Tron (TRC-20)";

export interface CryptoAccount {
  /** Tron address: starts with "T", 34 base58 characters. */
  address: string;
}

export interface AchAccount {
  /** 9-digit ABA routing number. */
  routing: string;
  /** 4 to 17 digit account number. */
  account: string;
}

export interface WireAccount {
  /** Name on the receiving account. */
  beneficiary: string;
  bankName: string;
  /** 9-digit ABA routing number used for domestic wires. */
  routing: string;
  account: string;
  /** Optional, for international senders: 8 or 11 characters. */
  swift?: string;
}

export interface CheckAddress {
  payableTo: string;
  line1: string;
  line2?: string;
  city: string;
  /** Two-letter US state code. */
  state: string;
  /** 5-digit ZIP, or ZIP+4. */
  zip: string;
}

export interface CustomLink {
  /** Button text, for example "Buy me a coffee". */
  label: string;
  /** Any public https address. */
  url: string;
}

/**
 * What the user typed into the dashboard. Every field is optional: a method
 * the user left empty is simply never shown on the public page.
 */
export interface PaymentSettings {
  cashapp?: string; // Cash App $cashtag, with or without the leading $
  venmo?: string; // Venmo username, with or without the leading @
  paypal?: string; // PayPal.Me name, or a pasted paypal.me link
  zelle?: string; // Zelle email address or US mobile number
  ach?: AchAccount;
  stripe?: string; // Stripe Payment Link, e.g. https://buy.stripe.com/abc123
  wise?: string; // Wise Pay link name, or a pasted wise.com/pay/me link
  crypto?: CryptoAccount;
  square?: string; // Square payment link, e.g. https://square.link/u/abc123
  applecash?: string; // Apple Cash phone number or Apple ID email
  chime?: string; // ChimeSign, with or without the leading $
  wire?: WireAccount;
  check?: CheckAddress;
  custom?: CustomLink;
}

export interface Profile {
  /** Database id. Present for real profiles, absent for the local sample. */
  id?: string;
  username: string;
  displayName: string;
  bio?: string;
  /** Public address of the profile photo, built by lib/avatar.ts. */
  avatarUrl?: string;
  /** The owner's chosen order of payment methods, first to last. */
  order?: MethodId[];
  /** True when the free trial has ended without a subscription. */
  paused?: boolean;
  /** True when the owner turned on the payment log ("I've paid" button). */
  paymentLog?: boolean;
  /** "tip" turns the page into a tip jar ("Send me a tip"). */
  pageMode?: "pay" | "tip";
  /** How many payment methods come before the "I've paid" box. null = after all. */
  paidPosition?: number | null;
  payments: PaymentSettings;
}

/** A payment method that passed validation, ready for the browser. */
export interface ResolvedMethod {
  id: MethodId;
  group: MethodGroup;
  label: string;
  icon: MethodIcon;
  kind: "link" | "copy";
  /** Secondary line under the label (handle, masked account, address). */
  detail: string;
  /** Short qualifier shown next to the label, e.g. "Card" or "Email". */
  tag?: string;
  /** kind === "link": where the button goes. */
  href?: string;
  /** kind === "link": web page to use when a custom-scheme app link fails. */
  fallbackHref?: string;
  /** kind === "link": short name used in the fallback toast. */
  fallbackName?: string;
  /** kind === "copy": exact text placed on the clipboard. */
  copyValue?: string;
  /** kind === "copy": confirmation shown in the toast. */
  copyToast?: string;
}

/* -------------------------------------------------------------------------- */
/* Username                                                                   */
/* -------------------------------------------------------------------------- */

const USERNAME_RULE = /^[a-z0-9][a-z0-9_.-]{2,29}$/;

/**
 * Names that must never become public pages, because they are (or may become)
 * routes of the app itself. Static routes such as /privacy already win over
 * the dynamic [username] route in Next.js, but reserving the names also stops
 * someone from claiming a page that could never be reached.
 */
//
// KEEP IN SYNC with the seed list in supabase/migrations/20261005000001_foundation.sql.
// The database enforces the same list, so a name can never be claimed by
// skipping this check.
export const RESERVED_USERNAMES = new Set([
  "about", "account", "admin", "api", "app", "apple-icon.png", "assets",
  "auth", "billing", "blog", "callback", "checkout", "confirm", "contact",
  "dashboard", "docs", "faq", "favicon.ico", "forgot", "help", "home",
  "icon.svg", "login", "logout", "manifest.webmanifest", "new",
  "official", "onboarding", "opengraph-image", "payments", "paytree",
  "pricing", "privacy", "register", "report", "reset", "robots.txt",
  "security", "settings", "signin", "signup", "sitemap.xml", "staff",
  "status", "support", "terms", "twitter-image", "verify", "webhook",
  "webhooks", "www",
]);

export function isReservedUsername(username: string): boolean {
  return RESERVED_USERNAMES.has(username.toLowerCase());
}

/** Returns the canonical lowercase username, or null when it is invalid or reserved. */
export function normalizeUsername(raw: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null;
  }
  const value = decoded.trim().toLowerCase();
  if (!USERNAME_RULE.test(value)) return null;
  if (isReservedUsername(value)) return null;
  return value;
}

/* -------------------------------------------------------------------------- */
/* Handle validation                                                          */
/* -------------------------------------------------------------------------- */

const CASHAPP_RULE = /^[A-Za-z0-9_]{1,20}$/;
const VENMO_RULE = /^[A-Za-z0-9_-]{5,30}$/;
const PAYPAL_RULE = /^[A-Za-z0-9]{1,20}$/;
const WISE_RULE = /^[A-Za-z0-9._-]{2,50}$/;

function cleanCashApp(raw: string | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim().replace(/^\$/, "").replace(/^(https?:\/\/)?cash\.app\/\$?/i, "");
  return CASHAPP_RULE.test(value) ? value : null;
}

function cleanVenmo(raw: string | undefined): string | null {
  if (!raw) return null;
  const value = raw
    .trim()
    .replace(/^@/, "")
    .replace(/^(https?:\/\/)?(www\.)?venmo\.com\/(u\/)?/i, "");
  return VENMO_RULE.test(value) ? value : null;
}

function cleanPayPal(raw: string | undefined): string | null {
  if (!raw) return null;
  const value = raw
    .trim()
    .replace(/^@/, "")
    .replace(/^(https?:\/\/)?(www\.)?paypal\.me\//i, "");
  return PAYPAL_RULE.test(value) ? value : null;
}

function cleanWise(raw: string | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim().replace(/^(https?:\/\/)?(www\.)?wise\.com\/pay\/me\//i, "");
  return WISE_RULE.test(value) ? value : null;
}

/**
 * Accepts only a Stripe Payment Link: https, an official Stripe Payment Link
 * host, no credentials or port, and a single path segment. Query strings and
 * fragments are dropped so nothing can be smuggled into the final link.
 */
const STRIPE_HOSTS = new Set(["buy.stripe.com", "donate.stripe.com"]);

function cleanStripe(raw: string | undefined): string | null {
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (!STRIPE_HOSTS.has(url.hostname)) return null;
  if (url.username || url.password || url.port) return null;
  if (!/^\/[A-Za-z0-9_-]{3,100}$/.test(url.pathname)) return null;
  return `https://${url.hostname}${url.pathname}`;
}

/* -------------------------------------------------------------------------- */
/* Bank and crypto validation                                                 */
/* -------------------------------------------------------------------------- */

const EMAIL_RULE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface CleanZelle {
  value: string;
  kind: "email" | "phone";
  display: string;
}

function cleanZelle(raw: string | undefined): CleanZelle | null {
  if (!raw) return null;
  const value = raw.trim();
  if (value.length > 254) return null;
  if (EMAIL_RULE.test(value)) return { value, kind: "email", display: value };
  const digits = value.replace(/[^\d]/g, "");
  // US mobile number: 10 digits, or 11 starting with the country code 1.
  if (/^1?\d{10}$/.test(digits) && /^[+\d\s().-]+$/.test(value)) {
    const ten = digits.length === 11 ? digits.slice(1) : digits;
    return {
      value: ten,
      kind: "phone",
      display: `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`,
    };
  }
  return null;
}

/** ABA routing number check: 9 digits and the weighted checksum equals 0 mod 10. */
export function isValidRoutingNumber(value: string): boolean {
  if (!/^\d{9}$/.test(value)) return false;
  const d = value.split("").map(Number);
  const sum =
    3 * (d[0] + d[3] + d[6]) +
    7 * (d[1] + d[4] + d[7]) +
    1 * (d[2] + d[5] + d[8]);
  return sum % 10 === 0;
}

function cleanAch(raw: AchAccount | undefined): AchAccount | null {
  if (!raw) return null;
  const routing = raw.routing.replace(/\s/g, "");
  const account = raw.account.replace(/\s/g, "");
  if (!isValidRoutingNumber(routing)) return null;
  if (!/^\d{4,17}$/.test(account)) return null;
  return { routing, account };
}

// Tron addresses are base58: "T" followed by 33 characters (no 0, O, I or l).
const TRON_ADDRESS = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;

interface CleanCrypto {
  address: string;
}

function cleanCrypto(raw: CryptoAccount | undefined): CleanCrypto | null {
  if (!raw) return null;
  const address = raw.address.trim();
  if (!TRON_ADDRESS.test(address)) return null;
  return { address };
}

/* -------------------------------------------------------------------------- */
/* Newer methods: Square, Apple Cash, Chime, wire, check, custom link         */
/* -------------------------------------------------------------------------- */

/** Square Payment Links live on square.link or checkout.square.site. */
const SQUARE_HOSTS = new Set(["square.link", "checkout.square.site"]);

function cleanSquare(raw: string | undefined): string | null {
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (!SQUARE_HOSTS.has(url.hostname)) return null;
  if (url.username || url.password || url.port) return null;
  // square.link/u/<token> or checkout.square.site/merchant/<id>/checkout/<token>
  if (!/^(\/[A-Za-z0-9_-]{1,64}){1,6}$/.test(url.pathname)) return null;
  return `https://${url.hostname}${url.pathname}`;
}

function cleanAppleCash(raw: string | undefined): CleanZelle | null {
  // Apple Cash is addressed by the phone number or Apple ID email, like Zelle.
  return cleanZelle(raw);
}

const CHIME_RULE = /^[A-Za-z0-9_.-]{2,30}$/;

function cleanChime(raw: string | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim().replace(/^\$/, "");
  return CHIME_RULE.test(value) ? value : null;
}

/** Plain text only: letters, digits, spaces and a few punctuation marks. */
const PLAIN_TEXT = /^[A-Za-z0-9][A-Za-z0-9 .,'&()#/-]{1,79}$/;
const SWIFT_RULE = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;

function plain(raw: string | undefined): string | null {
  const value = (raw ?? "").trim().replace(/\s+/g, " ");
  return PLAIN_TEXT.test(value) ? value : null;
}

function cleanWire(raw: WireAccount | undefined) {
  if (!raw) return null;
  const beneficiary = plain(raw.beneficiary);
  const bankName = plain(raw.bankName);
  const routing = raw.routing.replace(/\s/g, "");
  const account = raw.account.replace(/\s/g, "");
  if (!beneficiary || !bankName) return null;
  if (!isValidRoutingNumber(routing)) return null;
  if (!/^\d{4,17}$/.test(account)) return null;
  let swift: string | undefined;
  if (raw.swift && raw.swift.trim()) {
    swift = raw.swift.replace(/\s/g, "").toUpperCase();
    if (!SWIFT_RULE.test(swift)) return null;
  }
  return { beneficiary, bankName, routing, account, swift };
}

const US_STATES = new Set(
  "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(" "),
);

function cleanCheck(raw: CheckAddress | undefined) {
  if (!raw) return null;
  const payableTo = plain(raw.payableTo);
  const line1 = plain(raw.line1);
  const line2 = raw.line2 && raw.line2.trim() ? plain(raw.line2) : undefined;
  const city = plain(raw.city);
  const state = raw.state.trim().toUpperCase();
  const zip = raw.zip.trim();
  if (!payableTo || !line1 || !city) return null;
  if (raw.line2 && raw.line2.trim() && !line2) return null;
  if (!US_STATES.has(state)) return null;
  if (!/^\d{5}(-\d{4})?$/.test(zip)) return null;
  const lines = [payableTo, line1, ...(line2 ? [line2] : []), `${city}, ${state} ${zip}`];
  return { payableTo, text: lines.join("\n"), summary: `${line1}, ${city}, ${state} ${zip}` };
}

/**
 * A custom link is the riskiest input, because visitors will trust it. It must
 * be a plain https address on a real domain name (no IP addresses, no local
 * names, no credentials, no port). The page shows the destination domain
 * under the button so visitors can see where it leads.
 */
const LABEL_RULE = /^[A-Za-z0-9][A-Za-z0-9 .,'&!()-]{1,29}$/;

function cleanCustom(raw: CustomLink | undefined) {
  if (!raw) return null;
  const label = raw.label.trim().replace(/\s+/g, " ");
  if (!LABEL_RULE.test(label)) return null;
  const input = raw.url.trim();
  if (input.length > 500) return null;
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (url.username || url.password || url.port) return null;
  const host = url.hostname.toLowerCase();
  if (!/^([a-z0-9-]+\.)+[a-z]{2,}$/.test(host)) return null; // also rejects IPs and "localhost"
  if (host.endsWith(".local") || host.endsWith(".internal") || host.endsWith(".localhost")) return null;
  // Drop the fragment; keep path and query so deep links to a checkout still work.
  return { label, href: `https://${host}${url.pathname}${url.search}`, host };
}

/* -------------------------------------------------------------------------- */
/* Resolver: settings in, safe buttons out                                    */
/* -------------------------------------------------------------------------- */

/**
 * Turns the user's settings into the exact buttons shown on the page.
 * A method appears only if the user entered it AND the value is valid.
 * The order is fixed so the layout never jumps around between visits.
 */
export function resolveMethods(settings: PaymentSettings): ResolvedMethod[] {
  const methods: ResolvedMethod[] = [];

  const cashapp = cleanCashApp(settings.cashapp);
  if (cashapp) {
    methods.push({
      id: "cashapp",
      group: "online",
      label: "Cash App",
      icon: "dollar-sign",
      kind: "link",
      detail: `$${cashapp}`,
      // Universal link: opens the Cash App app on a phone that has it,
      // and the cash.app profile page everywhere else.
      href: `https://cash.app/$${encodeURIComponent(cashapp)}`,
    });
  }

  const venmo = cleanVenmo(settings.venmo);
  if (venmo) {
    const handle = encodeURIComponent(venmo);
    methods.push({
      id: "venmo",
      group: "online",
      label: "Venmo",
      icon: "wallet",
      kind: "link",
      detail: `@${venmo}`,
      // Custom URL scheme: opens the Venmo app directly on a phone.
      href: `venmo://paycharge?txn=pay&recipients=${handle}`,
      // Used automatically when the app does not open (desktop, no app).
      fallbackHref: `https://venmo.com/u/${handle}`,
      fallbackName: "Venmo",
    });
  }

  const paypal = cleanPayPal(settings.paypal);
  if (paypal) {
    methods.push({
      id: "paypal",
      group: "online",
      label: "PayPal",
      // Lucide ships no PayPal logo (brand icons were removed), so the
      // CreditCard icon stands in for it as requested.
      icon: "credit-card",
      kind: "link",
      detail: `paypal.me/${paypal}`,
      href: `https://paypal.me/${encodeURIComponent(paypal)}`,
    });
  }

  const stripe = cleanStripe(settings.stripe);
  if (stripe) {
    methods.push({
      id: "stripe",
      group: "online",
      label: "Stripe",
      icon: "credit-card",
      kind: "link",
      tag: "Card",
      detail: "Visa, Mastercard and other cards",
      href: stripe,
    });
  }

  const square = cleanSquare(settings.square);
  if (square) {
    methods.push({
      id: "square",
      group: "online",
      label: "Square",
      icon: "shopping-bag",
      kind: "link",
      tag: "Card",
      detail: "Pay securely with a card",
      href: square,
    });
  }

  const wise = cleanWise(settings.wise);
  if (wise) {
    methods.push({
      id: "wise",
      group: "online",
      label: "Wise",
      icon: "globe",
      kind: "link",
      tag: "International",
      detail: `wise.com/pay/me/${wise}`,
      href: `https://wise.com/pay/me/${encodeURIComponent(wise)}`,
    });
  }

  const custom = cleanCustom(settings.custom);
  if (custom) {
    methods.push({
      id: "custom",
      group: "online",
      label: custom.label,
      icon: "link",
      kind: "link",
      tag: "External link",
      // Showing the real domain lets visitors spot a link that looks wrong.
      detail: custom.host,
      href: custom.href,
    });
  }

  const zelle = cleanZelle(settings.zelle);
  if (zelle) {
    methods.push({
      id: "zelle",
      group: "bank",
      label: "Zelle",
      // The icon follows the account type: envelope for an email, handset for a phone number.
      icon: zelle.kind === "email" ? "mail" : "phone",
      kind: "copy",
      tag: zelle.kind === "email" ? "Email" : "Phone",
      detail: zelle.display,
      copyValue: zelle.value,
      copyToast:
        zelle.kind === "email"
          ? "Zelle email copied to clipboard"
          : "Zelle phone number copied to clipboard",
    });
  }

  const applecash = cleanAppleCash(settings.applecash);
  if (applecash) {
    methods.push({
      id: "applecash",
      group: "bank",
      label: "Apple Cash",
      icon: "smartphone",
      kind: "copy",
      tag: applecash.kind === "email" ? "Apple ID" : "Phone",
      detail: applecash.display,
      copyValue: applecash.value,
      copyToast: "Apple Cash contact copied to clipboard",
    });
  }

  const chime = cleanChime(settings.chime);
  if (chime) {
    methods.push({
      id: "chime",
      group: "bank",
      label: "Chime",
      icon: "bell",
      kind: "copy",
      tag: "ChimeSign",
      detail: `$${chime}`,
      copyValue: `$${chime}`,
      copyToast: "ChimeSign copied to clipboard",
    });
  }

  const ach = cleanAch(settings.ach);
  if (ach) {
    methods.push({
      id: "ach",
      group: "bank",
      label: "ACH bank transfer",
      icon: "building",
      kind: "copy",
      // The full account number is never rendered on screen, only copied.
      detail: `Routing ${ach.routing} · Account ••••${ach.account.slice(-4)}`,
      copyValue: `Routing: ${ach.routing}, Account: ${ach.account}`,
      copyToast: "ACH routing and account numbers copied",
    });
  }

  const wire = cleanWire(settings.wire);
  if (wire) {
    const lines = [
      `Beneficiary: ${wire.beneficiary}`,
      `Bank: ${wire.bankName}`,
      `Routing (ABA): ${wire.routing}`,
      `Account: ${wire.account}`,
      ...(wire.swift ? [`SWIFT: ${wire.swift}`] : []),
    ];
    methods.push({
      id: "wire",
      group: "bank",
      label: "Wire transfer",
      icon: "landmark",
      kind: "copy",
      tag: wire.swift ? "Domestic and international" : "Domestic",
      detail: `${wire.bankName} · Account ••••${wire.account.slice(-4)}`,
      copyValue: lines.join("\n"),
      copyToast: "Wire transfer details copied",
    });
  }

  const check = cleanCheck(settings.check);
  if (check) {
    methods.push({
      id: "check",
      group: "bank",
      label: "Check by mail",
      icon: "banknote",
      kind: "copy",
      tag: "Mail",
      detail: check.summary,
      copyValue: check.text,
      copyToast: "Mailing address copied to clipboard",
    });
  }

  const crypto = cleanCrypto(settings.crypto);
  if (crypto) {
    methods.push({
      id: "crypto",
      group: "crypto",
      label: "Crypto",
      icon: "coins",
      kind: "copy",
      tag: `${CRYPTO_COIN} · ${CRYPTO_NETWORK} network`,
      detail: crypto.address,
      copyValue: crypto.address,
      copyToast: `${CRYPTO_COIN} address copied to clipboard`,
    });
  }

  return methods;
}

/* -------------------------------------------------------------------------- */
/* Data access                                                                */
/* -------------------------------------------------------------------------- */

// SAMPLE DATA ONLY. These addresses and numbers are placeholders so the page
// renders during development. Never send real funds to them.
const SAMPLE_PROFILES: Record<string, Profile> = {
  hartwell: {
    username: "hartwell",
    displayName: "Hartwell Studio",
    bio: "Brand strategy and advisory sessions. Choose how you would like to pay.",
    payments: {
      cashapp: "$paytreedemo",
      venmo: "@paytree-demo",
      paypal: "paytreedemo",
      zelle: "pay@hartwell-demo.example",
      ach: { routing: "000000000", account: "000000000000" },
      stripe: "https://buy.stripe.com/test_paytreedemo",
      wise: "paytreedemo",
      square: "https://square.link/u/paytreedemo",
      applecash: "(555) 010-0142",
      chime: "$paytreedemo",
      wire: { beneficiary: "Hartwell Studio LLC", bankName: "Demo Bank", routing: "000000000", account: "000000000000", swift: "DEMOUS33" },
      check: { payableTo: "Hartwell Studio LLC", line1: "100 Example Street", city: "Springfield", state: "IL", zip: "62701" },
      custom: { label: "Buy me a coffee", url: "https://example.com/hartwell" },
      crypto: { address: "TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf" }, // sample address, not a real wallet
    },
  },
};

type MethodRow = { method_id: string; public_config: unknown };

const TEXT_METHODS = [
  "cashapp",
  "venmo",
  "paypal",
  "zelle",
  "stripe",
  "wise",
  "square",
  "applecash",
  "chime",
] as const;
type TextMethod = (typeof TEXT_METHODS)[number];

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/**
 * Turns payment_methods rows into PaymentSettings. public_config holds:
 *   text methods: { "value": "..." }        custom: { "label", "url" }
 *   crypto: { "address" }                    check: { "payableTo", "line1", "line2"?, "city", "state", "zip" }
 * ACH and wire need the encrypted bank details (payment_method_secrets), which
 * arrive with the bank-details phase, so they are skipped here.
 * Everything is validated again by resolveMethods before it reaches a page.
 */
export function settingsFromRows(rows: MethodRow[]): PaymentSettings {
  const settings: PaymentSettings = {};
  for (const row of rows) {
    const config =
      typeof row.public_config === "object" &&
      row.public_config !== null &&
      !Array.isArray(row.public_config)
        ? (row.public_config as Record<string, unknown>)
        : {};
    const id = row.method_id;

    const textId = TEXT_METHODS.find((m) => m === id);
    if (textId) {
      const value = text(config.value);
      if (value) settings[textId as TextMethod] = value;
    } else if (id === "custom") {
      const label = text(config.label);
      const url = text(config.url);
      if (label && url) settings.custom = { label, url };
    } else if (id === "crypto") {
      const address = text(config.address);
      if (address) settings.crypto = { address };
    } else if (id === "check") {
      const payableTo = text(config.payableTo);
      const line1 = text(config.line1);
      const city = text(config.city);
      const state = text(config.state);
      const zip = text(config.zip);
      if (payableTo && line1 && city && state && zip) {
        settings.check = { payableTo, line1, line2: text(config.line2), city, state, zip };
      }
    }
  }
  return settings;
}

/**
 * Loads a published profile for a visitor through the server-only client.
 * Direct public database reads cannot enforce the app's membership gate.
 *
 * Without Supabase (local development), the sample profile above is served,
 * and only outside production, so placeholder payment details never go live.
 */
export async function getProfileByUsername(rawUsername: string): Promise<Profile | null> {
  const username = normalizeUsername(rawUsername);
  if (!username) return null;

  const { createAdminClient } = await import("./supabase/admin");
  const supabase = createAdminClient();
  if (!supabase) {
    if (process.env.NODE_ENV === "production") return null;
    return SAMPLE_PROFILES[username] ?? null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, avatar_path")
    .eq("username", username)
    .eq("is_published", true)
    .maybeSingle();
  if (error || !data) return null;
  const profile = data as {
    id: string;
    username: string;
    display_name: string;
    bio: string | null;
    avatar_path: string | null;
  };

  // After the free trial, an unsubscribed page is paused (never deleted).
  const { accessFor } = await import("./billing");
  const access = await accessFor(profile.id);

  const { data: rows } = await supabase
    .from("payment_methods")
    .select("method_id, public_config")
    .eq("profile_id", profile.id)
    .eq("is_visible", true)
    .order("position", { ascending: true });

  const methodRows = (rows ?? []) as MethodRow[];

  // Read on its own so a missing column (migration not run yet) never breaks the page.
  const { data: logRow, error: logError } = await supabase
    .from("profiles")
    .select("payment_log_enabled")
    .eq("id", profile.id)
    .maybeSingle();
  const paymentLog =
    !logError && (logRow as { payment_log_enabled?: boolean } | null)?.payment_log_enabled === true;

  const { data: posRow, error: posError } = await supabase
    .from("profiles")
    .select("paid_box_position")
    .eq("id", profile.id)
    .maybeSingle();
  const rawPos = (posRow as { paid_box_position?: number | null } | null)?.paid_box_position;
  const paidPosition = !posError && typeof rawPos === "number" ? rawPos : null;

  const { data: modeRow, error: modeError } = await supabase
    .from("profiles")
    .select("page_mode")
    .eq("id", profile.id)
    .maybeSingle();
  const pageMode: "pay" | "tip" =
    !modeError && (modeRow as { page_mode?: string } | null)?.page_mode === "tip" ? "tip" : "pay";

  return {
    id: profile.id,
    paused: !access.active,
    paymentLog,
    pageMode,
    paidPosition,
    order: methodRows
      .map((row) => METHOD_IDS.find((m) => m === row.method_id))
      .filter((m): m is MethodId => Boolean(m)),
    username: String(profile.username),
    displayName: String(profile.display_name),
    bio: typeof profile.bio === "string" && profile.bio ? profile.bio : undefined,
    avatarUrl: avatarUrl(profile.avatar_path),
    payments: settingsFromRows(methodRows),
  };
}

/** Sorts resolved methods into the owner's chosen order. Unlisted ones keep their place at the end. */
export function applyOrder(methods: ResolvedMethod[], order: MethodId[] | undefined): ResolvedMethod[] {
  if (!order || order.length === 0) return methods;
  const rank = new Map(order.map((id, i) => [id, i] as const));
  return [...methods].sort((a, b) => (rank.get(a.id) ?? 999) - (rank.get(b.id) ?? 999));
}
