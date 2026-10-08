"use client";
// app/[username]/tip-gate.tsx
//
// Tip me pages: a small "Send me a tip" button. The payment methods stay
// folded away until the visitor taps it.

import { useState } from "react";
import type { ReactNode } from "react";

export function TipGate({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="mb-5 flex justify-center">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex min-h-12 items-center rounded-full bg-gradient-to-br from-[#0B6B50] to-[#064E3B] px-8 font-serif text-[22px] leading-none text-white shadow-[0_12px_22px_-14px_rgba(6,78,59,0.8)] active:scale-[0.98]"
        >
          Send me a tip
        </button>
      </div>
      <div hidden={!open}>{children}</div>
    </>
  );
}
