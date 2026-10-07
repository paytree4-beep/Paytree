// lib/budget-basics.ts
//
// The small, dependency-free pieces of the Money page that the browser needs
// too: categories, money and date formatting, and the same checks the server
// makes before saving. It imports nothing, so it is safe in client components
// (the bigger helper files pull in server-only code).

export const CATEGORIES = [
  { id: "food", label: "Food", icon: "🍔" },
  { id: "shopping", label: "Shopping", icon: "🛍️" },
  { id: "transport", label: "Transport", icon: "🚗" },
  { id: "bills", label: "Bills", icon: "🧾" },
  { id: "home", label: "Home", icon: "🏠" },
  { id: "health", label: "Health", icon: "💊" },
  { id: "fun", label: "Fun", icon: "🎉" },
  { id: "business", label: "Business", icon: "💼" },
  { id: "other", label: "Other", icon: "📦" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export function categoryOf(id: string | null | undefined) {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
}

export function formatMoney(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

/** "2026-10" -> "2026-09" (step -1) or "2026-11" (step 1). */
export function shiftMonth(month: string, step: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + step, 15));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** "$1,234.5" -> 123450. Anything that is not a positive amount with up to 2 decimals -> null. */
function amountToCents(raw: unknown): number | null {
  if (typeof raw !== "string") return null;
  const text = raw.replace(/[\s$,]/g, "");
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(text)) return null;
  const [whole, fraction = ""] = text.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents >= 1 && cents <= 100_000_000 ? cents : null;
}

function validDay(raw: unknown): string | null {
  if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const d = new Date(`${raw}T12:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== raw) return null;
  const year = d.getUTCFullYear();
  return year >= 2020 && year <= 2100 ? raw : null;
}

function cleanText(raw: unknown, max: number): string {
  if (typeof raw !== "string") return "";
  // eslint-disable-next-line no-control-regex
  return raw.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

export interface QuickMove {
  kind: "in" | "out";
  amountCents: number;
  category: CategoryId;
  note: string | null;
  onDate: string;
}

/** The same checks the server makes, so the page can show the entry before it is saved. */
export function checkMove(get: (name: string) => unknown, today: string): QuickMove | { error: "amount" } {
  const kind = get("kind") === "in" ? "in" : "out";
  const amount = amountToCents(get("amount"));
  if (amount === null) return { error: "amount" };
  const rawCategory = cleanText(get("category"), 20);
  const category = (CATEGORIES.find((c) => c.id === rawCategory)?.id ?? "other") as CategoryId;
  const note = cleanText(get("note"), 80);
  return { kind, amountCents: amount, category, note: note || null, onDate: validDay(get("on_date")) ?? today };
}
