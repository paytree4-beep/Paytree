// components/marketing/pricing.tsx
"use client";

// Monthly / yearly pricing cards. The selected plan is the emerald card.
// Prices come from lib/site.ts so they can never drift from the rest of the site.

import { useState } from "react";

import { Cta } from "@/components/marketing/cta";
import { PRICING } from "@/lib/site";

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
                selected ? "bg-[#064E3B] text-[#FBFBFB]" : "bg-transparent text-[#0B1F18]"
              }`}
            >
              {key === "monthly" ? "Monthly" : "Yearly"}
            </button>
          );
        })}
      </div>

      <div className="flex w-full flex-wrap items-stretch gap-6">
        {keys.map((key) => {
          const info = PRICING[key];
          const selected = plan === key;
          const badge = "badge" in info ? info.badge : "";
          return (
            <div
              key={key}
              className={`flex min-w-0 flex-[1_1_340px] flex-col gap-[22px] rounded-[28px] border-[1.5px] p-[38px] ${
                selected
                  ? "border-[#064E3B] bg-[#064E3B] text-[#FBFBFB] shadow-[0_30px_60px_-30px_rgba(6,78,59,0.6)]"
                  : "border-white/70 bg-white/60 text-[#0B1F18] backdrop-blur-xl"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-lg font-bold">{info.name}</span>
                {badge ? (
                  <span className="rounded-full bg-[#D9B873] px-3 py-1 text-[13px] font-bold text-[#064E3B]">
                    {badge}
                  </span>
                ) : null}
              </div>

              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-serif text-[68px] leading-none">{info.price}</span>
                <span className={selected ? "text-[#FBFBFB]/80" : "text-[#4B6358]"}>
                  {info.period}
                </span>
              </div>

              <p className={`min-h-6 text-[15px] ${selected ? "text-[#FBFBFB]/80" : "text-[#4B6358]"}`}>
                {info.note}
              </p>

              <div className={`h-px ${selected ? "bg-[#FBFBFB]/20" : "bg-[#E3EBE6]"}`} />

              <ul className="flex flex-1 flex-col gap-3">
                {PLAN_FEATURES.map((text) => (
                  <li key={text} className="flex items-start gap-3">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={selected ? "#D9B873" : "#064E3B"}
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      className="mt-[3px] flex-none"
                    >
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>

              <Cta variant={selected ? "gold" : "emerald"}>{info.cta}</Cta>
            </div>
          );
        })}
      </div>
    </div>
  );
}
