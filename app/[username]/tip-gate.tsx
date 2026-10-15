// app/[username]/tip-gate.tsx
//
// Tip me pages: a big yellow "Send me a tip" badge that wiggles, with a
// bouncing pointing hand and a hint that points to the payment methods below.
// The methods are always visible. Colors are inline so the page theme rules
// never override them. Motion is switched off for people who prefer less.

import type { ReactNode } from "react";

export function TipGate({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{`
        @keyframes pt-tip-wiggle {
          0%, 60%, 100% { transform: rotate(0deg) scale(1); }
          6%  { transform: rotate(-4deg) scale(1.04); }
          12% { transform: rotate(4deg) scale(1.04); }
          18% { transform: rotate(-4deg) scale(1.04); }
          24% { transform: rotate(4deg) scale(1.04); }
          30% { transform: rotate(-3deg) scale(1.03); }
          36% { transform: rotate(3deg) scale(1.03); }
          44% { transform: rotate(-1.5deg) scale(1.01); }
          52% { transform: rotate(1.5deg) scale(1.01); }
        }
        @keyframes pt-tip-hand {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }
        .pt-tip-badge { animation: pt-tip-wiggle 3.2s ease-in-out infinite; transform-origin: 50% 60%; }
        .pt-tip-hand { animation: pt-tip-hand 1s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .pt-tip-badge, .pt-tip-hand { animation: none; }
        }
      `}</style>

      <div className="mb-5 flex flex-col items-center">
        <p
          className="pt-tip-badge inline-flex min-h-[42px] items-center justify-center rounded-[14px] px-8 text-center font-sans text-[20px] font-bold leading-none"
          style={{
            background: "#F4C029",
            color: "#06382B",
            border: "2px solid #FFE68C",
            boxShadow: "0 4px 0 #96700A, 0 0 20px rgba(255,214,70,0.45)",
          }}
        >
          Send me a tip
        </p>
        <span aria-hidden="true" className="pt-tip-hand mt-2 text-[28px] leading-none">
          👇
        </span>
        <p className="text-[14px] font-semibold" style={{ color: "#F4C029" }}>
          Tap a method below
        </p>
      </div>
      {children}
    </>
  );
}
