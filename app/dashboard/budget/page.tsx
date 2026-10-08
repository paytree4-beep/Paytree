// app/dashboard/budget/page.tsx
//
// Money: one simple page. What came in and what you spent (today, this month,
// this year), the money tree, and your monthly bills. Invoices and split bills
// you confirm are added to "Came in" by themselves. Private to the owner.

import { getPageUser } from "@/lib/supabase/user";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Notice } from "@/components/auth/fields";
import { SubmitButton } from "@/components/auth/submit-button";
import { Logo } from "@/components/brand/logo";
import { MoneyBoard, type BoardEntry } from "@/components/budget/money-board";
import { MoneyTree } from "@/components/budget/money-tree";
import { TimeZoneCookie } from "@/components/dashboard/time-zone-cookie";
import { param, type SearchParams } from "@/lib/auth";
import { CATEGORIES, categoryOf, commitmentState } from "@/lib/budget";
import { SOURCE_LABELS } from "@/lib/money";
import { dayKey, formatMoney } from "@/lib/payment-log";
import { createClient } from "@/lib/supabase/server";
import { addCommitment, deleteCommitment, payCommitment } from "./actions";
import { loadBudget } from "./data";

export const metadata: Metadata = { title: "Income & spending", robots: { index: false } };
export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  c_name: "Give the bill a name, for example Rent.",
  c_amount: "Enter the monthly amount, at least $1.00.",
  c_day: "Pick the day of the month it is due (1 to 31).",
  save: "We could not save that. Please try again.",
};
const NOTICES: Record<string, string> = {
  commitment: "Monthly bill added. It will show every month.",
  paid: "Marked as paid for this month.",
};

const input =
  "min-h-[52px] w-full rounded-xl border border-[#C9D6CE] bg-white px-4 text-base text-[#0B1F18] outline-none focus:border-[#064E3B]";

const SOURCE_ICONS = { page: "🔗", invoice: "🧾", split: "🍕" } as const;

export default async function BudgetPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const user = await getPageUser(supabase);
  if (!user) redirect("/login?next=/dashboard/budget");

  const params = await searchParams;
  const b = await loadBudget(supabase, user.id, { month: param(params, "m") });
  const requested = param(params, "period");
  const period: "today" | "month" | "year" = requested === "month" || requested === "year" ? requested : "today";
  const error = param(params, "error");
  const notice = param(params, "notice");
  const commitmentsTotal = b.commitments.reduce((sum, c) => sum + c.amount_cents, 0);
  const commitmentsLeft = b.commitments.filter((c) => !b.paidIds.has(c.id)).reduce((sum, c) => sum + c.amount_cents, 0);

  const entries: BoardEntry[] = [
    ...b.moves.map((m): BoardEntry => {
      const cat = categoryOf(m.category);
      return {
        id: m.id,
        kind: m.kind,
        cents: m.amount_cents,
        date: m.on_date,
        title: m.note ?? (m.kind === "in" ? "Income" : cat.label),
        sub: m.kind === "out" ? cat.label : "Added by you",
        icon: m.kind === "in" ? "💵" : cat.icon,
        own: true,
        category: m.category,
      };
    }),
    ...b.autoEntries.map(
      (e, i): BoardEntry => ({
        id: `auto-${i}`,
        kind: "in",
        cents: e.amountCents,
        date: dayKey(new Date(e.at), b.timeZone),
        title: e.from,
        sub: `${SOURCE_LABELS[e.source]} · ${e.what}`,
        icon: SOURCE_ICONS[e.source],
        own: false,
        href: e.href,
      }),
    ),
  ].sort((x, y) => (x.date < y.date ? 1 : x.date > y.date ? -1 : 0));

  return (
    <div className="min-h-screen bg-[#FAF5EA] text-[#0B1F18]">
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

      <main className="mx-auto flex max-w-[880px] flex-col gap-5 px-5 pb-20 pt-6">
        <div>
          <h1 className="font-serif text-[38px] leading-[1.05] text-[#064E3B]">Income &amp; spending 💰</h1>
          <p className="mt-2 text-[15px] text-[#3F574C]">
            What came in and what you spent. Only you can see this page. PayTree never holds your money.
          </p>
        </div>

        {b.setupNeeded ? <Notice tone="error">Money is being set up. Please try again in a few minutes.</Notice> : null}
        {error && ERRORS[error] ? <Notice tone="error">{ERRORS[error]}</Notice> : null}
        {notice && NOTICES[notice] ? <Notice tone="success">{NOTICES[notice]}</Notice> : null}

        <MoneyBoard entries={entries} today={b.today} month={b.month} firstMonth={b.firstMonth} initialPeriod={period} />

        <Link href="/dashboard/tree" className="flex items-center gap-3 rounded-2xl border border-[#DCE5DF] bg-white p-3 pr-4 hover:bg-[#F7FAF8]">
          <span className="w-16 flex-none">
            <MoneyTree apples={b.tree.onTree} fallen={b.tree.fallen} id="mini-tree" seed={b.seed} />
          </span>
          <span className="flex-1">
            <span className="block font-bold text-[#064E3B]">My money tree 🌳</span>
            <span className="text-[13px] text-[#3F574C]">
              {b.tree.label} · {b.tree.onTree.length} {b.tree.onTree.length === 1 ? "apple" : "apples"} on the tree
            </span>
          </span>
          <span className="font-bold text-[#064E3B]">›</span>
        </Link>

        {/* Commitments */}
        <section id="commitments" className="scroll-mt-20 rounded-2xl border border-[#DCE5DF] bg-white p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-[#4B6358]">Monthly bills</h2>
            {b.commitments.length > 0 ? (
              <p className="text-[13px] font-semibold text-[#3F574C]">
                {formatMoney(commitmentsTotal)} a month · <span className="text-[#B42318]">{formatMoney(commitmentsLeft)} left to pay</span>
              </p>
            ) : null}
          </div>
          {b.commitments.length === 0 ? (
            <p className="mt-2 text-[15px] text-[#4B6358]">Rent, phone, car, subscriptions: add them once and see what is due every month. Optional.</p>
          ) : (
            <ul className="mt-3 divide-y divide-[#EEF3F0]">
              {b.commitments.map((c) => {
                const state = commitmentState(c.due_day, b.paidIds.has(c.id), b.today);
                return (
                  <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <div>
                      <p className="font-bold">
                        {categoryOf(c.category).icon} {c.name} · {formatMoney(c.amount_cents)}
                      </p>
                      <p
                        className={`text-[13px] font-semibold ${
                          state.status === "paid" ? "text-[#16A34A]" : state.status === "overdue" ? "text-[#B42318]" : "text-[#7A5A12]"
                        }`}
                      >
                        {state.status === "paid"
                          ? "Paid this month ✓"
                          : state.status === "overdue"
                            ? `Late by ${state.days} ${state.days === 1 ? "day" : "days"}`
                            : state.days === 0
                              ? "Due today"
                              : `Due in ${state.days} ${state.days === 1 ? "day" : "days"} · every month on day ${c.due_day}`}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {state.status !== "paid" ? (
                        <form action={payCommitment}>
                          <input type="hidden" name="id" value={c.id} />
                          <button type="submit" className="inline-flex min-h-10 items-center rounded-full bg-[#064E3B] px-4 text-[13px] font-bold text-white">
                            I paid it ✓
                          </button>
                        </form>
                      ) : null}
                      <form action={deleteCommitment}>
                        <input type="hidden" name="id" value={c.id} />
                        <button type="submit" className="inline-flex min-h-10 items-center px-2 text-[13px] text-[#B42318] underline underline-offset-2">
                          Remove
                        </button>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <details className="mt-3 rounded-xl bg-[#F7FAF8] px-3 py-2" open={b.commitments.length === 0}>
            <summary className="flex min-h-10 cursor-pointer list-none items-center font-bold text-[#064E3B] [&::-webkit-details-marker]:hidden">
              + Add a monthly bill
            </summary>
            <form action={addCommitment} className="flex flex-col gap-3 pb-2" noValidate>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold">Name</span>
                <input name="name" maxLength={60} placeholder="Rent" className={input} />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-semibold">Amount a month</span>
                  <span className="flex min-h-[52px] items-center rounded-xl border border-[#C9D6CE] bg-white px-4 focus-within:border-[#064E3B]">
                    <span className="text-[#4B6358]">$</span>
                    <input name="amount" inputMode="decimal" maxLength={12} placeholder="1200" className="min-w-0 flex-1 bg-transparent py-3 pl-1 text-base outline-none" />
                  </span>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-semibold">Due on day</span>
                  <input name="due_day" inputMode="numeric" maxLength={2} placeholder="1" className={input} />
                </label>
              </div>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold">Category</span>
                <select name="category" defaultValue="bills" className={input}>
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <SubmitButton pendingText="Saving…">Add bill</SubmitButton>
            </form>
          </details>
        </section>
      </main>
    </div>
  );
}
