// app/dashboard/harvest/page.tsx
//
// Admin only: Harvest Day. Everyone with apples to sell, how much PayTree
// owes them, a link to their payment page to pay them, and a Paid button.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Notice } from "@/components/auth/fields";
import { Logo } from "@/components/brand/logo";
import { param, type SearchParams } from "@/lib/auth";
import { formatMoney } from "@/lib/payment-log";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_EMAIL } from "@/lib/referrals";
import { markApplesPaid } from "./actions";

export const metadata: Metadata = { title: "Harvest", robots: { index: false } };
export const dynamic = "force-dynamic";

type Row = { referrer_id: string; plan: string; amount_cents: number; paid_at: string | null };

export default async function HarvestPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || (user.email ?? "").toLowerCase() !== ADMIN_EMAIL) redirect("/dashboard");

  const admin = createAdminClient();
  const { data } = admin
    ? await admin.from("referral_apples").select("referrer_id, plan, amount_cents, paid_at").limit(20000)
    : { data: [] };
  const rows = (data ?? []) as Row[];

  const byUser = new Map<string, { red: number; green: number; owed: number; paid: number }>();
  for (const r of rows) {
    const t = byUser.get(r.referrer_id) ?? { red: 0, green: 0, owed: 0, paid: 0 };
    if (r.plan === "annual") t.red += 1;
    else t.green += 1;
    if (r.paid_at) t.paid += r.amount_cents;
    else t.owed += r.amount_cents;
    byUser.set(r.referrer_id, t);
  }
  const ids = [...byUser.keys()];
  const { data: profs } =
    admin && ids.length > 0
      ? await admin.from("profiles").select("id, username, display_name").in("id", ids)
      : { data: [] };
  const names = new Map(
    ((profs ?? []) as { id: string; username: string; display_name: string }[]).map((p) => [p.id, p]),
  );
  const list = ids
    .map((id) => ({ id, ...byUser.get(id)!, profile: names.get(id) }))
    .sort((a, b) => b.owed - a.owed);
  const totalOwed = list.reduce((s, x) => s + x.owed, 0);

  const params = await searchParams;

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
      <main className="mx-auto flex max-w-[880px] flex-col gap-5 px-5 pb-20 pt-8">
        <h1 className="font-serif text-[40px] leading-[1.05] text-[#064E3B]">🧺 Harvest</h1>
        <p className="text-[15px] text-[#3F574C]">
          Everyone below has apples to sell. Open their page, pay them with one of their payment methods, then tap
          Paid.
        </p>
        {param(params, "done") ? <Notice tone="success">Marked as paid.</Notice> : null}
        {param(params, "error") ? <Notice tone="error">Something went wrong. Please try again.</Notice> : null}

        <div className="rounded-2xl border border-[#E2C27A] bg-white p-4">
          <p className="text-[13px] font-semibold text-[#7A5A12]">Total to pay</p>
          <p className="font-serif text-[34px] leading-none text-[#064E3B]">{formatMoney(totalOwed)}</p>
        </div>

        <ul className="flex flex-col gap-3">
          {list.length === 0 ? <li className="text-[#4B6358]">No apples yet.</li> : null}
          {list.map((x) => (
            <li key={x.id} className="flex flex-col gap-3 rounded-2xl border border-[#DCE5DF] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-bold">{x.profile?.display_name ?? "Deleted account"}</p>
                <p className="text-[13px] text-[#4B6358]">
                  🍎 {x.red} · 🍏 {x.green} · paid {formatMoney(x.paid)}
                </p>
                <p className="mt-1 font-serif text-[24px] leading-none text-[#064E3B]">{formatMoney(x.owed)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {x.profile ? (
                  <Link
                    href={`/${x.profile.username}`}
                    target="_blank"
                    className="inline-flex min-h-11 items-center rounded-full border border-[#064E3B]/40 px-5 font-bold text-[#064E3B]"
                  >
                    Open page to pay
                  </Link>
                ) : null}
                {x.owed > 0 ? (
                  <form action={markApplesPaid}>
                    <input type="hidden" name="referrer_id" value={x.id} />
                    <button type="submit" className="inline-flex min-h-11 items-center rounded-full bg-[#064E3B] px-5 font-bold text-[#FBFBFB]">
                      Paid ✓
                    </button>
                  </form>
                ) : (
                  <span className="inline-flex min-h-11 items-center rounded-full bg-[#E3F0EA] px-5 font-bold text-[#064E3B]">All paid</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
