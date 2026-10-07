// lib/money.ts
//
// "Money": every confirmed payment in one place, whatever it came from (the
// public page's payment log, invoices, or split bills). Pure helpers only,
// so they can be tested; the database loading lives in the page.

import { csvCell, dayKey, methodLabel } from "./payment-log";

export type MoneySource = "page" | "invoice" | "split";

export interface MoneyEntry {
  source: MoneySource;
  /** When the owner confirmed the money arrived (ISO). */
  at: string;
  amountCents: number;
  /** Who paid. */
  from: string;
  /** What it was for. */
  what: string;
  method: string | null;
}

export const SOURCE_LABELS: Record<MoneySource, string> = {
  page: "Payment page",
  invoice: "Invoices",
  split: "Split the bill",
};

export interface MoneySummary {
  today: number;
  thisMonth: number;
  thisYear: number;
  allTime: number;
  count: number;
  /** This month, per source. */
  bySource: Record<MoneySource, number>;
  /** The last 6 months, oldest first: { month: "2026-10", label: "Oct", cents }. */
  months: { month: string; label: string; cents: number }[];
}

function monthLabel(month: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(new Date(`${month}-15T12:00:00Z`));
}

function previousMonths(current: string, count: number): string[] {
  const [y, m] = current.split("-").map(Number);
  const out: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(y, m - 1 - i, 15));
    out.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

export function summarizeMoney(entries: MoneyEntry[], now: Date, timeZone: string): MoneySummary {
  const today = dayKey(now, timeZone);
  const month = today.slice(0, 7);
  const year = today.slice(0, 4);
  const months = previousMonths(month, 6);
  const perMonth = new Map(months.map((m) => [m, 0]));
  const summary: MoneySummary = {
    today: 0,
    thisMonth: 0,
    thisYear: 0,
    allTime: 0,
    count: 0,
    bySource: { page: 0, invoice: 0, split: 0 },
    months: [],
  };
  for (const e of entries) {
    const day = dayKey(new Date(e.at), timeZone);
    summary.allTime += e.amountCents;
    summary.count += 1;
    if (day === today) summary.today += e.amountCents;
    if (day.slice(0, 4) === year) summary.thisYear += e.amountCents;
    if (day.slice(0, 7) === month) {
      summary.thisMonth += e.amountCents;
      summary.bySource[e.source] += e.amountCents;
    }
    const key = day.slice(0, 7);
    if (perMonth.has(key)) perMonth.set(key, (perMonth.get(key) ?? 0) + e.amountCents);
  }
  summary.months = months.map((m) => ({ month: m, label: monthLabel(m), cents: perMonth.get(m) ?? 0 }));
  return summary;
}

/** Newest first. */
export function sortEntries(entries: MoneyEntry[]): MoneyEntry[] {
  return [...entries].sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
}

/** One CSV with every confirmed payment, for Excel and Google Sheets. */
export function moneyToCsv(entries: MoneyEntry[], timeZone: string): string {
  const header = ["Date", "Time", "From", "For", "Amount (USD)", "Paid with", "Source"];
  const lines = [header.map(csvCell).join(",")];
  for (const e of sortEntries(entries)) {
    const date = new Date(e.at);
    const time = new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", minute: "2-digit" }).format(date);
    lines.push(
      [dayKey(date, timeZone), time, e.from, e.what, (e.amountCents / 100).toFixed(2), e.method ? methodLabel(e.method) : "", SOURCE_LABELS[e.source]]
        .map(csvCell)
        .join(","),
    );
  }
  return `﻿${lines.join("\r\n")}\r\n`;
}
