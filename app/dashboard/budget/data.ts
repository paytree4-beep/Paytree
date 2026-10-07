// app/dashboard/budget/data.ts
//
// Loads the owner's budget for the current month: spending and income they
// added, their commitments, which commitments are paid this month, and the
// PayTree payments they confirmed (they count as money in).

import { cookies } from "next/headers";

import { summarizeBudget, treeState, type MoveRow } from "@/lib/budget";
import { summarizeMoney } from "@/lib/money";
import { dayKey, safeTimeZone } from "@/lib/payment-log";
import type { createClient } from "@/lib/supabase/server";
import { loadMoneyEntries } from "../money/data";

type Client = Awaited<ReturnType<typeof createClient>>;

export type CommitmentRow = { id: string; name: string; amount_cents: number; due_day: number; category: string };

export async function loadBudget(supabase: Client, userId: string) {
  const tzCookie = (await cookies()).get("pt_tz")?.value ?? null;
  const timeZone = safeTimeZone(tzCookie);
  const now = new Date();
  const today = dayKey(now, timeZone);
  const monthStart = `${today.slice(0, 7)}-01`;

  const { data: moveData, error: movesError } = await supabase
    .from("money_moves")
    .select("id, kind, amount_cents, category, note, on_date, commitment_id")
    .eq("owner_id", userId)
    .gte("on_date", monthStart)
    .order("on_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(2000);
  const moves = (moveData ?? []) as MoveRow[];

  const { data: commitmentData } = await supabase
    .from("commitments")
    .select("id, name, amount_cents, due_day, category")
    .eq("owner_id", userId)
    .order("due_day", { ascending: true });
  const commitments = (commitmentData ?? []) as CommitmentRow[];
  const paidIds = new Set(moves.filter((m) => m.commitment_id).map((m) => m.commitment_id as string));

  const payTree = summarizeMoney(await loadMoneyEntries(supabase, userId), now, timeZone).thisMonth;
  const summary = summarizeBudget(moves, payTree, today);
  const tree = treeState(summary.income, summary.spent);
  const monthName = new Intl.DateTimeFormat("en-US", { month: "long", timeZone }).format(now);

  const seed = `${userId}:${today.slice(0, 7)}`;

  // Read on its own, so a missing column never breaks the page.
  const { data: prefRow, error: prefError } = await supabase.from("profiles").select("daily_summary").eq("id", userId).maybeSingle();
  const dailySummary = prefError ? null : (prefRow as { daily_summary?: boolean } | null)?.daily_summary !== false;

  return { dailySummary, seed, tzCookie, timeZone, today, moves, commitments, paidIds, payTree, summary, tree, monthName, setupNeeded: !!movesError };
}
