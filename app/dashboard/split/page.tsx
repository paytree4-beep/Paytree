// app/dashboard/split/page.tsx
//
// Split the bill: create a link that divides a total between friends. Each
// person sees their share and your payment methods, and taps "I've paid".

import { getPageUser } from "@/lib/supabase/user";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Notice } from "@/components/auth/fields";
import { SubmitButton } from "@/components/auth/submit-button";
import { Logo } from "@/components/brand/logo";
import { ShareLink } from "@/components/dashboard/share-link";
import { param, type SearchParams } from "@/lib/auth";
import { formatMoney, methodLabel } from "@/lib/payment-log";
import { SITE_URL } from "@/lib/site";
import { formatEventDate, shareCents } from "@/lib/splits";
import { createClient } from "@/lib/supabase/server";
import { ConfirmPair, InstantDelete } from "@/components/ui/instant-actions";
import { confirmSplitPaymentQuick, createSplit, deleteSplitQuick, removeSplitPaymentQuick } from "./actions";

export const metadata: Metadata = { title: "Split the bill", robots: { index: false } };
export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  title: "Give the bill a name, for example Friday dinner.",
  amount: "Enter a total of at least $1.00, for example 120 or 85.50.",
  people: "Split between 2 and 50 people.",
  save: "We could not create the link. Please try again.",
};

type SplitRow = { id: string; title: string; total_cents: number; people: number; created_at: string; event_date: string | null };

const input =
  "min-h-[52px] w-full rounded-xl border border-[#C9D6CE] bg-white px-4 text-base text-[#0B1F18] outline-none focus:border-[#064E3B]";

export default async function SplitPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const user = await getPageUser(supabase);
  if (!user) redirect("/login?next=/dashboard/split");

  const [{ data: profileRow }, { data, error: loadError }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
    supabase
      .from("bill_splits")
      .select("id, title, total_cents, people, created_at, event_date")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);
  if (!profileRow) redirect("/onboarding");
  const name = (profileRow as { display_name: string }).display_name;
  const splits = (data ?? []) as SplitRow[];

  const ids = splits.map((s) => s.id);
  // "method" is read with a fallback, so the page still works before that column exists.
  const loadPaid = (cols: string) =>
    supabase.from("bill_split_payments").select(cols).in("split_id", ids).order("created_at", { ascending: true });
  let paidRows: unknown[] | null = [];
  if (ids.length > 0) {
    const withMethod = await loadPaid("id, split_id, name, confirmed_at, method");
    paidRows = withMethod.error ? (await loadPaid("id, split_id, name, confirmed_at")).data : withMethod.data;
  }
  type PayRow = { id: string; split_id: string; name: string; confirmed_at: string | null; method?: string | null };
  const bySplit = new Map<string, PayRow[]>();
  for (const r of (paidRows ?? []) as PayRow[]) bySplit.set(r.split_id, [...(bySplit.get(r.split_id) ?? []), r]);

  const params = await searchParams;
  const error = param(params, "error");
  const created = param(params, "created");
  const createdSplit = splits.find((s) => s.id === created);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="min-h-screen bg-[#FAF5EA] text-[#0B1F18]">
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
          <h1 className="font-serif text-[38px] leading-[1.05] text-[#064E3B]">Split the bill 🍕</h1>
          <p className="mt-2 text-[15px] text-[#3F574C]">
            Dinner, a gift, a trip: enter the total and the number of people. Send the link to the group. Everyone sees
            their share and pays you with the app they use.
          </p>
        </div>

        {loadError ? <Notice tone="error">Split the bill is being set up. Please try again in a few minutes.</Notice> : null}
        {error && ERRORS[error] ? <Notice tone="error">{ERRORS[error]}</Notice> : null}

        {createdSplit ? (
          <section className="rounded-2xl border-2 border-[#C9A048] bg-white p-5">
            <p className="text-[13px] font-bold uppercase tracking-[0.1em] text-[#7A5A12]">Your link is ready</p>
            <p className="mt-1 font-serif text-[26px] leading-tight text-[#064E3B]">{createdSplit.title}</p>
            {createdSplit.event_date ? (
              <p className="text-[14px] font-semibold text-[#7A5A12]">📅 {formatEventDate(createdSplit.event_date)}</p>
            ) : null}
            <p className="text-[15px] text-[#3F574C]">
              {formatMoney(createdSplit.total_cents)} ÷ {createdSplit.people} ={" "}
              <strong>{formatMoney(shareCents(createdSplit.total_cents, createdSplit.people))} each</strong>
            </p>
            <div className="mt-3">
              <ShareLink url={`${SITE_URL}/bill/${createdSplit.id}`} name={name} />
            </div>
          </section>
        ) : null}

        <section className="rounded-2xl border border-[#DCE5DF] bg-white p-5">
          <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-[#4B6358]">New split</h2>
          <form action={createSplit} className="mt-4 flex flex-col gap-4" noValidate>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold">What is it for?</span>
              <input name="title" maxLength={60} placeholder="Friday dinner" className={input} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold">When? (optional)</span>
              <input name="event_date" type="date" defaultValue={today} className={input} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold">Total</span>
                <span className="flex min-h-[52px] items-center rounded-xl border border-[#C9D6CE] bg-white px-4 focus-within:border-[#064E3B]">
                  <span className="text-[#4B6358]">$</span>
                  <input name="total" inputMode="decimal" maxLength={12} placeholder="120" className="min-w-0 flex-1 bg-transparent py-3 pl-1 text-base outline-none" />
                </span>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold">People</span>
                <input name="people" inputMode="numeric" maxLength={2} placeholder="4" className={input} />
              </label>
            </div>
            <SubmitButton pendingText="Creating…">Create split link</SubmitButton>
          </form>
        </section>

        <section className="rounded-2xl border border-[#DCE5DF] bg-white p-5">
          <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-[#4B6358]">Your splits</h2>
          {splits.length === 0 ? (
            <p className="mt-3 text-[15px] text-[#4B6358]">No splits yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-[#EEF3F0]">
              {splits.map((s) => {
                const rows = bySplit.get(s.id) ?? [];
                const paid = Math.min(rows.filter((r) => r.confirmed_at).length, s.people);
                const waiting = rows.filter((r) => !r.confirmed_at);
                return (
                  <li key={s.id} data-instant-row className="flex flex-col gap-2 py-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-bold">{s.title}</p>
                        {s.event_date ? (
                          <p className="text-[13px] font-semibold text-[#7A5A12]">📅 {formatEventDate(s.event_date)}</p>
                        ) : null}
                        <p className="text-[13px] text-[#4B6358]">
                          {formatMoney(s.total_cents)} · {formatMoney(shareCents(s.total_cents, s.people))} each ·{" "}
                          <strong className={paid >= s.people ? "text-[#16A34A]" : ""}>
                            {paid} of {s.people} paid{paid >= s.people ? " 🎉" : ""}
                          </strong>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/bill/${s.id}`}
                          className="inline-flex min-h-10 items-center rounded-full border border-[#064E3B]/40 px-4 text-[14px] font-bold text-[#064E3B]"
                        >
                          Open
                        </Link>
                        <InstantDelete id={s.id} action={deleteSplitQuick} />
                      </div>
                    </div>
                    {waiting.length > 0 ? (
                      <div className="rounded-xl border border-[#E2C27A] bg-[#FBF6EA] p-3">
                        <p className="text-[13px] font-semibold text-[#7A5A12]">
                          Said they paid. Check your app, then confirm:
                        </p>
                        <ul className="mt-2 flex flex-col gap-2">
                          {waiting.map((r) => (
                            <li key={r.id} data-instant-row className="flex items-center justify-between gap-2">
                              <span className="font-semibold">
                                ⏳ {r.name}
                                {r.method ? <span className="block text-[12px] font-medium text-[#7A5A12]">via {methodLabel(r.method)}</span> : null}
                              </span>
                              <ConfirmPair id={r.id} confirm={confirmSplitPaymentQuick} reject={removeSplitPaymentQuick} rejectLabel="Remove" />
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
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
