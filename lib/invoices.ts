// lib/invoices.ts
//
// Invoices: a bill for one customer ("Haircut for Sara, $60, due Friday").
// Helpers that need no database, so they can be tested.

import { csvCell, dayKey, methodLabel, parseAmount } from "./payment-log";
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

export interface InvoiceRow {
  id: string;
  customer: string;
  title: string;
  amount_cents: number;
  due_date: string | null;
  note?: string | null;
  claimed_at: string | null;
  claimed_method: string | null;
  confirmed_at: string | null;
  created_at: string;
}

export interface InvoiceTotals {
  receivedToday: number;
  receivedThisMonth: number;
  receivedThisYear: number;
  receivedAll: number;
  waiting: number;
  unpaid: number;
  paidCount: number;
}

/** Money from invoices: received (by the day the owner confirmed), waiting and unpaid. */
export function summarizeInvoices(rows: InvoiceRow[], now: Date, timeZone: string): InvoiceTotals {
  const today = dayKey(now, timeZone);
  const month = today.slice(0, 7);
  const year = today.slice(0, 4);
  const totals: InvoiceTotals = {
    receivedToday: 0,
    receivedThisMonth: 0,
    receivedThisYear: 0,
    receivedAll: 0,
    waiting: 0,
    unpaid: 0,
    paidCount: 0,
  };
  for (const row of rows) {
    const status = invoiceStatus(row);
    if (status === "paid") {
      totals.receivedAll += row.amount_cents;
      totals.paidCount += 1;
      const day = row.confirmed_at ? dayKey(new Date(row.confirmed_at), timeZone) : "";
      if (day === today) totals.receivedToday += row.amount_cents;
      if (day.slice(0, 7) === month) totals.receivedThisMonth += row.amount_cents;
      if (day.slice(0, 4) === year) totals.receivedThisYear += row.amount_cents;
    } else if (status === "waiting") {
      totals.waiting += row.amount_cents;
    } else {
      totals.unpaid += row.amount_cents;
    }
  }
  return totals;
}

const STATUS_TEXT: Record<InvoiceStatus, string> = { unpaid: "Not paid", waiting: "Says paid", paid: "Paid" };

/** A CSV of invoices that opens cleanly in Excel and Google Sheets. */
export function invoicesToCsv(rows: InvoiceRow[], timeZone: string): string {
  const day = (iso: string | null) => (iso ? dayKey(new Date(iso), timeZone) : "");
  const header = ["Created", "Customer", "For", "Amount (USD)", "Due", "Status", "Paid with", "Marked paid", "Confirmed", "Note"];
  const lines = [header.map(csvCell).join(",")];
  for (const row of rows) {
    lines.push(
      [
        day(row.created_at),
        row.customer,
        row.title,
        (row.amount_cents / 100).toFixed(2),
        row.due_date ?? "",
        STATUS_TEXT[invoiceStatus(row)],
        row.claimed_method ? methodLabel(row.claimed_method) : "",
        day(row.claimed_at),
        day(row.confirmed_at),
        row.note ?? "",
      ]
        .map(csvCell)
        .join(","),
    );
  }
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

