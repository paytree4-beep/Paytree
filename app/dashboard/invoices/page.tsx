// app/dashboard/invoices/page.tsx
//
// Invoices: bill one customer ("Haircut for Sara, $60"). Send the link; the
// customer sees the amount and your payment methods, pays, and taps
// "I've paid". You confirm when the money arrives.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Notice } from "@/components/auth/fields";
import { SubmitButton } from "@/components/auth/submit-button";
import { Logo } from "@/components/brand/logo";
import { ShareLink } from "@/components/dashboard/share-link";
import { param, type SearchParams } from "@/lib/auth";
import { invoiceStatus, isOverdue } from "@/lib/invoices";
import { formatMoney, methodLabel } from "@/lib/payment-log";
import { SITE_URL } from "@/lib/site";
import { formatEventDate } from "@/lib/splits";
import { createClient } from "@/lib/supabase/server";
import { confirmInvoice, createInvoice, deleteInvoice, rejectInvoiceClaim } from "./actions";

export const metadata: Metadata = { title: "Invoices", robots: { index: false } };
export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  customer: "Enter the customer's name.",
  title: "Say what the invoice is for, for example Haircut.",
  amount: "Enter an amount of at least $1.00, for example 60 or 45.50.",
  save: "We could not create the invoice. Please try again.",
};

type InvoiceRow = {
  id: string;
  customer: string;
  title: string;
  amount_cents: number;
  due_date: string | null;
  claimed_at: string | null;
  claimed_method: string | null;
  confirmed_at: string | null;
  created_at: string;
};

const input =
  "min-h-[52px] w-full rounded-xl border border-[#C9D6CE] bg-white px-4 text-base text-[#0B1F18] outline-none focus:border-[#064E3B]";

export default async function InvoicesPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/invoices");

  const { data: profileRow } = await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
  if (!profileRow) redirect("/onboarding");
  const name = (profileRow as { display_name: string }).display_name;

  const { data, error: loadError } = await supabase
    .from("invoices")
    .select("id, customer, title, amount_cents, due_date, claimed_at, claimed_method, confirmed_at, created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  const invoices = (data ?? []) as InvoiceRow[];

  const params = await searchParams;
  const error = param(params, "error");
  const created = invoices.find((i) => i.id === param(params, "created"));
  const today = new Date().toISOString().slice(0, 10);
  const unpaidTotal = invoices.filter((i) => !i.confirmed_at).reduce((sum, i) => sum + i.amount_cents, 0);

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
          <h1 className="font-serif text-[38px] leading-[1.05] text-[#064E3B]">Invoices 🧾</h1>
          <p className="mt-2 text-[15px] text-[#3F574C]">
            Send a customer a bill. They see the amount and your payment methods, pay with the app they use, and tap
            &ldquo;I&rsquo;ve paid&rdquo;. You confirm when the money arrives.
          </p>
        </div>

        {loadError ? <Notice tone="error">Invoices are being set up. Please try again in a few minutes.</Notice> : null}
        {error && ERRORS[error] ? <Notice tone="error">{ERRORS[error]}</Notice> : null}

        {created ? (
          <section className="rounded-2xl border-2 border-[#C9A048] bg-white p-5">
            <p className="text-[13px] font-bold uppercase tracking-[0.1em] text-[#7A5A12]">Your invoice is ready</p>
            <p className="mt-1 font-serif text-[26px] leading-tight text-[#064E3B]">
              {created.title} · {formatMoney(created.amount_cents)}
            </p>
            <p className="text-[15px] text-[#3F574C]">
              For {created.customer}
              {created.due_date ? ` · due ${formatEventDate(created.due_date)}` : ""}
            </p>
            <p className="mt-2 text-[14px] text-[#3F574C]">Send this link to {created.customer}:</p>
            <div className="mt-2">
              <ShareLink url={`${SITE_URL}/invoice/${created.id}`} name={name} />
            </div>
          </section>
        ) : null}

        <section className="rounded-2xl border border-[#DCE5DF] bg-white p-5">
          <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-[#4B6358]">New invoice</h2>
          <form action={createInvoice} className="mt-4 flex flex-col gap-4" noValidate>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold">Customer name</span>
              <input name="customer" maxLength={60} placeholder="Sara Johnson" autoComplete="off" className={input} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold">What is it for?</span>
              <input name="title" maxLength={80} placeholder="Haircut and color" className={input} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold">Amount</span>
                <span className="flex min-h-[52px] items-center rounded-xl border border-[#C9D6CE] bg-white px-4 focus-within:border-[#064E3B]">
                  <span className="text-[#4B6358]">$</span>
                  <input name="amount" inputMode="decimal" maxLength={12} placeholder="60" className="min-w-0 flex-1 bg-transparent py-3 pl-1 text-base outline-none" />
                </span>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold">Due date (optional)</span>
                <input name="due_date" type="date" min={today} className={input} />
              </label>
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold">Note (optional)</span>
              <input name="note" maxLength={200} placeholder="Thank you for your business!" className={input} />
            </label>
            <SubmitButton pendingText="Creating…">Create invoice</SubmitButton>
          </form>
        </section>

        <section className="rounded-2xl border border-[#DCE5DF] bg-white p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-[#4B6358]">Your invoices</h2>
            {unpaidTotal > 0 ? (
              <p className="text-[14px] font-semibold text-[#7A5A12]">{formatMoney(unpaidTotal)} not paid yet</p>
            ) : null}
          </div>
          {invoices.length === 0 ? (
            <p className="mt-3 text-[15px] text-[#4B6358]">No invoices yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-[#EEF3F0]">
              {invoices.map((inv) => {
                const status = invoiceStatus(inv);
                const overdue = isOverdue(inv.due_date, status, today);
                return (
                  <li key={inv.id} className="flex flex-col gap-2 py-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-bold">
                          {inv.customer} · {formatMoney(inv.amount_cents)}
                        </p>
                        <p className="text-[13px] text-[#4B6358]">
                          {inv.title}
                          {inv.due_date ? ` · due ${formatEventDate(inv.due_date)}` : ""}
                        </p>
                        <p className="mt-1">
                          {status === "paid" ? (
                            <span className="rounded-full bg-[#E3F0EA] px-2.5 py-0.5 text-[12px] font-bold text-[#16A34A]">Paid ✓</span>
                          ) : status === "waiting" ? (
                            <span className="rounded-full bg-[#FBF6EA] px-2.5 py-0.5 text-[12px] font-bold text-[#7A5A12]">
                              ⏳ Says paid{inv.claimed_method ? ` via ${methodLabel(inv.claimed_method)}` : ""}
                            </span>
                          ) : (
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[12px] font-bold ${
                                overdue ? "bg-[#FEF3F2] text-[#B42318]" : "bg-[#F3F4F2] text-[#4B6358]"
                              }`}
                            >
                              {overdue ? "Overdue" : "Not paid"}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/invoice/${inv.id}`}
                          className="inline-flex min-h-10 items-center rounded-full border border-[#064E3B]/40 px-4 text-[14px] font-bold text-[#064E3B]"
                        >
                          Open
                        </Link>
                        <form action={deleteInvoice}>
                          <input type="hidden" name="id" value={inv.id} />
                          <button type="submit" className="inline-flex min-h-10 items-center px-2 text-[14px] text-[#B42318] underline underline-offset-2">
                            Delete
                          </button>
                        </form>
                      </div>
                    </div>
                    {status === "waiting" ? (
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E2C27A] bg-[#FBF6EA] p-3">
                        <p className="text-[13px] font-semibold text-[#7A5A12]">
                          {inv.customer} says they paid. Check your app, then confirm:
                        </p>
                        <span className="flex gap-1">
                          <form action={confirmInvoice}>
                            <input type="hidden" name="id" value={inv.id} />
                            <button type="submit" className="inline-flex min-h-10 items-center rounded-full bg-[#064E3B] px-4 text-[13px] font-bold text-[#FBFBFB]">
                              Confirm ✓
                            </button>
                          </form>
                          <form action={rejectInvoiceClaim}>
                            <input type="hidden" name="id" value={inv.id} />
                            <button type="submit" className="inline-flex min-h-10 items-center px-2 text-[13px] text-[#B42318] underline underline-offset-2">
                              Not received
                            </button>
                          </form>
                        </span>
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
