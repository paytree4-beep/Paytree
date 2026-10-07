// app/dashboard/budget/page.tsx
//
// Budget: what came in and went out this month, the daily average, where the
// money went, monthly commitments (rent, phone, subscriptions) and a quick
// form to add spending or income. Private to the owner.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Notice } from "@/components/auth/fields";
import { SubmitButton } from "@/components/auth/submit-button";
import { Logo } from "@/components/brand/logo";
import { PeriodTabs } from "@/components/ui/period-tabs";
import { MoneyTree } from "@/components/budget/money-tree";
import { TimeZoneCookie } from "@/components/dashboard/time-zone-cookie";
import { param, type SearchParams } from "@/lib/auth";
import { CATEGORIES, categoryOf, commitmentState, shiftMonth } from "@/lib/budget";
import { formatMoney } from "@/lib/payment-log";
import { createClient } from "@/lib/supabase/server";
import { addCommitment, addMove, deleteCommitment, deleteMove, payCommitment } from "./actions";
import { loadBudget } from "./data";

export const metadata: Metadata = { title: "Budget", robots: { index: false } };
export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  amount: "Enter an amount, for example 12 or 8.50.",
  c_name: "Give the commitment a name, for example Rent.",
  c_amount: "Enter the monthly amount, at least $1.00.",
  c_day: "Pick the day of the month it is due (1 to 31).",
  save: "We could not save that. Please try again.",
};
const NOTICES: Record<string, string> = {
  spent: "Added to your spending.",
  income: "Added to your income. Your tree grew 🍎",
  commitment: "Commitment added. It will show every month.",
  paid: "Marked as paid for this month.",
  daily_on: "Daily email is on. You will get it at 12 noon (New York time) on days with money in or out.",
  daily_off: "Daily email is off.",
};

const input =
  "min-h-[52px] w-full rounded-xl border border-[#C9D6CE] bg-white px-4 text-base text-[#0B1F18] outline-none focus:border-[#064E3B]";

function Totals({ t }: { t: { income: number; spent: number; left: number } }) {
  return (
    <div className="mt-3 grid grid-cols-3 gap-2">
      <div className="rounded-xl bg-[#ECF7F0] p-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#3F574C]">Came in</p>
        <p className="mt-1 font-serif text-[22px] leading-none text-[#16A34A]">{formatMoney(t.income)}</p>
      </div>
      <div className="rounded-xl bg-[#FEF3F2] p-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#3F574C]">Spent</p>
        <p className="mt-1 font-serif text-[22px] leading-none text-[#B42318]">{formatMoney(t.spent)}</p>
      </div>
      <div className="rounded-xl bg-[#F4F8F6] p-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#3F574C]">Left</p>
        <p className={`mt-1 font-serif text-[22px] leading-none ${t.left < 0 ? "text-[#B42318]" : "text-[#064E3B]"}`}>
          {t.left < 0 ? "−" : ""}
          {formatMoney(Math.abs(t.left))}
        </p>
      </div>
    </div>
  );
}

function shortDate(day: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`));
}

export default async function BudgetPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/budget");

  const params = await searchParams;
  const b = await loadBudget(supabase, user.id, { month: param(params, "m") });
  const requested = param(params, "period");
  const period: "today" | "month" | "year" = requested === "today" || requested === "year" ? requested : "month";
  const listMoves = b.monthMoves;
  const prevMonth = shiftMonth(b.month, -1);
  const nextMonth = shiftMonth(b.month, 1);
  const monthHref = (m: string) => `/dashboard/budget?period=month${m !== b.currentMonth ? `&m=${m}` : ""}`;
  const error = param(params, "error");
  const notice = param(params, "notice");
  const commitmentsTotal = b.commitments.reduce((sum, c) => sum + c.amount_cents, 0);
  const commitmentsLeft = b.commitments.filter((c) => !b.paidIds.has(c.id)).reduce((sum, c) => sum + c.amount_cents, 0);

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
          <h1 className="font-serif text-[38px] leading-[1.05] text-[#064E3B]">My budget 📒</h1>
          <p className="mt-2 text-[15px] text-[#3F574C]">
            What came in, what went out, and your monthly bills. Only you can see this page.
          </p>
        </div>

        {b.setupNeeded ? <Notice tone="error">Budget is being set up. Please try again in a few minutes.</Notice> : null}
        {error && ERRORS[error] ? <Notice tone="error">{ERRORS[error]}</Notice> : null}
        {notice && NOTICES[notice] ? <Notice tone="success">{NOTICES[notice]}</Notice> : null}

        {/* Today / month / year */}
        <section className="rounded-2xl border border-[#DCE5DF] bg-white p-5">
          <PeriodTabs
            initial={period}
            tabs={[
              {
                id: "today",
                label: "Today",
                content: (
                  <>
                    <p className="mt-3 text-[13px] font-bold uppercase tracking-[0.1em] text-[#4B6358]">Today</p>
                    <Totals t={b.todayTotals} />
                    {b.todayMoves.length > 0 ? (
                      <ul className="mt-3 divide-y divide-[#EEF3F0]">
                        {b.todayMoves.map((m) => (
                          <li key={m.id} className="flex items-center justify-between gap-3 py-2 text-[14px]">
                            <span className="truncate">
                              {m.kind === "in" ? "💵" : categoryOf(m.category).icon} {m.note ?? (m.kind === "in" ? "Income" : categoryOf(m.category).label)}
                            </span>
                            <strong className={m.kind === "in" ? "text-[#16A34A]" : "text-[#B42318]"}>
                              {m.kind === "in" ? "+" : "−"}
                              {formatMoney(m.amount_cents)}
                            </strong>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 text-[14px] text-[#4B6358]">Nothing added today.</p>
                    )}
                  </>
                ),
              },
              {
                id: "month",
                label: b.isCurrentMonth ? "This month" : b.monthName,
                content: (
                  <>
                    <div className="mt-3 flex items-center justify-between">
                      <Link href={monthHref(prevMonth)} scroll={false} aria-label="Previous month" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#DCE5DF] text-[18px] font-bold text-[#064E3B]">
                        ‹
                      </Link>
                      <p className="text-[15px] font-bold uppercase tracking-[0.1em] text-[#4B6358]">
                        {b.monthName} {b.year}
                      </p>
                      {b.isCurrentMonth ? (
                        <span className="h-10 w-10" />
                      ) : (
                        <Link href={monthHref(nextMonth)} scroll={false} aria-label="Next month" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#DCE5DF] text-[18px] font-bold text-[#064E3B]">
                          ›
                        </Link>
                      )}
                    </div>
                    <Totals t={b.monthTotals} />
                    <div className="mt-3 grid grid-cols-2 gap-2 text-[14px]">
                      {b.isCurrentMonth ? (
                        <p className="rounded-xl border border-[#EEF3F0] px-3 py-2">
                          Spent today <strong className="block text-[17px]">{formatMoney(b.todayTotals.spent)}</strong>
                        </p>
                      ) : null}
                      <p className={`rounded-xl border border-[#EEF3F0] px-3 py-2 ${b.isCurrentMonth ? "" : "col-span-2"}`}>
                        Daily average <strong className="block text-[17px]">{formatMoney(b.dailyAverage)}</strong>
                      </p>
                    </div>
                    {b.payTreeMonth > 0 ? (
                      <p className="mt-2 text-[12px] text-[#4B6358]">Came in includes {formatMoney(b.payTreeMonth)} from PayTree payments you confirmed.</p>
                    ) : null}
                    <Link href="/dashboard/tree" className="mt-3 flex items-center gap-3 rounded-xl bg-[#F7FAF8] p-2 pr-4 hover:bg-[#EEF5F0]">
                      <span className="w-16 flex-none">
                        <MoneyTree apples={b.tree.onTree} fallen={b.tree.fallen} id="mini-tree" seed={b.seed} />
                      </span>
                      <span className="flex-1">
                        <span className="block font-bold text-[#064E3B]">{b.isCurrentMonth ? "My money tree 🌳" : `${b.monthName}'s tree 🌳`}</span>
                        <span className="text-[13px] text-[#3F574C]">
                          {b.tree.label} · {b.tree.onTree.length} {b.tree.onTree.length === 1 ? "apple" : "apples"} on the tree
                        </span>
                      </span>
                      <span className="font-bold text-[#064E3B]">›</span>
                    </Link>
                  </>
                ),
              },
              {
                id: "year",
                label: b.year === b.today.slice(0, 4) ? "This year" : b.year,
                content: (
                  <>
                    <p className="mt-3 text-[13px] font-bold uppercase tracking-[0.1em] text-[#4B6358]">{b.year}</p>
                    <Totals t={b.yearTotals} />
                    <ul className="mt-4 divide-y divide-[#EEF3F0] rounded-xl border border-[#EEF3F0]">
                      {[...b.months].reverse().map((m) => (
                        <li key={m.month}>
                          <Link href={monthHref(m.month)} scroll={false} className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#F7FAF8]">
                            <span className="w-10 flex-none">
                              <MoneyTree apples={m.tree.onTree} fallen={m.tree.fallen} id={`y-${m.month}`} seed={m.seed} />
                            </span>
                            <span className="w-10 flex-none font-bold">{m.name}</span>
                            <span className="flex-1 text-[13px] text-[#3F574C]">
                              <span className="text-[#16A34A]">+{formatMoney(m.income)}</span> · <span className="text-[#B42318]">−{formatMoney(m.spent)}</span>
                            </span>
                            <span className={`font-bold ${m.left < 0 ? "text-[#B42318]" : "text-[#064E3B]"}`}>
                              {m.left < 0 ? "−" : ""}
                              {formatMoney(Math.abs(m.left))}
                            </span>
                            <span className="font-bold text-[#064E3B]">›</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                ),
              },
            ]}
          />
        </section>

        {/* Add */}
        <section className="rounded-2xl border border-[#DCE5DF] bg-white p-5">
          <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-[#4B6358]">Add</h2>
          <form action={addMove} className="mt-3 flex flex-col gap-3" noValidate>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Spent or received">
              <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-[#E2E8E4] font-bold has-[:checked]:border-[#B42318] has-[:checked]:bg-[#FEF3F2] has-[:checked]:text-[#B42318]">
                <input type="radio" name="kind" value="out" defaultChecked className="sr-only" /> − I spent
              </label>
              <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-[#E2E8E4] font-bold has-[:checked]:border-[#16A34A] has-[:checked]:bg-[#ECF7F0] has-[:checked]:text-[#16A34A]">
                <input type="radio" name="kind" value="in" className="sr-only" /> + I received
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold">Amount</span>
                <span className="flex min-h-[52px] items-center rounded-xl border border-[#C9D6CE] bg-white px-4 focus-within:border-[#064E3B]">
                  <span className="text-[#4B6358]">$</span>
                  <input name="amount" inputMode="decimal" maxLength={12} placeholder="12.50" className="min-w-0 flex-1 bg-transparent py-3 pl-1 text-base outline-none" />
                </span>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold">Date</span>
                <input name="on_date" type="date" defaultValue={b.today} max={b.today} className={input} />
              </label>
            </div>
            <fieldset>
              <legend className="mb-1.5 text-sm font-semibold">Category</legend>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c, i) => (
                  <label
                    key={c.id}
                    className="inline-flex min-h-10 cursor-pointer items-center gap-1 rounded-full border border-[#DCE5DF] bg-white px-3 text-[14px] font-semibold has-[:checked]:border-[#064E3B] has-[:checked]:bg-[#064E3B] has-[:checked]:text-white"
                  >
                    <input type="radio" name="category" value={c.id} defaultChecked={i === 0} className="sr-only" />
                    {c.icon} {c.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold">Note (optional)</span>
              <input name="note" maxLength={80} placeholder="Lunch with Sara" className={input} />
            </label>
            <SubmitButton pendingText="Saving…">Save</SubmitButton>
          </form>
        </section>

        {/* Commitments */}
        <section id="commitments" className="scroll-mt-20 rounded-2xl border border-[#DCE5DF] bg-white p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-[#4B6358]">Monthly commitments</h2>
            {b.commitments.length > 0 ? (
              <p className="text-[13px] font-semibold text-[#3F574C]">
                {formatMoney(commitmentsTotal)} a month · <span className="text-[#B42318]">{formatMoney(commitmentsLeft)} left to pay</span>
              </p>
            ) : null}
          </div>
          {b.commitments.length === 0 ? (
            <p className="mt-2 text-[15px] text-[#4B6358]">Rent, phone, car, subscriptions: add them once and see what is due every month.</p>
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
              + Add a commitment
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
              <SubmitButton pendingText="Saving…">Add commitment</SubmitButton>
            </form>
          </details>
        </section>

        {/* This month's list */}
        <section className="rounded-2xl border border-[#DCE5DF] bg-white p-5">
          <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-[#4B6358]">
            {b.isCurrentMonth ? "This month" : `${b.monthName} ${b.year}`}
          </h2>
          {listMoves.length === 0 ? (
            <p className="mt-2 text-[15px] text-[#4B6358]">Nothing added this month.</p>
          ) : (
            <ul className="mt-3 divide-y divide-[#EEF3F0]">
              {listMoves.slice(0, 200).map((m) => {
                const cat = categoryOf(m.category);
                return (
                  <li key={m.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {m.kind === "in" ? "💵" : cat.icon} {m.note ?? (m.kind === "in" ? "Income" : cat.label)}
                      </p>
                      <p className="text-[12px] text-[#6B7F75]">
                        {shortDate(m.on_date)}
                        {m.kind === "out" ? ` · ${cat.label}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-none items-center gap-2">
                      <p className={`font-bold ${m.kind === "in" ? "text-[#16A34A]" : "text-[#B42318]"}`}>
                        {m.kind === "in" ? "+" : "−"}
                        {formatMoney(m.amount_cents)}
                      </p>
                      <form action={deleteMove}>
                        <input type="hidden" name="id" value={m.id} />
                        <button type="submit" aria-label="Delete" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#6B7F75] hover:bg-[#FEF3F2] hover:text-[#B42318]">
                          ✕
                        </button>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
