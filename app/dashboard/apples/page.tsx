// app/dashboard/apples/page.tsx
//
// The owner's apple basket page: referral link, apples earned, how much
// PayTree will pay on Harvest Day.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Logo } from "@/components/brand/logo";
import { AppleBasket } from "@/components/dashboard/apple-basket";
import { summarizeBasket, type AppleRow } from "@/lib/referrals";
import { SITE_URL } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import { getPageUser } from "@/lib/supabase/user";

export const metadata: Metadata = { title: "My apple basket", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ApplesPage() {
  const supabase = await createClient();
  const user = await getPageUser(supabase);
  if (!user) redirect("/login?next=/dashboard/apples");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", user.id)
    .maybeSingle();
  const p = profile as { username: string; display_name: string } | null;
  if (!p) redirect("/onboarding");

  const { data: rows } = await supabase
    .from("referral_apples")
    .select("plan, amount_cents, paid_at")
    .eq("referrer_id", user.id);
  const basket = summarizeBasket((rows ?? []) as AppleRow[]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E6F2EA] via-[#F4F3E8] to-[#FAF5EA] text-[#0B1F18]">
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
      <main className="mx-auto max-w-[560px] px-4 pb-20 pt-6">
        <AppleBasket link={`${SITE_URL}/?ref=${p.username}`} name={p.display_name} basket={basket} now={Date.now()} />
      </main>
    </div>
  );
}
