// app/dashboard/stats/page.tsx
//
// Simple, private page statistics for the owner: views, taps per payment
// method, where visitors came from and which devices they used. No visitor
// is identified: rows hold no IP address, cookie or user agent.

import { getPageUser } from "@/lib/supabase/user";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Logo } from "@/components/brand/logo";
import { param, type SearchParams } from "@/lib/auth";
import { badgeColor } from "@/lib/payment-colors";
import { METHOD_FORMS } from "@/lib/payment-forms";
import { summarize, type EventRow } from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Statistics", robots: { index: false } };
export const dynamic = "force-dynamic";

const RANGES = [7, 30, 90] as const;

function titleFor(id: string): string {
  return METHOD_FORMS.find((m) => m.id === id)?.title ?? id;
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const width = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0;
  return (
    <li className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-3 text-[15px]">
        <span className="truncate font-semibold">{label}</span>
        <span className="tabular-nums text-[#4B6358]">{value}</span>
      </div>
      <div className="h-2.5 rounded-full bg-[#EEF3F0]">
        <div className="h-2.5 rounded-full" style={{ width: `${width}%`, backgroundColor: color }} />
      </div>
    </li>
  );
}

export default async function StatsPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const user = await getPageUser(supabase);
  if (!user) redirect("/login?next=/dashboard/stats");

  const params = await searchParams;
  const requested = Number(param(params, "days"));
  const days = RANGES.find((r) => r === requested) ?? 30;
  const since = new Date(Date.now() - days * 86_400_000).toISOString();

  const { data } = await supabase
    .from("analytics_events")
    .select("action, method_id, referrer_host, device, occurred_at")
    .eq("profile_id", user.id)
    .gte("occurred_at", since)
    .order("occurred_at", { ascending: false })
    .limit(20000);
  const stats = summarize((data ?? []) as EventRow[], days);
  const tapRate = stats.views > 0 ? Math.round((stats.taps / stats.views) * 100) : 0;
  const maxDaily = Math.max(1, ...stats.daily.map((d) => d.views));
  const maxMethod = Math.max(0, ...stats.byMethod.map((m) => m.taps));
  const maxSource = Math.max(0, ...stats.bySource.map((s) => s.views));
  const maxDevice = Math.max(0, ...stats.byDevice.map((s) => s.views));

  return (
    <div className="min-h-screen bg-[#FAF5EA] text-[#0B1F18]">
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
        <h1 className="font-serif text-[40px] font-normal leading-[1.05] tracking-[-0.01em] text-[#064E3B]">
          Statistics
        </h1>

        <nav aria-label="Date range" className="flex gap-2">
          {RANGES.map((r) => (
            <Link
              key={r}
              href={`/dashboard/stats?days=${r}`}
              aria-current={r === days ? "page" : undefined}
              className={`inline-flex min-h-11 items-center rounded-full px-5 text-[15px] font-semibold ${
                r === days ? "bg-[#064E3B] text-[#FBFBFB]" : "border border-[#DCE5DF] bg-white text-[#0B1F18]"
              }`}
            >
              {r} days
            </Link>
          ))}
        </nav>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Page views", value: String(stats.views) },
            { label: "Taps", value: String(stats.taps) },
            { label: "Tap rate", value: `${tapRate}%` },
          ].map((tile) => (
            <div key={tile.label} className="rounded-2xl border border-[#DCE5DF] bg-white p-4">
              <p className="text-[13px] font-semibold text-[#4B6358]">{tile.label}</p>
              <p className="mt-1 font-serif text-[34px] leading-none tabular-nums text-[#064E3B]">{tile.value}</p>
            </div>
          ))}
        </div>

        {stats.views === 0 && stats.taps === 0 ? (
          <p className="rounded-2xl border border-dashed border-[#B9CBC0] p-6 text-center text-[#4B6358]">
            No visits yet. Share your link or QR code, and your numbers will appear here.
          </p>
        ) : (
          <>
            <section className="rounded-2xl border border-[#DCE5DF] bg-white p-5 sm:p-6">
              <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-[#4B6358]">Views per day</h2>
              <div
                className="mt-4 flex h-28 items-end gap-[2px]"
                role="img"
                aria-label={`Page views per day over the last ${days} days`}
              >
                {stats.daily.map((d) => (
                  <div
                    key={d.date}
                    title={`${d.date}: ${d.views} views, ${d.taps} taps`}
                    className="min-w-0 flex-1 rounded-t-[3px] bg-[#064E3B]"
                    style={{ height: `${Math.max(d.views > 0 ? 6 : 2, Math.round((d.views / maxDaily) * 100))}%`, opacity: d.views > 0 ? 1 : 0.15 }}
                  />
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-[#DCE5DF] bg-white p-5 sm:p-6">
              <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-[#4B6358]">Taps by payment method</h2>
              {stats.byMethod.length === 0 ? (
                <p className="mt-3 text-[15px] text-[#4B6358]">No taps yet.</p>
              ) : (
                <ul className="mt-4 flex flex-col gap-3.5">
                  {stats.byMethod.map((m) => (
                    <Bar key={m.id} label={titleFor(m.id)} value={m.taps} max={maxMethod} color={badgeColor(m.id).bg} />
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-[#DCE5DF] bg-white p-5 sm:p-6">
              <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-[#4B6358]">Where visitors came from</h2>
              <ul className="mt-4 flex flex-col gap-3.5">
                {stats.bySource.map((s) => (
                  <Bar key={s.name} label={s.name} value={s.views} max={maxSource} color="#D9B873" />
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-[#DCE5DF] bg-white p-5 sm:p-6">
              <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-[#4B6358]">Devices</h2>
              <ul className="mt-4 flex flex-col gap-3.5">
                {stats.byDevice.map((s) => (
                  <Bar key={s.name} label={s.name} value={s.views} max={maxDevice} color="#4B6358" />
                ))}
              </ul>
            </section>
          </>
        )}

        <p className="text-[13px] text-[#4B6358]">
          Visitors are never identified: no IP addresses, cookies or personal data are stored.
          Visitors who turn on Do Not Track are not counted.
        </p>
      </main>
    </div>
  );
}
