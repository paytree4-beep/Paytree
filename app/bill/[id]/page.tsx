// app/bill/[id]/page.tsx
//
// Public "Split the bill" page: the total, each person's share, who has paid,
// and the owner's payment methods. Shared in group chats, so it also invites
// everyone to make their own PayTree.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PaymentMethods } from "@/app/[username]/payment-methods";
import { SubmitButton } from "@/components/auth/submit-button";
import { AppleCelebration } from "@/components/marketing/apple-celebration";
import { AppleHalo } from "@/components/marketing/apples";
import { param, type SearchParams } from "@/lib/auth";
import { formatMoney } from "@/lib/payment-log";
import { applyOrder, getProfileByUsername, resolveMethods } from "@/lib/profiles";
import { formatEventDate, isSplitId, shareCents } from "@/lib/splits";
import { createAdminClient } from "@/lib/supabase/admin";
import { markSplitPaid } from "./actions";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }>; searchParams: SearchParams };

async function load(id: string) {
  if (!isSplitId(id)) return null;
  const admin = createAdminClient();
  if (!admin) return null;
  const { data: split } = await admin
    .from("bill_splits")
    .select("id, owner_id, title, total_cents, people, event_date")
    .eq("id", id)
    .maybeSingle();
  if (!split) return null;
  const s = split as { id: string; owner_id: string; title: string; total_cents: number; people: number; event_date: string | null };
  const { data: owner } = await admin.from("profiles").select("username").eq("id", s.owner_id).maybeSingle();
  const username = (owner as { username?: string } | null)?.username;
  const profile = username ? await getProfileByUsername(username) : null;
  if (!profile || profile.paused) return null;
  const { data: paid } = await admin
    .from("bill_split_payments")
    .select("name, created_at, confirmed_at")
    .eq("split_id", id)
    .order("created_at", { ascending: true })
    .limit(50);
  return { split: s, profile, paid: (paid ?? []) as { name: string; confirmed_at: string | null }[] };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await load(id);
  if (!data) return { title: "Bill not found · PayTree", robots: { index: false } };
  const each = formatMoney(shareCents(data.split.total_cents, data.split.people));
  return {
    title: `${data.split.title} · ${each} each`,
    description: `Split with ${data.profile.displayName} on PayTree: ${each} each.`,
    robots: { index: false },
  };
}

const ERRORS: Record<string, string> = {
  name: "Please enter your name.",
  full: "Everyone on this bill has already paid.",
  busy: "This bill has too many notes. Please ask the organizer.",
  save: "We could not save that. Please try again.",
};

export default async function BillPage({ params, searchParams }: Props) {
  const { id } = await params;
  const data = await load(id);
  if (!data) notFound();
  const { split, profile, paid } = data;
  const query = await searchParams;
  const justPaid = param(query, "paid") === "1";
  const error = param(query, "error");
  const each = shareCents(split.total_cents, split.people);
  const confirmedCount = paid.filter((p) => p.confirmed_at).length;
  const done = confirmedCount >= split.people;
  const methods = applyOrder(resolveMethods(profile.payments), profile.order);

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF5EA] font-sans text-[#0B1F18]">
      {justPaid ? <AppleCelebration /> : null}
      <header className="relative overflow-hidden bg-gradient-to-b from-[#E6F2EA] via-[#F1F6EE] to-[#FAF5EA] px-5 pb-6 pt-8 text-center text-[#064E3B]">
        <AppleHalo compact />
        <p className="relative text-[13px] font-bold tracking-[0.12em]">SPLIT THE BILL 🍕</p>
        <h1 className="relative mt-1 font-serif text-[34px] leading-[1.05]">{split.title}</h1>
        {split.event_date ? (
          <p className="relative mt-1 inline-flex rounded-full bg-white/80 px-3 py-1 text-[14px] font-semibold text-[#7A5A12]">
            📅 {formatEventDate(split.event_date)}
          </p>
        ) : null}
        <p className="relative mt-1 text-[15px] text-[#3F574C]">
          {formatMoney(split.total_cents)} ÷ {split.people} people · pay {profile.displayName}
        </p>
        <p className="relative mt-4 font-serif text-[56px] leading-none">{formatMoney(each)}</p>
        <p className="relative text-[14px] font-semibold text-[#3F574C]">each</p>
      </header>

      <main className="mx-auto w-full max-w-[560px] flex-1 px-5 pb-28 pt-4">
        <section className="rounded-2xl border border-white/90 bg-white/85 p-4">
          <div className="flex items-center justify-between">
            <p className="font-bold text-[#064E3B]">
              {done ? "Everyone paid 🎉" : `${confirmedCount} of ${split.people} paid`}
            </p>
            <div className="flex gap-1" aria-hidden="true">
              {Array.from({ length: Math.min(split.people, 12) }, (_, i) => (
                <span key={i} className={`h-2.5 w-2.5 rounded-full ${i < confirmedCount ? "bg-[#16A34A]" : "bg-[#DCE5DF]"}`} />
              ))}
            </div>
          </div>
          {paid.some((p) => !p.confirmed_at) ? (
            <p className="mt-1 text-[12px] text-[#6B7F75]">⏳ waiting = said they paid, not confirmed yet.</p>
          ) : null}
          {paid.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {paid.map((p, i) => (
                <li
                  key={i}
                  className={`rounded-full px-3 py-1 text-[13px] font-semibold ${
                    p.confirmed_at ? "bg-[#E3F0EA] text-[#064E3B]" : "bg-[#F3F4F2] text-[#6B7F75]"
                  }`}
                >
                  {p.confirmed_at ? `${p.name} ✓` : `${p.name} · ⏳ waiting`}
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <div className="mt-6">
          <PaymentMethods username={profile.username} displayName={profile.displayName} methods={methods} />
        </div>

        {!done ? (
          <section id="paid" className="mt-6 scroll-mt-6 rounded-2xl border border-white/80 bg-white/80 p-4">
            {justPaid ? (
              <p className="text-center font-bold text-[#064E3B]">
                Thank you! {profile.displayName} will confirm once your payment arrives.
              </p>
            ) : (
              <form action={markSplitPaid} className="flex flex-col gap-3" noValidate>
                <p className="font-bold text-[#064E3B]">Paid your {formatMoney(each)}? Let everyone know.</p>
                {error && ERRORS[error] ? (
                  <p role="alert" className="rounded-xl bg-[#FEF3F2] px-3 py-2 text-[14px] text-[#7A271A]">{ERRORS[error]}</p>
                ) : null}
                <input type="hidden" name="id" value={split.id} />
                <div aria-hidden="true" className="absolute left-[-9999px] h-px w-px overflow-hidden">
                  <input type="text" name="website" tabIndex={-1} autoComplete="off" />
                </div>
                <input
                  name="name"
                  maxLength={40}
                  autoComplete="given-name"
                  placeholder="Your name"
                  className="min-h-[52px] w-full rounded-xl border border-[#C9D6CE] bg-white px-4 text-base outline-none focus:border-[#064E3B]"
                />
                <SubmitButton pendingText="Saving…">I&rsquo;ve paid ✓</SubmitButton>
              </form>
            )}
          </section>
        ) : null}
      </main>

      <footer
        className="sticky bottom-0 z-40 border-t border-white/80 bg-white/75 px-4 pt-3.5 text-center text-[#064E3B] backdrop-blur-xl"
        style={{ paddingBottom: "max(0.875rem, env(safe-area-inset-bottom))" }}
      >
        <Link href={`/?ref=${profile.username}`} className="inline-flex min-h-11 items-center justify-center font-semibold hover:underline">
          🍕 Split your next bill with PayTree
        </Link>
      </footer>
    </div>
  );
}
