"use client";

// components/payments/my-split-status.tsx
//
// Remembers, on this phone, the name a friend typed when they tapped "I've paid".
// When they open the bill again, they see their own status (waiting / confirmed)
// instead of the payment form.

import { useEffect, useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

export type SplitRow = { name: string; confirmed: boolean };

const keyFor = (splitId: string) => `paytree-split-name:${splitId}`;

function useMyRow(splitId: string, rows: SplitRow[]): SplitRow | null {
  const [saved, setSaved] = useState("");
  useEffect(() => {
    try {
      setSaved(window.localStorage.getItem(keyFor(splitId)) ?? "");
    } catch {
      setSaved("");
    }
  }, [splitId]);
  const wanted = saved.trim().toLowerCase();
  if (!wanted) return null;
  return rows.find((r) => r.name.trim().toLowerCase() === wanted) ?? null;
}

export function MyStatusBanner({ splitId, rows, ownerName }: { splitId: string; rows: SplitRow[]; ownerName: string }) {
  const mine = useMyRow(splitId, rows);
  if (!mine) return null;
  return mine.confirmed ? (
    <p role="status" className="mt-4 rounded-2xl border border-[#16A34A]/40 bg-[#E3F5E9] px-4 py-3 text-center text-[17px] font-bold text-[#0F6B35]">
      ✓ Your payment is confirmed. Thank you!
    </p>
  ) : (
    <p role="status" className="mt-4 rounded-2xl border border-[#E2C27A] bg-[#FBF6EA] px-4 py-3 text-center text-[17px] font-bold text-[#7A5A12]">
      ⏳ You said you paid. Waiting for {ownerName} to confirm.
    </p>
  );
}

export function HideIfPaid({ splitId, rows, children }: { splitId: string; rows: SplitRow[]; children: ReactNode }) {
  const mine = useMyRow(splitId, rows);
  return mine ? null : <>{children}</>;
}

export function RememberNameInput({ splitId, ...props }: { splitId: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      onChange={(e) => {
        try {
          window.localStorage.setItem(keyFor(splitId), e.target.value);
        } catch {
          // Storage can be blocked: the form still works without it.
        }
        props.onChange?.(e);
      }}
    />
  );
}
