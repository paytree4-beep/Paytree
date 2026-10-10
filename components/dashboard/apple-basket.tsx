// components/dashboard/apple-basket.tsx
//
// The owner's apple basket: their referral link, the apples they earned and
// the referral calculator. One apple = one friend who joined and paid ($0.25).

import { Apple } from "@/components/marketing/apples";
import { ShareLink } from "@/components/dashboard/share-link";
import { formatMoney } from "@/lib/payment-log";
import { APPLE_VALUE_CENTS, daysUntilHarvest, offerOpen, type Basket } from "@/lib/referrals";

export function AppleBasket({ link, name, basket, now }: { link: string; name: string; basket: Basket; now: number }) {
  const total = basket.red + basket.green;
  const shown = Math.min(total, 24);
  const days = daysUntilHarvest(now);
  const each = APPLE_VALUE_CENTS.monthly;

  return (
    <section id="apples" className="scroll-mt-4 rounded-2xl border border-[#E2C27A] bg-gradient-to-br from-white via-[#FBF6EA] to-[#F4E7C6] p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-[#7A5A12]">Your apple basket</h2>
        {offerOpen(now) ? (
          <span className="rounded-full bg-[#064E3B] px-3 py-1 text-[12px] font-bold text-[#FBFBFB]">
            🧺 Harvest in {days} {days === 1 ? "day" : "days"}
          </span>
        ) : null}
      </div>

      <p className="mt-2 text-[15px] text-[#3F574C]">
        Share your link. When a friend joins PayTree through it and pays, <strong>an apple drops in your basket</strong>.
        Each apple is worth <strong className="text-[#064E3B]">{formatMoney(each)}</strong>. On January 1, 2027, PayTree
        buys all your apples and pays you.
      </p>

      <p className="mt-4 break-all rounded-xl bg-white/80 px-4 py-3 font-semibold text-[#064E3B]">{link.replace(/^https?:\/\//, "")}</p>
      <div className="mt-3">
        <ShareLink url={link} name={name} />
      </div>

      <div className="mt-4 flex min-h-[64px] flex-wrap items-end gap-1 rounded-2xl border border-dashed border-[#D9B873] bg-white/60 p-3" aria-label={`${total} apples`}>
        {shown === 0 ? (
          <p className="w-full text-center text-[14px] text-[#7A5A12]">Your basket is empty. Share your link to grow your first apple.</p>
        ) : (
          <>
            {Array.from({ length: shown }, (_, i) => (
              <Apple key={i} color="red" size={30} />
            ))}
            {total > shown ? <span className="ml-1 text-[13px] font-bold text-[#7A5A12]">+{total - shown}</span> : null}
          </>
        )}
      </div>

      <div className="mt-4 rounded-2xl bg-white/80 p-4">
        <p className="text-[13px] font-bold uppercase tracking-[0.1em] text-[#4B6358]">Referral calculator</p>
        <dl className="mt-2 grid grid-cols-[1fr_auto] gap-y-1.5 text-[15px] tabular-nums">
          <dt>
            🍎 {total} {total === 1 ? "apple" : "apples"} × {formatMoney(each)}
          </dt>
          <dd className="text-right">{formatMoney(total * each)}</dd>
          {basket.paidCents > 0 ? (
            <>
              <dt className="text-[#4B6358]">Already paid to you</dt>
              <dd className="text-right text-[#4B6358]">−{formatMoney(basket.paidCents)}</dd>
            </>
          ) : null}
          <dt className="border-t border-[#E7DCC2] pt-2 font-bold text-[#064E3B]">Sell PayTree your apples</dt>
          <dd className="border-t border-[#E7DCC2] pt-2 text-right font-serif text-[24px] leading-none text-[#064E3B]">
            {formatMoney(basket.owedCents)}
          </dd>
        </dl>
        <p className="mt-3 text-[12px] text-[#4B6358]">
          Counted for friends who pay by December 31, 2026. We pay you on January 1, 2027, through a payment method on
          your PayTree page, so make sure you have one.
        </p>
      </div>
    </section>
  );
}
