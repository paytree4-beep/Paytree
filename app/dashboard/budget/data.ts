// app/dashboard/budget/data.ts
//
// Loads the owner's budget: spending and income they added, their monthly
// commitments, and the PayTree payments they confirmed (they count as money
// in). Gives totals for today, any month (current by default) and its year.

import { cookies } from "next/headers";

import { cleanMonth, monthLength, totalsFor, treeState, type MoveRow } from "@/lib/budget";
import { dayKey, safeTimeZone } from "@/lib/payment-log";
import type { createClient } from "@/lib/supabase/server";
import { loadMoneyEntries } from "../money/data";

type Client = Awaited<ReturnType<typeof createClient>>;

export type CommitmentRow = { id: string; name: string; amount_cents: number; due_day: number; category: string };

const monthName = (month: string, style: "long" | "short" = "long") =>
  new Intl.DateTimeFormat("en-US", { month: style, timeZone: "UTC" }).format(new Date(`${month}-15T12:00:00Z`));

export async function loadBudget(supabase: Client, userId: string, opts: { month?: unknown } = {}) {
  const tzCookie = (await cookies()).get("pt_tz")?.value ?? null;
  const timeZone = safeTimeZone(tzCookie);
  const now = new Date();
  const today = dayKey(now, timeZone);
  const currentMonth = today.slice(0, 7);
  const month = cleanMonth(opts.month, currentMonth) ?? currentMonth;
  const year = month.slice(0, 4);
  const from = `${year < today.slice(0, 4) ? year : today.slice(0, 4)}-01-01`;

  const { data: moveData, error: movesError } = await supabase
    .from("money_moves")
    .select("id, kind, amount_cents, category, note, on_date, commitment_id")
    .eq("owner_id", userId)
    .gte("on_date", from)
    .order("on_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(10000);
  const moves = (moveData ?? []) as MoveRow[];

  const { data: commitmentData } = await supabase
    .from("commitments")
    .select("id, name, amount_cents, due_day, category")
    .eq("owner_id", userId)
    .order("due_day", { ascending: true });
  const commitments = (commitmentData ?? []) as CommitmentRow[];
  const paidIds = new Set(
    moves.filter((m) => m.commitment_id && m.on_date.slice(0, 7) === currentMonth).map((m) => m.commitment_id as string),
  );

  // Confirmed PayTree payments, per day in the owner's time zone.
  const payTreeByDay = new Map<string, number>();
  for (const e of await loadMoneyEntries(supabase, userId)) {
    const day = dayKey(new Date(e.at), timeZone);
    payTreeByDay.set(day, (payTreeByDay.get(day) ?? 0) + e.amountCents);
  }
  const payTreeIn = (inPeriod: (d: string) => boolean) => {
    let sum = 0;
    for (const [d, c] of payTreeByDay) if (inPeriod(d)) sum += c;
    return sum;
  };

  const inMonth = (d: string) => d.slice(0, 7) === month;
  const todayTotals = totalsFor(moves, payTreeByDay, (d) => d === today);
  const monthTotals = totalsFor(moves, payTreeByDay, inMonth);
  const yearTotals = totalsFor(moves, payTreeByDay, (d) => d.slice(0, 4) === year);
  const daysSoFar = month === currentMonth ? Number(today.slice(8, 10)) : monthLength(month);
  const dailyAverage = Math.round(monthTotals.spent / Math.max(1, daysSoFar));

  const lastMonthOfYear = year === today.slice(0, 4) ? Number(today.slice(5, 7)) : 12;
  const months = Array.from({ length: lastMonthOfYear }, (_, i) => {
    const m = `${year}-${String(i + 1).padStart(2, "0")}`;
    const totals = totalsFor(moves, payTreeByDay, (d) => d.slice(0, 7) === m);
    return { month: m, name: monthName(m, "short"), ...totals, tree: treeState(totals.income, totals.spent), seed: `${userId}:${m}` };
  });

  const tree = treeState(monthTotals.income, monthTotals.spent);

  // Read on its own, so a missing column never breaks the page.
  const { data: prefRow, error: prefError } = await supabase.from("profiles").select("daily_summary").eq("id", userId).maybeSingle();
  const dailySummary = prefError ? null : (prefRow as { daily_summary?: boolean } | null)?.daily_summary !== false;

  return {
    dailySummary,
    tzCookie,
    timeZone,
    today,
    currentMonth,
    month,
    year,
    monthName: monthName(month),
    isCurrentMonth: month === currentMonth,
    seed: `${userId}:${month}`,
    moves,
    monthMoves: moves.filter((m) => inMonth(m.on_date)),
    todayMoves: moves.filter((m) => m.on_date === today),
    commitments,
    paidIds,
    payTreeMonth: payTreeIn(inMonth),
    todayTotals,
    monthTotals,
    yearTotals,
    dailyAverage,
    months,
    tree,
    setupNeeded: !!movesError,
  };
}
