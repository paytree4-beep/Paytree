// lib/payment-log.ts
//
// The payment log: an optional, members-only feature. On the public page a
// customer taps "I've paid" and leaves their name, the amount and how they
// paid. The owner sees it in the dashboard, checks their app, and marks it
// Received. Received payments add up into today / this month totals and can
// be downloaded for Excel.
//
// A note from a customer is NOT proof of payment. The owner always confirms
// in their own app before marking it Received.
//
// Pure helpers only (no database), so they can be tested on their own.

import { METHOD_IDS, type MethodId } from "./profiles";

export type ClaimMethod = MethodId | "cash" | "other";
export type ClaimStatus = "pending" | "received" | "dismissed";

export const CLAIM_METHODS: readonly ClaimMethod[] = [...METHOD_IDS, "cash", "other"];

const METHOD_LABELS: Record<ClaimMethod, string> = {
  cashapp: "Cash App",
  venmo: "Venmo",
  paypal: "PayPal",
  stripe: "Card (Stripe)",
  square: "Card (Square)",
  wise: "Wise",
  custom: "Payment link",
  zelle: "Zelle",
  applecash: "Apple Cash",
  chime: "Chime",
  ach: "Bank transfer",
  wire: "Wire transfer",
  check: "Check",
  crypto: "Crypto",
  cash: "Cash",
  other: "Other",
};

export function methodLabel(method: string | null | undefined): string {
  if (!method) return "Not given";
  return (METHOD_LABELS as Record<string, string>)[method] ?? "Other";
}

/** Largest amount accepted from the form: $1,000,000. */
export const MAX_AMOUNT_CENTS = 100_000_000;

/**
 * "$1,234.5" -> 123450. Empty -> null (amount is optional).
 * Returns "invalid" for anything that is not a positive amount with up to 2 decimals.
 */
export function parseAmount(raw: unknown): number | null | "invalid" {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== "string") return "invalid";
  const text = raw.replace(/[\s$,]/g, "");
  if (text === "") return null;
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(text)) return "invalid";
  const [whole, fraction = ""] = text.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents <= 0 || cents > MAX_AMOUNT_CENTS) return "invalid";
  return cents;
}

export function formatMoney(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function cleanText(raw: unknown, max: number): string {
  if (typeof raw !== "string") return "";
  // Collapse whitespace and drop control characters.
  // eslint-disable-next-line no-control-regex
  return raw.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

export interface ClaimInput {
  payerName: string;
  amountCents: number | null;
  method: ClaimMethod | null;
  note: string | null;
}

export type ClaimError = "name" | "amount" | "method";

/** Validates the public "I've paid" form. */
export function parseClaim(get: (name: string) => unknown): ClaimInput | { error: ClaimError } {
  const payerName = cleanText(get("payer_name"), 60);
  if (payerName.length < 2) return { error: "name" };

  const amount = parseAmount(get("amount"));
  if (amount === "invalid") return { error: "amount" };

  const rawMethod = get("method");
  let method: ClaimMethod | null = null;
  if (typeof rawMethod === "string" && rawMethod !== "") {
    const found = CLAIM_METHODS.find((m) => m === rawMethod);
    if (!found) return { error: "method" };
    method = found;
  }

  const note = cleanText(get("note"), 140);
  return { payerName, amountCents: amount, method, note: note || null };
}

/** A time zone name the browser reported, or New York if it is missing or unknown. */
export function safeTimeZone(raw: string | null | undefined): string {
  const fallback = "America/New_York";
  if (!raw || raw.length > 64) return fallback;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: raw });
    return raw;
  } catch {
    return fallback;
  }
}

/** "2026-10-06" for the given moment in the given time zone. */
export function dayKey(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export interface ClaimRow {
  id: string;
  payer_name: string;
  amount_cents: number | null;
  method: string | null;
  note: string | null;
  status: ClaimStatus;
  created_at: string;
  received_at: string | null;
}

export interface LogTotals {
  todayCents: number;
  todayCount: number;
  monthCents: number;
  monthCount: number;
  pendingCount: number;
}

/**
 * Totals of RECEIVED payments, by the day the customer reported them, in the
 * owner's time zone. Pending ones are only counted.
 */
export function summarizeClaims(rows: ClaimRow[], now: Date, timeZone: string): LogTotals {
  const today = dayKey(now, timeZone);
  const month = today.slice(0, 7);
  const totals: LogTotals = { todayCents: 0, todayCount: 0, monthCents: 0, monthCount: 0, pendingCount: 0 };
  for (const row of rows) {
    if (row.status === "pending") {
      totals.pendingCount += 1;
      continue;
    }
    if (row.status !== "received") continue;
    const day = dayKey(new Date(row.created_at), timeZone);
    const cents = row.amount_cents ?? 0;
    if (day.slice(0, 7) === month) {
      totals.monthCents += cents;
      totals.monthCount += 1;
      if (day === today) {
        totals.todayCents += cents;
        totals.todayCount += 1;
      }
    }
  }
  return totals;
}

/** Friendly date and time, for example "Oct 6, 2:15 PM". */
export function formatWhen(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function csvCell(value: string): string {
  // Stop spreadsheet formulas from running (CSV injection), then quote.
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

const STATUS_LABELS: Record<ClaimStatus, string> = {
  pending: "Waiting",
  received: "Received",
  dismissed: "Not received",
};

/** A CSV file that opens cleanly in Excel and Google Sheets. */
export function claimsToCsv(rows: ClaimRow[], timeZone: string): string {
  const header = ["Date", "Time", "Name", "Amount (USD)", "Paid with", "Note", "Status"];
  const lines = [header.map(csvCell).join(",")];
  for (const row of rows) {
    const date = new Date(row.created_at);
    const time = new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", minute: "2-digit" }).format(date);
    lines.push(
      [
        dayKey(date, timeZone),
        time,
        row.payer_name,
        row.amount_cents === null ? "" : (row.amount_cents / 100).toFixed(2),
        methodLabel(row.method),
        row.note ?? "",
        STATUS_LABELS[row.status] ?? row.status,
      ]
        .map(csvCell)
        .join(","),
    );
  }
  // The byte-order mark tells Excel the file is UTF-8 (names with accents, Arabic, etc.).
  return `﻿${lines.join("\r\n")}\r\n`;
}
