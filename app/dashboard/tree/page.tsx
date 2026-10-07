// app/dashboard/tree/page.tsx
//
// My money tree: every dollar that comes in grows apples, every dollar spent
// makes some fall. A picture of how this month is going, to keep or share
// (the shared picture never shows amounts).

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Logo } from "@/components/brand/logo";
import { MoneyTree } from "@/components/budget/money-tree";
import { TreeShare } from "@/components/budget/tree-share";
import { TimeZoneCookie } from "@/components/dashboard/time-zone-cookie";
import { APPLE_VALUES, countApples } from "@/lib/budget";
import { formatMoney } from "@/lib/payment-log";
import { createClient } from "@/lib/supabase/server";
import { loadBudget } from "../budget/data";

export const metadata: Metadata = { title: "My money tree", robots: { index: false } };
export const dynamic = "force-dynamic";

const TIPS: Record<string, string> = {
  empty: "Add money you receive and what you spend, and watch your tree grow.",
  thriving: "Beautiful! You kept most of what came in this month.",
  healthy: "Nice and steady. Keep an eye on the small daily spends.",
  watch: "Many apples fell. Check where the money went in your budget.",
  care: "More went out than came in. A few small changes can save your tree.",
};

export default async function TreePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/tree");

  const b = await loadBudget(supabase, user.id);
  const { tree } = b;
  const summary = b.monthTotals;
  const kept = countApples(tree.onTree);
  const fell = countApples(tree.fallen);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E6F2EA] via-[#F4F3E8] to-[#FAF5EA] text-[#0B1F18]">
      <TimeZoneCookie current={b.tzCookie} />
      <header className="sticky top-0 z-40 border-b border-white/80 bg-[#FAF5EA]/85 px-4 py-2.5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[880px] items-center justify-between gap-4">
          <Logo size={30} tone="dark" />
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center rounded-full border-2 border-[#064E3B] bg-white px-5 text-[15px] font-bold text-[#064E3B]"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-[560px] flex-col items-center gap-4 px-5 pb-20 pt-6 text-center">
        <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-[#9A6E1A]">My money tree · {b.monthName}</p>
        <h1 className="font-serif text-[40px] leading-[1.05] text-[#064E3B]">{tree.label}</h1>
        <p className="max-w-[420px] text-[15px] text-[#3F574C]">{TIPS[tree.mood]}</p>

        <div className="w-full max-w-[420px]">
          <MoneyTree apples={tree.onTree} fallen={tree.fallen} seed={b.seed} />
        </div>

        <div className="grid w-full grid-cols-2 gap-2">
          <div className="rounded-2xl border border-white/90 bg-white/85 p-3">
            <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#3F574C]">🍎 On the tree</p>
            <p className="mt-1 text-[18px] font-bold">
              {kept.gold > 0 ? `🌟 ${kept.gold} · ` : ""}🍎 {kept.red} · 🍏 {kept.green} · 🍋 {kept.yellow}
            </p>
            <p className="mt-1 text-[12px] text-[#4B6358]">
              Kept {formatMoney(Math.max(0, summary.left))} of {formatMoney(summary.income)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/90 bg-white/85 p-3">
            <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#3F574C]">🍂 Fell</p>
            <p className="mt-1 text-[18px] font-bold">
              {fell.gold > 0 ? `🌟 ${fell.gold} · ` : ""}🍎 {fell.red} · 🍏 {fell.green} · 🍋 {fell.yellow}
            </p>
            <p className="mt-1 text-[12px] text-[#4B6358]">Spent {formatMoney(summary.spent)}</p>
          </div>
        </div>

        <div className="flex w-full flex-wrap justify-center gap-2 text-[13px] font-semibold text-[#3F574C]">
          <span className="rounded-full bg-white/85 px-3 py-1">🌟 Gold = {formatMoney(APPLE_VALUES.gold).replace(".00", "")}</span>
          <span className="rounded-full bg-white/85 px-3 py-1">🍎 Red = {formatMoney(APPLE_VALUES.red).replace(".00", "")}</span>
          <span className="rounded-full bg-white/85 px-3 py-1">🍏 Green = {formatMoney(APPLE_VALUES.green).replace(".00", "")}</span>
          <span className="rounded-full bg-white/85 px-3 py-1">🍋 Yellow = {formatMoney(APPLE_VALUES.yellow).replace(".00", "")}</span>
        </div>

        <TreeShare svgId="money-tree" month={b.monthName} label={tree.label} onTree={tree.onTree.length} />

        <p className="mt-2 max-w-[420px] text-[13px] text-[#4B6358]">
          How it works: what you keep this month hangs on your tree as apples, and what you spend falls to the grass. A shiny gold
          apple is $10,000, a red one $1,000, a green one $100 and a yellow one $10, so the more you keep, the fuller and redder your tree. A new
          tree grows every month.
        </p>
        {b.months.length > 1 ? (
          <section className="mt-4 w-full">
            <h2 className="font-serif text-[30px] text-[#064E3B]">My year 🌳</h2>
            <p className="text-[14px] text-[#3F574C]">Every month grows a new tree. Tap one to see that month.</p>
            <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {b.months.map((m) => (
                <li key={m.month}>
                  <Link
                    href={`/dashboard/budget?period=month${m.month !== b.currentMonth ? `&m=${m.month}` : ""}`}
                    className={`flex flex-col items-center rounded-2xl border bg-white/85 p-2 ${
                      m.month === b.currentMonth ? "border-[#C9A048]" : "border-white/90"
                    }`}
                  >
                    <MoneyTree apples={m.tree.onTree} fallen={m.tree.fallen} id={`year-${m.month}`} seed={m.seed} />
                    <span className="text-[14px] font-bold text-[#064E3B]">{m.name}</span>
                    <span className="text-[11px] text-[#4B6358]">{m.tree.mood === "empty" ? "—" : m.tree.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <Link
          href="/dashboard/budget"
          className="inline-flex min-h-12 items-center rounded-full border-2 border-[#064E3B] bg-white px-6 font-bold text-[#064E3B]"
        >
          Add spending or income
        </Link>
      </main>
    </div>
  );
}
