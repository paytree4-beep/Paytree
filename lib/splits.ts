// lib/splits.ts
//
// Split the bill: helpers that need no database, so they can be tested.

import { parseAmount } from "./payment-log";

export interface SplitInput {
  title: string;
  totalCents: number;
  people: number;
}

export type SplitError = "title" | "amount" | "people";

function clean(raw: unknown, max: number): string {
  if (typeof raw !== "string") return "";
  // eslint-disable-next-line no-control-regex
  return raw.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

export function parseSplit(get: (name: string) => unknown): SplitInput | { error: SplitError } {
  const title = clean(get("title"), 60);
  if (title.length < 2) return { error: "title" };
  const amount = parseAmount(get("total"));
  if (amount === null || amount === "invalid" || amount < 100 || amount > 10_000_000) return { error: "amount" };
  const people = Number(clean(get("people"), 3));
  if (!Number.isInteger(people) || people < 2 || people > 50) return { error: "people" };
  return { title, totalCents: amount, people };
}

/** Each person's share, rounded up to the cent so the bill is always covered. */
export function shareCents(totalCents: number, people: number): number {
  return Math.ceil(totalCents / people);
}

export function cleanPayerName(raw: unknown): string | null {
  const name = clean(raw, 40);
  return name.length >= 1 ? name : null;
}

const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";

/** Short random id for the share link, e.g. "k7m2xq9a". */
export function newSplitId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export function isSplitId(raw: string): boolean {
  return /^[a-z0-9]{8}$/.test(raw);
}
