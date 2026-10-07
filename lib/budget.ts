// lib/budget.ts
//
// Budget and the Money tree: what comes in, what goes out, monthly
// commitments (rent, phone, subscriptions), and how full the tree is.
// Pure helpers only (no database), so they can be tested.

import { parseAmount } from "./payment-log";
import { parseEventDate } from "./splits";

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

function clean(raw: unknown, max: number): string {
  if (typeof raw !== "string") return "";
  // eslint-disable-next-line no-control-regex
  return raw.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

export interface MoveInput {
  kind: "in" | "out";
  amountCents: number;
  category: CategoryId;
  note: string | null;
  onDate: string;
}

export function parseMove(get: (name: string) => unknown, today: string): MoveInput | { error: "amount" } {
  const kind = get("kind") === "in" ? "in" : "out";
  const amount = parseAmount(get("amount"));
  if (amount === null || amount === "invalid" || amount < 1 || amount > 100_000_000) return { error: "amount" };
  const rawCategory = clean(get("category"), 20);
  const category = (CATEGORIES.find((c) => c.id === rawCategory)?.id ?? "other") as CategoryId;
  const note = clean(get("note"), 80);
  return { kind, amountCents: amount, category, note: note || null, onDate: parseEventDate(get("on_date")) ?? today };
}

export interface CommitmentInput {
  name: string;
  amountCents: number;
  dueDay: number;
  category: CategoryId;
}

export function parseCommitment(get: (name: string) => unknown): CommitmentInput | { error: "name" | "amount" | "day" } {
  const name = clean(get("name"), 60);
  if (name.length < 2) return { error: "name" };
  const amount = parseAmount(get("amount"));
  if (amount === null || amount === "invalid" || amount < 100 || amount > 100_000_000) return { error: "amount" };
  const day = Number(clean(get("due_day"), 2));
  if (!Number.isInteger(day) || day < 1 || day > 31) return { error: "day" };
  const rawCategory = clean(get("category"), 20);
  const category = (CATEGORIES.find((c) => c.id === rawCategory)?.id ?? "bills") as CategoryId;
  return { name, amountCents: amount, dueDay: day, category };
}

export interface MoveRow {
  id: string;
  kind: "in" | "out";
  amount_cents: number;
  category: string;
  note: string | null;
  on_date: string;
  commitment_id: string | null;
}

export interface BudgetSummary {
  /** Money in this month: PayTree payments you confirmed + income you added. */
  income: number;
  spent: number;
  left: number;
  spentToday: number;
  /** Average spent per day so far this month. */
  dailyAverage: number;
  byCategory: { id: CategoryId; label: string; icon: string; cents: number }[];
}

/** `today` is "2026-10-07" in the owner's time zone. */
export function summarizeBudget(moves: MoveRow[], payTreeIncome: number, today: string): BudgetSummary {
  const month = today.slice(0, 7);
  let income = payTreeIncome;
  let spent = 0;
  let spentToday = 0;
  const byCat = new Map<string, number>();
  for (const m of moves) {
    if (m.on_date.slice(0, 7) !== month) continue;
    if (m.kind === "in") {
      income += m.amount_cents;
    } else {
      spent += m.amount_cents;
      if (m.on_date === today) spentToday += m.amount_cents;
      const cat = categoryOf(m.category).id;
      byCat.set(cat, (byCat.get(cat) ?? 0) + m.amount_cents);
    }
  }
  const dayOfMonth = Number(today.slice(8, 10)) || 1;
  return {
    income,
    spent,
    left: income - spent,
    spentToday,
    dailyAverage: Math.round(spent / dayOfMonth),
    byCategory: CATEGORIES.map((c) => ({ id: c.id, label: c.label, icon: c.icon, cents: byCat.get(c.id) ?? 0 }))
      .filter((c) => c.cents > 0)
      .sort((a, b) => b.cents - a.cents),
  };
}

export type CommitmentState =
  | { status: "paid" }
  | { status: "due"; days: number }
  | { status: "overdue"; days: number };

function daysInMonth(month: string): number {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Paid this month, due in N days, or N days late. Day 31 means the last day in short months. */
export function commitmentState(dueDay: number, paidThisMonth: boolean, today: string): CommitmentState {
  if (paidThisMonth) return { status: "paid" };
  const day = Number(today.slice(8, 10));
  const due = Math.min(dueDay, daysInMonth(today.slice(0, 7)));
  return day > due ? { status: "overdue", days: day - due } : { status: "due", days: due - day };
}

/** Room on the branches, and on the grass. */
export const TREE_SLOTS = 30;

export type AppleColor = "gold" | "red" | "green" | "yellow";

/** What one apple is worth, in cents: a shiny gold apple is the most valuable. */
export const APPLE_VALUES: Record<AppleColor, number> = { gold: 1_000_000, red: 100_000, green: 10_000, yellow: 1_000 };

/**
 * Money as apples, biggest first: $12,350 -> 1 gold, 2 red, 3 green, 5 yellow.
 * Amounts under $10 round to the nearest yellow apple. At most `max` apples.
 */
export function applesFor(cents: number, max: number = TREE_SLOTS): AppleColor[] {
  if (cents <= 0) return [];
  const gold = Math.floor(cents / APPLE_VALUES.gold);
  const afterGold = cents - gold * APPLE_VALUES.gold;
  const red = Math.floor(afterGold / APPLE_VALUES.red);
  const afterRed = afterGold - red * APPLE_VALUES.red;
  const green = Math.floor(afterRed / APPLE_VALUES.green);
  const yellow = Math.round((afterRed - green * APPLE_VALUES.green) / APPLE_VALUES.yellow);
  const out: AppleColor[] = [
    ...Array<AppleColor>(gold).fill("gold"),
    ...Array<AppleColor>(red).fill("red"),
    ...Array<AppleColor>(green).fill("green"),
    ...Array<AppleColor>(yellow).fill("yellow"),
  ];
  return out.slice(0, max);
}

export function countApples(apples: AppleColor[]): Record<AppleColor, number> {
  const c: Record<AppleColor, number> = { gold: 0, red: 0, green: 0, yellow: 0 };
  for (const a of apples) c[a] += 1;
  return c;
}

export type TreeMood = "empty" | "thriving" | "healthy" | "watch" | "care";

export interface TreeState {
  /** Money kept this month, as apples on the branches. */
  onTree: AppleColor[];
  /** Money spent this month, as apples on the grass. */
  fallen: AppleColor[];
  mood: TreeMood;
  label: string;
}

const MOOD_LABELS: Record<TreeMood, string> = {
  empty: "Ready to grow",
  thriving: "Thriving",
  healthy: "Healthy",
  watch: "Watch your spending",
  care: "Needs care",
};

/**
 * Apples on the tree = what is left this month (in = minus out), apples on
 * the grass = what was spent. Gold $10,000, red $1,000, green $100,
 * yellow $10, so a
 * bigger income really makes a fuller, redder tree, and every $10,000 is a
 * shiny gold apple.
 */
export function treeState(income: number, spent: number): TreeState {
  const onTree = applesFor(Math.max(0, income - spent));
  const fallen = applesFor(spent);
  if (income <= 0 && spent <= 0) return { onTree, fallen, mood: "empty", label: MOOD_LABELS.empty };
  const keptShare = income > 0 ? Math.max(0, (income - spent) / income) : 0;
  const mood: TreeMood = keptShare >= 0.6 ? "thriving" : keptShare >= 0.35 ? "healthy" : keptShare >= 0.15 ? "watch" : "care";
  return { onTree, fallen, mood, label: MOOD_LABELS[mood] };
}

export interface PeriodTotals {
  income: number;
  spent: number;
  left: number;
}

/**
 * Money in and out for the days that `inPeriod` accepts. `payTreeByDay` holds
 * confirmed PayTree payments per day ("2026-10-07" -> cents).
 */
export function totalsFor(moves: MoveRow[], payTreeByDay: Map<string, number>, inPeriod: (day: string) => boolean): PeriodTotals {
  let income = 0;
  let spent = 0;
  for (const [day, cents] of payTreeByDay) if (inPeriod(day)) income += cents;
  for (const m of moves) {
    if (!inPeriod(m.on_date)) continue;
    if (m.kind === "in") income += m.amount_cents;
    else spent += m.amount_cents;
  }
  return { income, spent, left: income - spent };
}

/** Number of days in "2026-02" (28). */
export function monthLength(month: string): number {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** "2026-10" -> "2026-09" (step -1) or "2026-11" (step 1). */
export function shiftMonth(month: string, step: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + step, 15));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** A valid "YYYY-MM" between 2020 and `latest`, or null. */
export function cleanMonth(raw: unknown, latest: string): string | null {
  if (typeof raw !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(raw)) return null;
  if (raw < "2020-01" || raw > latest) return null;
  return raw;
}
