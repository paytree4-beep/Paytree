// app/invoice/[id]/page.tsx
//
// The page a customer opens from an invoice link: who it is from, what it is
// for, the amount and due date, the owner's payment methods, and "I've paid"
// (unlocked after they open one of the methods). Shows PAID once the owner
// confirms.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PaymentMethods } from "@/app/[username]/payment-methods";
import { SubmitButton } from "@/components/auth/submit-button";
import { AppleCelebration } from "@/components/marketing/apple-celebration";
import { OpenedMethodField, PaidGate, PayFirstNote } from "@/components/payments/paid-gate";
import { param, type SearchParams } from "@/lib/auth";
import { invoiceStatus, isOverdue } from "@/lib/invoices";
import { formatMoney, methodLabel } from "@/lib/payment-log";
import { applyOrder, resolveMethods } from "@/lib/profiles";
import { formatEventDate } from "@/lib/splits";
import { claimInvoicePaid } from "./actions";
import { loadInvoice } from "./data";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }>; searchParams: SearchParams };

const ERRORS: Record<string, string> = {
  method: "Please pay with one of the options above first.",
  save: "We could not save that. Please try again.",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await loadInvoice(id);
  if (!data) return { title: "Invoice not found · PayTree", robots: { index: false } };
  const { invoice, profile } = data;
  const title = `🧾 Invoice from ${profile.displayName}: ${formatMoney(invoice.amount_cents)}`;
  const due = invoice.due_date ? ` · Due ${formatEventDate(invoice.due_date)}` : "";
  const description = `${invoice.title} · For ${invoice.customer}${due} · Pay with PayTree`;
  return {
    title,
    description,
    robots: { index: false },
    openGraph: { title, description, type: "website", siteName: "PayTree" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function InvoicePage({ params, searchParams }: Props) {
  const { id } = await params;
  const data = await loadInvoice(id);
  if (!data) notFound();
  const { invoice, profile } = data;
  const query = await searchParams;
  const justPaid = param(query, "paid") === "1";
  const error = param(query, "error");
  const status = invoiceStatus(invoice);
  const today = new Date().toISOString().slice(0, 10);
  const overdue = isOverdue(invoice.due_date, status, today);
  const methods = applyOrder(resolveMethods(profile.payments), profile.order);
  const scope = `invoice:${invoice.id}`;
  const labels: Record<string, string> = Object.fromEntries(methods.map((m) => [m.id, methodLabel(m.id)]));

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF5EA] font-sans text-[#0B1F18]">
      {justPaid ? <AppleCelebration /> : null}
      <header className="bg-gradient-to-b from-[#E6F2EA] via-[#F1F6EE] to-[#FAF5EA] px-5 pb-6 pt-8 text-center text-[#064E3B]">
        <p className="text-[13px] font-bold tracking-[0.12em]">INVOICE 🧾</p>
        <p className="mt-1 text-[15px] text-[#3F574C]">
          From <strong className="text-[#064E3B]">{profile.displayName}</strong>
        </p>
        <h1 className="mt-1 font-serif text-[32px] leading-[1.05]">{invoice.title}</h1>
        <p className="mt-1 text-[15px] text-[#3F574C]">For {invoice.customer}</p>
        <p className="mt-4 font-serif text-[60px] leading-none">{formatMoney(invoice.amount_cents)}</p>
        {invoice.due_date && status !== "paid" ? (
          <p
            className={`mt-3 inline-flex rounded-full px-3 py-1 text-[14px] font-semibold ${
              overdue ? "bg-[#FEF3F2] text-[#B42318]" : "bg-white/80 text-[#7A5A12]"
            }`}
          >
            {overdue ? "Overdue · was due" : "📅 Due"} {formatEventDate(invoice.due_date)}
          </p>
        ) : null}
        {status === "paid" ? (
          <p className="mt-3 inline-flex rounded-full bg-[#16A34A] px-4 py-1.5 text-[16px] font-bold text-white">PAID ✓</p>
        ) : null}
        {invoice.note ? <p className="mx-auto mt-3 max-w-[420px] text-[15px] italic text-[#3F574C]">&ldquo;{invoice.note}&rdquo;</p> : null}
      </header>

      <main className="mx-auto w-full max-w-[560px] flex-1 px-5 pb-28 pt-4">
        {status === "paid" ? (
          <section className="rounded-2xl border border-[#BFE3CF] bg-[#ECF7F0] p-5 text-center">
            <p className="font-serif text-[26px] text-[#064E3B]">This invoice is paid. Thank you!</p>
            <p className="mt-1 text-[14px] text-[#3F574C]">
              {profile.displayName} confirmed your payment
              {invoice.claimed_method ? ` by ${methodLabel(invoice.claimed_method)}` : ""}.
            </p>
          </section>
        ) : (
          <>
            <PaymentMethods username={profile.username} displayName={profile.displayName} methods={methods} scope={scope} />

            <section id="paid" className="mt-6 scroll-mt-6 rounded-2xl border border-white/80 bg-white/80 p-4">
              {status === "waiting" || justPaid ? (
                <p className="text-center font-bold text-[#064E3B]">
                  Thank you! {profile.displayName} will confirm once your payment arrives.
                </p>
              ) : (
                <PaidGate
                  scope={scope}
                  allowed={methods.map((m) => m.id)}
                  locked={<PayFirstNote text={`Pay ${formatMoney(invoice.amount_cents)} with one of the options above first. Then tap "I've paid" here.`} />}
                >
                  <form action={claimInvoicePaid} className="flex flex-col gap-3" noValidate>
                    <p className="font-bold text-[#064E3B]">Paid {formatMoney(invoice.amount_cents)}? Let {profile.displayName} know.</p>
                    {error && ERRORS[error] ? (
                      <p role="alert" className="rounded-xl bg-[#FEF3F2] px-3 py-2 text-[14px] text-[#7A271A]">{ERRORS[error]}</p>
                    ) : null}
                    <input type="hidden" name="id" value={invoice.id} />
                    <div aria-hidden="true" className="absolute left-[-9999px] h-px w-px overflow-hidden">
                      <input type="text" name="website" tabIndex={-1} autoComplete="off" />
                    </div>
                    <OpenedMethodField scope={scope} labels={labels} />
                    <SubmitButton pendingText="Saving…">I&rsquo;ve paid ✓</SubmitButton>
                  </form>
                </PaidGate>
              )}
            </section>
          </>
        )}
      </main>

      <footer
        className="sticky bottom-0 z-40 border-t border-white/80 bg-white/75 px-4 pt-3.5 text-center text-[#064E3B] backdrop-blur-xl"
        style={{ paddingBottom: "max(0.875rem, env(safe-area-inset-bottom))" }}
      >
        <Link href={`/?ref=${profile.username}`} className="inline-flex min-h-11 items-center justify-center font-semibold hover:underline">
          🧾 Send your own invoices with PayTree
        </Link>
      </footer>
    </div>
  );
}
