"use client";
// components/marketing/harvest-card.tsx
//
// Homepage card under the main button: how many days are left to sell apples.
// The number is worked out in the visitor's browser, so it is always today's.

import { useEffect, useState } from "react";

import { daysUntilHarvest } from "@/lib/referrals";

export function HarvestCard() {
  const [days, setDays] = useState<number>(() => daysUntilHarvest(Date.now()));

  useEffect(() => {
    setDays(daysUntilHarvest(Date.now()));
  }, []);

  const title =
    days > 1 ? `${days} days left to sell your apples` : days === 1 ? "1 day left to sell your apples" : "Harvest Day is here";

  return (
    <div className="mt-1 flex w-full max-w-[460px] items-center gap-3 rounded-[22px] border-[1.5px] border-[#E8C766] bg-white px-4 py-3 text-left shadow-[0_10px_20px_-14px_rgba(154,110,26,0.6)]">
      <span aria-hidden="true" className="text-[34px] leading-none">🧺</span>
      <div>
        <p className="text-[15px] font-extrabold leading-snug text-[#064E3B]">{title}</p>
        <p className="mt-0.5 text-[12.5px] font-semibold leading-snug text-[#4B6358]">
          Harvest Day: Jan 1, 2027 &middot; We buy them and pay you
        </p>
      </div>
    </div>
  );
}
