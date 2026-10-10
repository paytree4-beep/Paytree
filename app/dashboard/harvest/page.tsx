// app/dashboard/harvest/page.tsx
//
// Admin only (the PayTree owner). Shows every apple PayTree still owes and
// lets the owner mark a person as paid after paying them.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Logo } from "@/components/brand/logo";
import { markApplesPaid } from "./actions";
import { formatMoney } from "@/lib/payment-log";
import { ADMIN_EMAIL, APPLE_VALUE_CENTS } from "@/lib/referrals";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getPageUser } from "@/lib/supabase/user";

export const metadata: Metadata = { title: "Harvest", robots: { index: false } };
export const dynamic = "force-dynamic";

type Apple = { referrer_id: string; referred_id: string; amount_cents: number; paid_at: string | null };

export default async function HarvestPage() {
  const supabase = await createClient();
  const user = await getPageUser(supabase);
  if (!user) redirect("/login?next=/dashboard/harvest");
  if ((user.email ?? "").toLowerCase() !== ADMIN_EMAIL) redirect("/dashboard");

  const admin = createAdminClient();
  let apples: Apple[] = [];
  let names = new Map<string, string>();
  let active = new Set<string>();

  if (admin) {
    const { data } = await admin
      .from("referral_apples")
      .select("referrer_id, referred_id, amount_cents, paid_at");
    apples = (data ?? []) as Apple[];

    const referrerIds = [...new Set(apples.map((a) => a.referrer_id))];
    const referredIds = [...new Set(apples.map((a) => a.referred_id))];
    if (referrerIds.length > 0) {
      const { data: profs } = await admin.from("profiles").select("id, username").in("id", referrerIds);
      names = new Map(((profs ?? []) as { id: string; username: string }[]).map((x) => [x.id, x.username]));
    }
    if (referredIds.length > 0) {
      const { data: subs } = await admin.from("subscriptions").select("user_id, status").in("user_id", referredIds);
      active = new Set(
        ((subs ?? []) as { user_id: string; status: string }[]).filter((s) => s.status === "active").map((s) => s.user_id),
      );
    }
  }

  type Group = { id: string; unpaid: number; unpaidCents: number; stillMembers: number; paidCents: number };
  const groups = new Map<string, Group>();
  for (const a of apples) {
    const g = groups.get(a.referrer_id) ?? { id: a.referrer_id, unpaid: 0, unpaidCents: 0, stillMembers: 0, paidCents: 0 };
    if (a.paid_at) g.paidCents += a.amount_cents;
    else {
      g.unpaid += 1;
      g.unpaidCents += a.amount_cents;
      if (active.has(a.referred_id)) g.stillMembers += 1;
    }
    groups.set(a.referrer_id, g);
  }
  const owing = [...groups.values()].filter((g) => g.unpaid > 0).sort((x, y) => y.unpaidCents - x.unpaidCents);
  const paid = [...groups.values()].filter((g) => g.unpaid === 0 && g.paidCents > 0);
  const totalCents = owing.reduce((s, g) => s + g.unpaidCents, 0);
  const totalApples = owing.reduce((s, g) => s + g.unpaid, 0);
  const each = APPLE_VALUE_CENTS.monthly;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E6F2EA] to-[#FAF5EA] text-[#0B1F18]">
      <header className="sticky top-0 z-40 border-b border-white/80 bg-[#FAF5EA]/85 px-4 py-2.5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[880px] items-center justify-between gap-4">
          <Logo size={30} tone="dark" />
          <Link href="/dashboard" className="inline-flex min-h-11 items-center rounded-full border-2 border-[#064E3B] bg-white px-5 text-[15px] font-bold text-[#064E3B]">
            Dashboard
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-[560px] px-4 pb-20 pt-6">
        <h1 className="font-serif text-[38px] leading-[1.05] text-[#064E3B]">Harvest 🧺</h1>
        <p className="mt-2 text-[15px] text-[#3F574C]">Admin only. Apples PayTree owes to people, to pay on January 1, 2027.</p>

        <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#064E3B] p-5 text-white">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.08em] opacity-80">Total you owe</p>
            <p className="font-serif text-[38px] leading-none">{formatMoney(totalCents)}</p>
          </div>
          <p className="text-right text-[14px]">
            {totalApples} {totalApples === 1 ? "apple" : "apples"}
            <br />
            {owing.length} {owing.length === 1 ? "person" : "people"}
          </p>
        </div>

        {owing.length === 0 ? <p className="mt-6 text-center text-[15px] text-[#4B6358]">Nothing to pay yet.</p> : null}

        {owing.map((g) => {
          const username = names.get(g.id) ?? "unknown";
          const cancelled = g.unpaid - g.stillMembers;
          return (
            <div key={g.id} className="mt-3 rounded-2xl border border-[#DCE5DF] bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[17px] font-bold">{username}</p>
                  <p className="text-[13px] text-[#4B6358]">
                    {g.unpaid} {g.unpaid === 1 ? "apple" : "apples"} × {formatMoney(each)}
                  </p>
                </div>
                <p className="font-serif text-[28px] text-[#064E3B]">{formatMoney(g.unpaidCents)}</p>
              </div>
              {cancelled > 0 ? (
                <p className="mt-2 rounded-lg bg-[#FFF3D1] px-3 py-2 text-[13px] font-semibold text-[#6B4A0E]">
                  Check before paying: {cancelled} of {g.unpaid} friends are no longer active members.
                </p>
              ) : null}
              <div className="mt-3 flex gap-2">
                <a
                  href={`/${username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border-2 border-[#064E3B] bg-white text-[14px] font-bold text-[#064E3B]"
                >
                  Open page ↗
                </a>
                <form action={markApplesPaid} className="flex-1">
                  <input type="hidden" name="referrer_id" value={g.id} />
                  <button type="submit" className="min-h-11 w-full rounded-full bg-[#064E3B] text-[14px] font-bold text-white">
                    Mark paid
                  </button>
                </form>
              </div>
            </div>
          );
        })}

        {paid.map((g) => (
          <div key={g.id} className="mt-3 flex items-center justify-between rounded-2xl bg-[#F1F6F3] p-4">
            <p className="text-[16px] font-bold">{names.get(g.id) ?? "unknown"}</p>
            <p className="text-[13px] font-bold text-[#2E7D4F]">✓ Paid {formatMoney(g.paidCents)}</p>
          </div>
        ))}
      </main>
    </div>
  );
}
