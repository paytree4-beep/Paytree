// app/[username]/tip-gate.tsx
//
// Tip me pages: a "Send me a tip" label above the payment methods. The
// methods are always visible.

import type { ReactNode } from "react";

export function TipGate({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="mb-5 flex justify-center">
        <p className="inline-flex min-h-12 items-center rounded-full bg-gradient-to-br from-[#0B6B50] to-[#064E3B] px-8 font-serif text-[22px] leading-none text-white shadow-[0_12px_22px_-14px_rgba(6,78,59,0.8)]">
          Send me a tip
        </p>
      </div>
      {children}
    </>
  );
}
