"use client";
// components/payments/paid-gate.tsx
//
// "I've paid" only after paying: the box stays locked until the visitor taps
// one of the payment methods on the page. The method they opened is then
// filled in automatically ("Paid with: Cash App").

import { useEffect, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";

import { OPENED_EVENT, readOpened } from "@/lib/pay-intent";

function useOpened(scope: string, allowed: string[]): string[] {
  const [opened, setOpened] = useState<string[]>([]);
  const allowedKey = allowed.join(",");

  useEffect(() => {
    const ok = new Set(allowedKey.split(",").filter(Boolean));
    const sync = (extra?: string) => {
      const list = readOpened(scope);
      if (extra && !list.includes(extra)) list.unshift(extra);
      setOpened(list.filter((id) => ok.has(id)));
    };
    sync();
    const onOpened = (event: Event) => {
      const detail = (event as CustomEvent<{ scope: string; id: string }>).detail;
      if (detail?.scope === scope) sync(detail.id);
    };
    // Coming back from the payment app.
    const onVisible = () => {
      if (document.visibilityState === "visible") sync();
    };
    window.addEventListener(OPENED_EVENT, onOpened);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onVisible);
    return () => {
      window.removeEventListener(OPENED_EVENT, onOpened);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onVisible);
    };
  }, [scope, allowedKey]);

  return opened;
}

/** Shows `children` (the "I've paid" form) only after a method was opened. */
export function PaidGate({
  scope,
  allowed,
  locked,
  children,
}: {
  scope: string;
  /** Method ids shown on this page. */
  allowed: string[];
  /** What to show before any method was opened. */
  locked: ReactNode;
  children: ReactNode;
}) {
  const opened = useOpened(scope, allowed);
  return <>{opened.length > 0 ? children : locked}</>;
}

/**
 * Put inside the form: sends `method` with the app the visitor opened. If
 * they opened more than one, they can pick which one they used.
 */
export function OpenedMethodField({
  scope,
  labels,
  name = "method",
}: {
  scope: string;
  /** Method id -> label, for the methods on this page. */
  labels: Record<string, string>;
  name?: string;
}) {
  const opened = useOpened(scope, Object.keys(labels));
  const [picked, setPicked] = useState<string | null>(null);
  const value = picked && opened.includes(picked) ? picked : opened[0] ?? "";

  if (opened.length <= 1) {
    return (
      <div className="flex min-h-[52px] items-center justify-between gap-3 rounded-xl border border-[#BFE3CF] bg-[#ECF7F0] px-4">
        <span className="text-sm font-semibold text-[#3F574C]">Paid with</span>
        <span className="font-bold text-[#064E3B]">{labels[value] ?? "—"} ✓</span>
        <input type="hidden" name={name} value={value} />
      </div>
    );
  }

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold">Paid with</span>
      <select
        name={name}
        value={value}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => setPicked(e.target.value)}
        className="min-h-[52px] w-full rounded-xl border border-[#C9D6CE] bg-white px-4 text-base text-[#0B1F18] outline-none focus:border-[#064E3B]"
      >
        {opened.map((id) => (
          <option key={id} value={id}>
            {labels[id] ?? id}
          </option>
        ))}
      </select>
    </label>
  );
}

/** The locked message, shared by the public page and the bill page. */
export function PayFirstNote({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span aria-hidden="true" className="text-xl">🔒</span>
      <p className="text-[14px] leading-snug text-[#3F574C]">{text}</p>
    </div>
  );
}
