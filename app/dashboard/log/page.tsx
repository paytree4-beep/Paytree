// app/dashboard/log/page.tsx
//
// The payment log: notes customers sent with "I've paid", the owner's
// Received / Not received choice, today and this month totals, and a download
// for Excel. Optional, off by default.

import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { Notice } from "@/components/auth/fields";
import { Logo } from "@/components/brand/logo";
import { TimeZoneCookie } from "@/components/dashboard/time-zone-cookie";
import { param, type SearchParams } from "@/lib/auth";
import {
  formatMoney,
  formatWhen,
  methodLabel,
  safeTimeZone,
  summarizeClaims,
  type ClaimRow,
} from "@/lib/payment-log";
import { createClient } from "@/lib/supabase/server";
import { deleteClaim, setClaimStatus, setPaymentLog } from "./actions";

export const metadata: Metadata = { title: "Payment log", robots: { index: false } };
export const dynamic = "force-dynamic";

const NOTICES: Record<string, string> = {
  "log-on": "The payment log is on. Customers now see an “I’ve paid” button on your page.",
  "log-off": "The payment log is off. The “I’ve paid” button is hidden. Your history is kept.",
};

const ERRORS: Record<string, string> = {
  log: "We could not change that setting. Please try again.",
  update: "We could not update that entry. Please try again.",
  export: "We could not prepare the download. Please try again.",
};

function StatusButton({ id, status, children, tone }: { id: string; status: string; children: string; tone: "solid" | "outline" | "plain" }) {
  const style =
    tone === "solid"
      ? "bg-[#064E3B] text-[#FBFBFB]"
      : tone === "outline"
        ? "border border-[#064E3B]/40 text-[#064E3B]"
        : "text-[#4B6358] underline underline-offset-2";
  return (
    <form action={setClaimStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button type="submit" className={`inline-flex min-h-11 items-center rounded-full px-4 text-[14px] font-bold ${style}`}>
        {children}
      </button>
    </form>
  );
}

function Entry({ row, timeZone, children }: { row: ClaimRow; timeZone: string; children: ReactNode }) {
  return (
    <li className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-bold text-[#0B1F18]">{row.payer_name}</span>
          <span className="font-serif text-[20px] tabular-nums text-[#064E3B]">
            {row.amount_cents === null ? "Amount not given" : formatMoney(row.amount_cents)}
          </span>
        </p>
        <p className="text-[13px] text-[#4B6358]">
          {methodLabel(row.method)} · {formatWhen(row.created_at, timeZone)}
        </p>
        {row.note ? <p className="mt-1 break-words text-[14px] text-[#3F574C]">&ldquo;{row.note}&rdquo;</p> : null}
      </div>
      <div className="flex flex-none flex-wrap items-center gap-2">{children}</div>
    </li>
  );
}

export default async function PaymentLogPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/log");

  const tzCookie = (await cookies()).get("pt_tz")?.value ?? null;
  const timeZone = safeTimeZone(tzCookie);

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("username, payment_log_enabled")
    .eq("id", user.id)
    .maybeSingle();
  if (!profileData && !profileError) redirect("/onboarding");
  const ready = !profileError;
  const enabled = (profileData as { payment_log_enabled?: boolean } | null)?.payment_log_enabled === true;

  const { data } = ready
    ? await supabase
        .from("payment_claims")
        .select("id, payer_name, amount_cents, method, note, status, created_at, received_at")
        .eq("profile_id", user.id)
        .order("created_at", { ascending: false })
        .limit(2000)
    : { data: [] };
  const rows = (data ?? []) as ClaimRow[];
  const totals = summarizeClaims(rows, new Date(), timeZone);
  const pending = rows.filter((r) => r.status === "pending");
  const history = rows.filter((r) => r.status !== "pending").slice(0, 50);

  const params = await searchParams;
  const notice = param(params, "notice");
  const error = param(params, "error");

  return (
    <div className="min-h-screen bg-[#FAF5EA] text-[#0B1F18]">
      <TimeZoneCookie current={tzCookie} />
      <header className="sticky top-0 z-40 border-b border-white/80 bg-[#FAF5EA]/85 px-4 py-2.5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[880px] items-center justify-between gap-4">
          <Logo size={30} tone="dark" />
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-[#064E3B] bg-white px-5 text-[15px] font-bold text-[#064E3B] shadow-sm active:bg-[#E6F2EA]"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-[880px] flex-col gap-5 px-5 pb-20 pt-8">
        <div>
          <h1 className="font-serif text-[40px] font-normal leading-[1.05] tracking-[-0.01em] text-[#064E3B]">
            Payment log
          </h1>
          <p className="mt-2 text-[15px] text-[#4B6358]">
            Customers tap &ldquo;I&rsquo;ve paid&rdquo; on your page and tell you who they are and how much they sent.
            Check your app, then mark it Received.
          </p>
        </div>

        {notice && NOTICES[notice] ? <Notice tone="success">{NOTICES[notice]}</Notice> : null}
        {error && ERRORS[error] ? <Notice tone="error">{ERRORS[error]}</Notice> : null}
        {!ready ? (
          <Notice tone="error">The payment log is being set up. Please try again in a few minutes.</Notice>
        ) : null}

        <section className="flex flex-col gap-3 rounded-2xl border border-[#DCE5DF] bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[15px]">
            <strong className="text-[#064E3B]">{enabled ? "On." : "Off."}</strong>{" "}
            {enabled
              ? "The “I’ve paid” button shows on your page."
              : "Turn it on to show an “I’ve paid” button on your page."}
          </p>
          <form action={setPaymentLog} className="flex-none">
            <input type="hidden" name="enable" value={enabled ? "0" : "1"} />
            <input type="hidden" name="from" value="log" />
            <button
              type="submit"
              disabled={!ready}
              className={`inline-flex min-h-11 items-center rounded-full px-6 font-bold disabled:opacity-50 ${
                enabled ? "border border-[#064E3B]/40 text-[#064E3B]" : "bg-[#064E3B] text-[#FBFBFB]"
              }`}
            >
              {enabled ? "Turn off" : "Turn on"}
            </button>
          </form>
        </section>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#DCE5DF] bg-white p-4">
            <p className="text-[13px] font-semibold text-[#4B6358]">Received today</p>
            <p className="mt-1 font-serif text-[30px] leading-none tabular-nums text-[#064E3B]">
              {formatMoney(totals.todayCents)}
            </p>
            <p className="mt-1 text-[12px] text-[#4B6358]">
              {totals.todayCount} {totals.todayCount === 1 ? "payment" : "payments"}
            </p>
          </div>
          <div className="rounded-2xl border border-[#DCE5DF] bg-white p-4">
            <p className="text-[13px] font-semibold text-[#4B6358]">This month</p>
            <p className="mt-1 font-serif text-[30px] leading-none tabular-nums text-[#064E3B]">
              {formatMoney(totals.monthCents)}
            </p>
            <p className="mt-1 text-[12px] text-[#4B6358]">
              {totals.monthCount} {totals.monthCount === 1 ? "payment" : "payments"}
            </p>
          </div>
          <div className="col-span-2 rounded-2xl border border-[#D9B873] bg-[#FBF6EA] p-4 sm:col-span-1">
            <p className="text-[13px] font-semibold text-[#5C4513]">Waiting for you</p>
            <p className="mt-1 font-serif text-[30px] leading-none tabular-nums text-[#064E3B]">{totals.pendingCount}</p>
            <p className="mt-1 text-[12px] text-[#5C4513]">to check in your apps</p>
          </div>
        </div>

        <section className="rounded-2xl border border-[#DCE5DF] bg-white p-5 sm:p-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-[#4B6358]">Waiting</h2>
          {pending.length === 0 ? (
            <p className="mt-3 text-[15px] text-[#4B6358]">Nothing to check right now.</p>
          ) : (
            <>
              <p className="mt-2 text-[13px] text-[#7A5A12]">
                A note is not proof of payment. Mark it Received only after you see the money in your app.
              </p>
              <ul className="mt-4 divide-y divide-[#EEF3F0]">
                {pending.map((row) => (
                  <Entry key={row.id} row={row} timeZone={timeZone}>
                    <StatusButton id={row.id} status="received" tone="solid">
                      Received ✓
                    </StatusButton>
                    <StatusButton id={row.id} status="dismissed" tone="outline">
                      Not received
                    </StatusButton>
                  </Entry>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="rounded-2xl border border-[#DCE5DF] bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-[#4B6358]">History</h2>
            {rows.length > 0 ? (
              <a
                href="/dashboard/log/export"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#064E3B]/40 px-5 text-[14px] font-bold text-[#064E3B]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3v12 M7 10l5 5 5-5 M5 21h14" />
                </svg>
                Download for Excel
              </a>
            ) : null}
          </div>
          {history.length === 0 ? (
            <p className="mt-3 text-[15px] text-[#4B6358]">Payments you mark will appear here.</p>
          ) : (
            <ul className="mt-4 divide-y divide-[#EEF3F0]">
              {history.map((row) => (
                <Entry key={row.id} row={row} timeZone={timeZone}>
                  <span
                    className={`inline-flex min-h-8 items-center rounded-full px-3 text-[13px] font-semibold ${
                      row.status === "received" ? "bg-[#E3F0EA] text-[#064E3B]" : "bg-[#F3F4F2] text-[#4B6358]"
                    }`}
                  >
                    {row.status === "received" ? "Received ✓" : "Not received"}
                  </span>
                  <StatusButton id={row.id} status="pending" tone="plain">
                    Undo
                  </StatusButton>
                  <form action={deleteClaim}>
                    <input type="hidden" name="id" value={row.id} />
                    <button
                      type="submit"
                      className="inline-flex min-h-11 items-center px-2 text-[14px] text-[#B42318] underline underline-offset-2"
                    >
                      Delete
                    </button>
                  </form>
                </Entry>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
