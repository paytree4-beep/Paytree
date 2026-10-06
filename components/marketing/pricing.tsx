// components/marketing/pricing.tsx
"use client";

// Monthly / yearly pricing cards. The selected plan is the emerald card.
// Prices come from lib/site.ts so they can never drift from the rest of the site.

import { useState } from "react";

import { Cta } from "@/components/marketing/cta";
import { PRICES, PRICING } from "@/lib/site";

const money = (value: number) => `$${value.toFixed(2)}`;

type PlanKey = "monthly" | "annual";

const PLAN_FEATURES = [
  "Every payment method, neatly organized",
  "Your own PayTree link and QR code",
  "Private visitor statistics",
  "14 days free, no card needed",
  "Cancel any time",
]

export function Pricing() {
  const [plan, setPlan] = useState<PlanKey>("annual");

  const keys: PlanKey[] = ["monthly", "annual"];

  return (
    <div className="flex w-full flex-col items-center gap-10">
      <div
        role="group"
        aria-label="Billing cycle"
        className="inline-flex gap-1 rounded-full border border-white/70 bg-white/60 p-[5px] backdrop-blur-xl"
      >
        {keys.map((key) => {
          const selected = plan === key;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={selected}
              onClick={() => setPlan(key)}
              className={`min-h-11 min-w-[120px] rounded-full px-[22px] font-semibold transition-colors motion-reduce:transition-none ${
                selected ? "bg-[#064E3B] text-[#FBFBFB]" : "bg-transparent text-[#064E3B]"
              }`}
            >
              {key === "monthly" ? "Monthly" : "Yearly"}
            </button>
          );
        })}
      </div>

      <div className="flex w-full flex-wrap items-stretch gap-5">
        {keys.map((key) => {
          const info = PRICING[key];
          const selected = plan === key;
          const badge = "badge" in info ? info.badge : "";
          const fullPrice = "fullPrice" in info ? info.fullPrice : "";
          return (
            <div
              key={key}
              className={`relative flex min-w-0 flex-[1_1_320px] flex-col gap-5 rounded-[28px] p-8 backdrop-blur-xl transition-shadow ${
                selected
                  ? "border-2 border-[#C9A048] bg-white/80 shadow-[0_30px_70px_-30px_rgba(154,110,26,0.55)]"
                  : "border border-white/70 bg-white/50 shadow-[0_20px_50px_-36px_rgba(6,78,59,0.45)]"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-lg font-bold text-[#064E3B]">{info.name}</span>
                {badge ? (
                  <span className="rounded-full bg-gradient-to-r from-[#C9A048] to-[#E2C27A] px-3.5 py-1.5 text-[13px] font-bold text-[#3D2A06] shadow-sm">
                    {badge}
                  </span>
                ) : null}
              </div>

              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                {fullPrice ? (
                  <span className="font-serif text-[30px] leading-none text-[#4B6358]/70 line-through decoration-[#B42318]/60 decoration-2">
                    {fullPrice}
                  </span>
                ) : null}
                <span className="font-serif text-[64px] leading-none text-[#064E3B]">{info.price}</span>
                <span className="text-[#4B6358]">{info.period}</span>
              </div>

              <p className="min-h-6 text-[15px] text-[#4B6358]">
                {fullPrice ? (
                  <>
                    <strong className="text-[#9A6E1A]">You save {money(PRICES.monthly * 12 - PRICES.annual)} a year.</strong>{" "}
                    {info.note}
                  </>
                ) : (
                  info.note
                )}
              </p>

              <div className="h-px bg-[#064E3B]/10" />

              <ul className="flex flex-1 flex-col gap-3">
                {PLAN_FEATURES.map((text) => (
                  <li key={text} className="flex items-start gap-3 text-[#0B1F18]">
                    <span className="mt-[2px] flex h-5 w-5 flex-none items-center justify-center rounded-full bg-[#E3F0EA]">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#064E3B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M5 12.5l4.5 4.5L19 7.5" />
                      </svg>
                    </span>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>

              <Cta variant={selected ? "emerald" : "outline"}>{info.cta}</Cta>
            </div>
          );
        })}
      </div>
    </div>
  );
}
