"use client";
// components/budget/money-board.tsx
//
// The one money page: what came in and what you spent, for today, this month
// and this year. Everything is already on the page, so the buttons react at
// once; saving happens quietly in the background (and is rolled back with a
// message if it ever fails). Money from confirmed invoices and split bills
// shows up by itself under "Came in".

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

import { addMoveQuick, deleteMoveQuick } from "@/app/dashboard/budget/actions";
import { CATEGORIES, categoryOf, checkMove, formatMoney, shiftMonth } from "@/lib/budget-basics";

export type BoardEntry = {
  id: string;
  kind: "in" | "out";
  cents: number;
  /** "2026-10-07", in the owner's time zone. */
  date: string;
  title: string;
  sub: string;
  icon: string;
  /** Added by the owner (can be deleted here). Otherwise it came from an invoice or a split bill. */
  own: boolean;
  category?: string;
  href?: string;
};

type Period = "today" | "month" | "year";
type Kind = "in" | "out";

const ERRORS: Record<string, string> = {
  amount: "Enter an amount, for example 12 or 8.50.",
  save: "We could not save that. Please try again.",
  login: "Please log in again.",
};

const input =
  "min-h-[52px] w-full rounded-xl border border-[#C9D6CE] bg-white px-4 text-base text-[#0B1F18] outline-none focus:border-[#064E3B]";

function shortDate(day: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`));
}

function monthTitle(month: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${month}-15T12:00:00Z`));
}

export function MoneyBoard({
  entries: initialEntries,
  today,
  month: initialMonth,
  firstMonth,
  initialPeriod,
}: {
  entries: BoardEntry[];
  today: string;
  month: string;
  firstMonth: string;
  initialPeriod: Period;
}) {
  const currentMonth = today.slice(0, 7);
  const router = useRouter();
  const [entries, setEntries] = useState<BoardEntry[]>(initialEntries);
  // Entries being deleted right now: a refresh must not bring them back for a moment.
  const deleting = useRef<Set<string>>(new Set());
  // Whenever the page brings fresh numbers from the database, they win over our guesses.
  useEffect(() => {
    setEntries((prev) => [
      ...prev.filter((e) => e.id.startsWith("temp-")),
      ...initialEntries.filter((e) => !deleting.current.has(e.id)),
    ]);
  }, [initialEntries]);
  const [kind, setKind] = useState<Kind>("in");
  const [period, setPeriod] = useState<Period>(initialPeriod);
  const [month, setMonth] = useState(initialMonth);
  const [error, setError] = useState<string | null>(null);
  const [undo, setUndo] = useState<BoardEntry | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tempCounter = useRef(0);
  const formRef = useRef<HTMLFormElement>(null);

  const year = month.slice(0, 4);
  const inPeriod = (d: string) => (period === "today" ? d === today : period === "month" ? d.slice(0, 7) === month : d.slice(0, 4) === year);
  const inRange = entries.filter((e) => inPeriod(e.date));
  const total = (k: Kind) => inRange.filter((e) => e.kind === k).reduce((sum, e) => sum + e.cents, 0);
  const cameIn = total("in");
  const spent = total("out");
  const left = cameIn - spent;
  const list = inRange.filter((e) => e.kind === kind).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  const byCategory = new Map<string, number>();
  if (kind === "out") for (const e of list) byCategory.set(e.category ?? "other", (byCategory.get(e.category ?? "other") ?? 0) + e.cents);
  const categories = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);

  const periodName = period === "today" ? "Today" : period === "month" ? (month === currentMonth ? "This month" : monthTitle(month)) : year === today.slice(0, 4) ? "This year" : year;

  function pickPeriod(next: Period) {
    setPeriod(next);
  }

  async function onAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const values = {
      kind,
      amount: String(data.get("amount") ?? ""),
      category: String(data.get("category") ?? "other"),
      note: String(data.get("note") ?? ""),
      on_date: String(data.get("on_date") ?? today),
    };
    const parsed = checkMove((name) => (values as Record<string, unknown>)[name], today);
    if ("error" in parsed) {
      setError(ERRORS[parsed.error] ?? ERRORS.save);
      return;
    }
    setError(null);
    const cat = categoryOf(parsed.category);
    tempCounter.current += 1;
    const tempId = `temp-${tempCounter.current}`;
    const entry: BoardEntry = {
      id: tempId,
      kind: parsed.kind,
      cents: parsed.amountCents,
      date: parsed.onDate,
      title: parsed.note ?? (parsed.kind === "in" ? "Income" : cat.label),
      sub: parsed.kind === "out" ? cat.label : "Added by you",
      icon: parsed.kind === "in" ? "💵" : cat.icon,
      own: true,
      category: parsed.category,
    };
    setEntries((prev) => [entry, ...prev]);
    form.reset();
    let result: Awaited<ReturnType<typeof addMoveQuick>>;
    try {
      result = await addMoveQuick(values);
    } catch {
      result = { ok: false, error: "save" };
    }
    if (result.ok) {
      setEntries((prev) => prev.filter((e) => e.id !== tempId));
      setEntries((prev) => [{ ...entry, id: result.id }, ...prev.filter((e) => e.id !== result.id)]);
    } else {
      setEntries((prev) => prev.filter((e) => e.id !== tempId));
      setError(ERRORS[result.error] ?? ERRORS.save);
    }
    router.refresh();
  }

  async function onDelete(entry: BoardEntry) {
    if (entry.id.startsWith("temp-")) return;
    setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    setUndo(entry);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndo(null), 7000);
    deleting.current.add(entry.id);
    let ok = false;
    try {
      ok = await deleteMoveQuick(entry.id);
    } catch {
      ok = false;
    }
    deleting.current.delete(entry.id);
    if (!ok) {
      setEntries((prev) => [entry, ...prev.filter((e) => e.id !== entry.id)]);
      setUndo(null);
      setError(ERRORS.save);
    }
    router.refresh();
  }

  async function onUndo() {
    const entry = undo;
    if (!entry) return;
    setUndo(null);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    tempCounter.current += 1;
    const tempId = `temp-${tempCounter.current}`;
    setEntries((prev) => [{ ...entry, id: tempId }, ...prev]);
    let result: Awaited<ReturnType<typeof addMoveQuick>>;
    try {
      result = await addMoveQuick({
        kind: entry.kind,
        amount: (entry.cents / 100).toFixed(2),
        category: entry.category ?? "other",
        note: entry.title === "Income" || entry.title === categoryOf(entry.category).label ? "" : entry.title,
        on_date: entry.date,
      });
    } catch {
      result = { ok: false, error: "save" };
    }
    setEntries((prev) => prev.filter((e) => e.id !== tempId));
    if (result.ok) {
      setEntries((prev) => [{ ...entry, id: result.id }, ...prev.filter((e) => e.id !== result.id)]);
    } else {
      setError(ERRORS.save);
    }
    router.refresh();
  }

  const tab = (id: Period, label: string) => (
    <button
      key={id}
      type="button"
      role="tab"
      aria-selected={period === id}
      onClick={() => pickPeriod(id)}
      className={`inline-flex min-h-10 flex-1 items-center justify-center rounded-full px-3 text-[14px] font-bold ${
        period === id ? "bg-[#064E3B] text-white" : "border border-[#DCE5DF] bg-white text-[#064E3B]"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Came in / Spent */}
      <section className="rounded-2xl border border-[#DCE5DF] bg-white p-5">
        <div className="flex gap-2" role="tablist" aria-label="Period">
          {tab("today", "Today")}
          {tab("month", "Month")}
          {tab("year", "Year")}
        </div>

        {period === "month" ? (
          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous month"
              disabled={month <= firstMonth}
              onClick={() => setMonth(shiftMonth(month, -1))}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#DCE5DF] text-[18px] font-bold text-[#064E3B] disabled:opacity-30"
            >
              ‹
            </button>
            <p className="text-[15px] font-bold uppercase tracking-[0.1em] text-[#4B6358]">{monthTitle(month)}</p>
            <button
              type="button"
              aria-label="Next month"
              disabled={month >= currentMonth}
              onClick={() => setMonth(shiftMonth(month, 1))}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#DCE5DF] text-[18px] font-bold text-[#064E3B] disabled:opacity-30"
            >
              ›
            </button>
          </div>
        ) : (
          <p className="mt-3 text-center text-[15px] font-bold uppercase tracking-[0.1em] text-[#4B6358]">{periodName}</p>
        )}

        <div className="mt-3 grid grid-cols-2 gap-2" role="tablist" aria-label="Came in or spent">
          <button
            type="button"
            role="tab"
            aria-selected={kind === "in"}
            onClick={() => setKind("in")}
            className={`rounded-2xl border-2 p-3 text-left ${kind === "in" ? "border-[#16A34A] bg-[#ECF7F0]" : "border-[#E2E8E4] bg-white"}`}
          >
            <span className="block text-[12px] font-bold uppercase tracking-[0.06em] text-[#3F574C]">💵 Came in</span>
            <span className="mt-1 block font-serif text-[28px] leading-none text-[#16A34A]">{formatMoney(cameIn)}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={kind === "out"}
            onClick={() => setKind("out")}
            className={`rounded-2xl border-2 p-3 text-left ${kind === "out" ? "border-[#B42318] bg-[#FEF3F2]" : "border-[#E2E8E4] bg-white"}`}
          >
            <span className="block text-[12px] font-bold uppercase tracking-[0.06em] text-[#3F574C]">🛒 Spent</span>
            <span className="mt-1 block font-serif text-[28px] leading-none text-[#B42318]">{formatMoney(spent)}</span>
          </button>
        </div>
        <p className="mt-3 text-center text-[14px] text-[#3F574C]">
          Left:{" "}
          <strong className={left < 0 ? "text-[#B42318]" : "text-[#064E3B]"}>
            {left < 0 ? "−" : ""}
            {formatMoney(Math.abs(left))}
          </strong>
        </p>
      </section>

      {/* Add */}
      <section className="rounded-2xl border border-[#DCE5DF] bg-white p-5">
        <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-[#4B6358]">
          {kind === "in" ? "Add money that came in" : "Add something you spent"}
        </h2>
        <form ref={formRef} onSubmit={onAdd} className="mt-3 flex flex-col gap-3" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex min-w-0 flex-col gap-1.5">
              <span className="text-sm font-semibold">Amount</span>
              <span className="flex min-h-[52px] items-center rounded-xl border border-[#C9D6CE] bg-white px-4 focus-within:border-[#064E3B]">
                <span className="text-[#4B6358]">$</span>
                <input name="amount" inputMode="decimal" maxLength={12} placeholder="Type amount" className="min-w-0 flex-1 bg-transparent py-3 pl-1 text-base outline-none" />
              </span>
            </label>
            <label className="flex min-w-0 flex-col gap-1.5">
              <span className="text-sm font-semibold">Date</span>
              <input name="on_date" type="date" defaultValue={today} max={today} className={`${input} min-w-0 max-w-full appearance-none`} />
            </label>
          </div>
          {kind === "out" ? (
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
          ) : null}
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">{kind === "in" ? "From whom or for what (optional)" : "Note (optional)"}</span>
            <input name="note" maxLength={80} placeholder={kind === "in" ? "Sara, haircut" : "Lunch with Sara"} className={input} />
          </label>
          {error ? (
            <p role="alert" className="rounded-xl bg-[#FEF3F2] px-3 py-2 text-[14px] text-[#7A271A]">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            className="flex min-h-[52px] w-full items-center justify-center rounded-full bg-[#064E3B] px-7 font-bold text-[#FBFBFB] active:scale-[0.99]"
          >
            Save
          </button>
        </form>
      </section>

      {/* The list */}
      <section className="rounded-2xl border border-[#DCE5DF] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-[#4B6358]">
            {kind === "in" ? "Came in" : "Spent"} · {periodName}
          </h2>
          {entries.length > 0 ? (
            // A file download, not a page: a plain link is right here.
            // eslint-disable-next-line @next/next/no-html-link-for-pages
            <a
              href="/dashboard/money/export"
              download
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#064E3B]/40 px-4 text-[13px] font-bold text-[#064E3B]"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3v12 M7 10l5 5 5-5 M5 21h14" />
              </svg>
              Download for Excel
            </a>
          ) : null}
        </div>

        {categories.length > 1 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {categories.map(([id, cents]) => (
              <li key={id} className="rounded-full bg-[#F4F8F6] px-3 py-1 text-[13px] font-semibold text-[#3F574C]">
                {categoryOf(id).icon} {categoryOf(id).label} · {formatMoney(cents)}
              </li>
            ))}
          </ul>
        ) : null}

        {list.length === 0 ? (
          <p className="mt-3 text-[15px] text-[#4B6358]">
            {kind === "in" ? "Nothing came in for this period yet." : "Nothing spent for this period yet."}
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-[#EEF3F0]">
            {list.slice(0, 300).map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {e.icon} {e.title}
                  </p>
                  <p className="truncate text-[12px] text-[#6B7F75]">
                    {shortDate(e.date)} · {e.sub}
                  </p>
                </div>
                <div className="flex flex-none items-center gap-1">
                  <p className={`font-bold ${e.kind === "in" ? "text-[#16A34A]" : "text-[#B42318]"}`}>
                    {e.kind === "in" ? "+" : "−"}
                    {formatMoney(e.cents)}
                  </p>
                  {e.own ? (
                    <button
                      type="button"
                      aria-label="Delete"
                      onClick={() => onDelete(e)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#6B7F75] hover:bg-[#FEF3F2] hover:text-[#B42318]"
                    >
                      ✕
                    </button>
                  ) : e.href ? (
                    <Link href={e.href} aria-label="Open" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[18px] font-bold text-[#064E3B]">
                      ›
                    </Link>
                  ) : (
                    <span className="h-9 w-2" />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        {kind === "in" ? (
          <p className="mt-3 text-[12px] text-[#4B6358]">
            Invoices and split bills you confirm as paid are added here by themselves. Money paid straight to your apps is not
            seen by PayTree, so add it yourself.
          </p>
        ) : null}
      </section>

      {undo ? (
        <div
          role="status"
          className="fixed inset-x-4 bottom-5 z-50 mx-auto flex max-w-[420px] items-center justify-between gap-3 rounded-full bg-[#0B1F18] px-5 py-3 text-[14px] font-semibold text-white shadow-lg"
        >
          <span>Deleted</span>
          <button type="button" onClick={onUndo} className="min-h-9 rounded-full bg-white/15 px-4 font-bold">
            Undo
          </button>
        </div>
      ) : null}
    </div>
  );
}
