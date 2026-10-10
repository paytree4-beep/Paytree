// components/marketing/pricing.tsx
//
// One simple plan: a monthly membership with every feature included.
// Prices come from lib/site.ts so they can never drift from the rest of the site.

import { Cta } from "@/components/marketing/cta";
import { HarvestCard } from "@/components/marketing/harvest-card";
import { PRICING, TRIAL_DAYS } from "@/lib/site";

const PLAN_FEATURES = [
  "One payment page for Cash App, Venmo, Zelle, PayPal and more",
  "Your own PayTree link and QR code, ready to share",
  "Pay me here card and video for Stories, TikTok and Reels",
  "Tip me mode for creators and musicians",
  "Invoices: send a customer a bill and confirm when it is paid",
  "Split the bill with friends",
  "My money: what came in and what you spent, by day, month and year, with Excel download",
  "Monthly bills reminder (rent, phone, subscriptions)",
  "Your money tree, to keep or share",
  "Private visitor statistics",
  "Apple basket: earn $0.25 for every friend who joins, paid on January 1, 2027",
  `${TRIAL_DAYS} days free, no card needed`,
  "Cancel any time",
];

export function Pricing() {
  const info = PRICING.monthly;
  return (
    <div className="flex w-full justify-center">
      <div className="relative flex w-full max-w-[640px] flex-col gap-5 rounded-[28px] border-2 border-[#C9A048] bg-white/80 p-8 shadow-[0_30px_70px_-30px_rgba(154,110,26,0.55)] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <span className="text-lg font-bold text-[#064E3B]">PayTree membership</span>
          <span className="rounded-full bg-gradient-to-r from-[#C9A048] to-[#E2C27A] px-3.5 py-1.5 text-[13px] font-bold text-[#3D2A06] shadow-sm">
            Everything included
          </span>
        </div>

        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-serif text-[64px] leading-none text-[#064E3B]">{info.price}</span>
          <span className="font-medium text-[#1A3326]">{info.period}</span>
        </div>
        <p className="text-[17px] font-medium text-[#1A3326]">
          Start with {TRIAL_DAYS} days free. One plan, every feature, no surprises.
        </p>

        <div className="h-px bg-[#064E3B]/10" />

        <ul className="grid gap-3 sm:grid-cols-2 sm:gap-x-6">
          {PLAN_FEATURES.map((text) => (
            <li key={text} className="flex items-start gap-3 text-[16px] font-medium text-[#0B1F18]">
              <span className="mt-[2px] flex h-5 w-5 flex-none items-center justify-center rounded-full bg-[#E3F0EA]">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#064E3B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              </span>
              <span>{text}</span>
            </li>
          ))}
        </ul>

        <Cta variant="emerald">{info.cta}</Cta>
        <HarvestCard />
      </div>
    </div>
  );
}
