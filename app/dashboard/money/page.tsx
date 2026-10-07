// app/dashboard/money/page.tsx
//
// Money: everything you confirmed you received, from your payment page,
// invoices and split bills, in one place. Totals, the last 6 months, the
// latest payments, and one Excel download.

import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Logo } from "@/components/brand/logo";
import { PeriodTabs } from "@/components/ui/period-tabs";
import { TimeZoneCookie } from "@/components/dashboard/time-zone-cookie";
import { param, type SearchParams } from "@/lib/auth";
import { PERIOD_LABELS, SOURCE_LABELS, sortEntries, summarizeMoney, type MoneyPeriod, type MoneySource } from "@/lib/money";
import { formatMoney, formatWhen, methodLabel, safeTimeZone } from "@/lib/payment-log";
import { createClient } from "@/lib/supabase/server";
import { loadMoneyEntries } from "./data";

export const metadata: Metadata = { title: "Money", robots: { index: false } };
export const dynamic = "force-dynamic";

const SOURCES: { id: MoneySource; icon: string; href: string }[] = [
  { id: "page", icon: "🔗", href: "/dashboard/log" },
  { id: "invoice", icon: "🧾", href: "/dashboard/invoices" },
  { id: "split", icon: "🍕", href: "/dashboard/split" },
];

export default async function MoneyPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/money");

  const tzCookie = (await cookies()).get("pt_tz")?.value ?? null;
  const timeZone = safeTimeZone(tzCookie);
  const entries = await loadMoneyEntries(supabase, user.id);
  const summary = summarizeMoney(entries, new Date(), timeZone);
  const recent = sortEntries(entries).slice(0, 25);
  const PERIODS: MoneyPeriod[] = ["today", "month", "year", "all"];
  const requested = param(await searchParams, "period");
  const period: MoneyPeriod = PERIODS.find((p) => p === requested) ?? "month";
  const periodTotal: Record<MoneyPeriod, number> = {
    today: summary.today,
    month: summary.thisMonth,
    year: summary.thisYear,
    all: summary.allTime,
  };

  return (
    <div className="min-h-screen bg-[#FAF5EA] text-[#0B1F18]">
      <TimeZoneCookie current={tzCookie} />
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
          <h1 className="font-serif text-[38px] leading-[1.05] text-[#064E3B]">Money 💰</h1>
          <p className="mt-2 text-[15px] text-[#3F574C]">
            Everything you confirmed you received: from your payment page, invoices and split bills. The money itself is
            in your own apps; PayTree never holds it.
          </p>
        </div>

        <section className="rounded-2xl border border-[#DCE5DF] bg-white p-5">
          <p className="text-[13px] font-bold uppercase tracking-[0.1em] text-[#4B6358]">Today</p>
          <p className="mt-1 font-serif text-[52px] leading-none text-[#064E3B]">{formatMoney(summary.today)}</p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { label: "This month", value: summary.thisMonth },
              { label: "This year", value: summary.thisYear },
              { label: "All time", value: summary.allTime },
            ].map((t) => (
              <div key={t.label} className="rounded-xl bg-[#F4F8F6] p-3">
                <p className="whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.04em] text-[#4B6358] sm:text-[11px]">{t.label}</p>
                <p className="mt-1 font-serif text-[22px] leading-none text-[#064E3B]">{formatMoney(t.value)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[#DCE5DF] bg-white p-5">
          <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-[#4B6358]">By source</h2>
          <div className="mt-3">
            <PeriodTabs
              initial={period}
              tabs={PERIODS.map((p) => ({
                id: p,
                label: PERIOD_LABELS[p],
                content: (
                  <>
                    <p className="mt-3 text-[14px] text-[#3F574C]">
                      {PERIOD_LABELS[p]}: <strong className="text-[#064E3B]">{formatMoney(periodTotal[p])}</strong>
                    </p>
                    <ul className="mt-2 flex flex-col gap-2">
                      {SOURCES.map((s) => (
                        <li key={s.id}>
                          <Link href={s.href} className="flex min-h-12 items-center justify-between rounded-xl border border-[#EEF3F0] px-4 hover:bg-[#F7FAF8]">
                            <span className="font-semibold">
                              {s.icon} {SOURCE_LABELS[s.id]}
                            </span>
                            <span className="font-bold text-[#064E3B]">{formatMoney(summary.bySourceIn[p][s.id])} ›</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                ),
              }))}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-[#DCE5DF] bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-[#4B6358]">Latest payments</h2>
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
                Download all for Excel
              </a>
            ) : null}
          </div>
          {recent.length === 0 ? (
            <p className="mt-3 text-[15px] text-[#4B6358]">
              Payments appear here once you confirm them in your Payment log, Invoices or Split the bill.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-[#EEF3F0]">
              {recent.map((e, i) => (
                <li key={i} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold">{e.from}</p>
                    <p className="truncate text-[13px] text-[#4B6358]">
                      {SOURCES.find((s) => s.id === e.source)?.icon} {e.what}
                      {e.method ? ` · ${methodLabel(e.method)}` : ""}
                    </p>
                    <p className="text-[12px] text-[#6B7F75]">{formatWhen(e.at, timeZone)}</p>
                  </div>
                  <p className="flex-none font-bold text-[#16A34A]">+{formatMoney(e.amountCents)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
