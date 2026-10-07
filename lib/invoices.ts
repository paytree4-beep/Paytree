// lib/invoices.ts
//
// Invoices: a bill for one customer ("Haircut for Sara, $60, due Friday").
// Helpers that need no database, so they can be tested.

import { parseAmount } from "./payment-log";
import { parseEventDate } from "./splits";

export interface InvoiceInput {
  customer: string;
  title: string;
  amountCents: number;
  /** "2026-10-09" or null. */
  dueDate: string | null;
  note: string | null;
}

export type InvoiceError = "customer" | "title" | "amount";

export type InvoiceStatus = "unpaid" | "waiting" | "paid";

function clean(raw: unknown, max: number): string {
  if (typeof raw !== "string") return "";
  // eslint-disable-next-line no-control-regex
  return raw.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

export function parseInvoice(get: (name: string) => unknown): InvoiceInput | { error: InvoiceError } {
  const customer = clean(get("customer"), 60);
  if (customer.length < 2) return { error: "customer" };
  const title = clean(get("title"), 80);
  if (title.length < 2) return { error: "title" };
  const amount = parseAmount(get("amount"));
  if (amount === null || amount === "invalid" || amount < 100 || amount > 10_000_000) return { error: "amount" };
  const note = clean(get("note"), 200);
  return { customer, title, amountCents: amount, dueDate: parseEventDate(get("due_date")), note: note || null };
}

export function invoiceStatus(row: { claimed_at: string | null; confirmed_at: string | null }): InvoiceStatus {
  if (row.confirmed_at) return "paid";
  if (row.claimed_at) return "waiting";
  return "unpaid";
}

/** True when the due date has passed and the invoice is not paid yet. */
export function isOverdue(dueDate: string | null, status: InvoiceStatus, today: string): boolean {
  return !!dueDate && status !== "paid" && dueDate < today;
}
