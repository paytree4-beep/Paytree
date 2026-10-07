"use client";
// components/dashboard/getting-started.tsx
//
// "Get started" checklist on the dashboard: add payment methods, save or share
// the QR code, send the link to a customer. People who share on day one get
// value fast. Hides itself when all three are done, or when closed.

import Link from "next/link";
import { useEffect, useState } from "react";

import { STEP_EVENT, stepDone } from "@/lib/onboarding-steps";

const HIDE_KEY = "pt_steps_hidden";

export function GettingStarted({ methodCount }: { methodCount: number }) {
  const [state, setState] = useState<{ qr: boolean; share: boolean; hidden: boolean } | null>(null);

  useEffect(() => {
    const read = () => {
      let hidden = false;
      try {
        hidden = window.localStorage.getItem(HIDE_KEY) === "1";
      } catch {
        hidden = false;
      }
      setState({ qr: stepDone("qr"), share: stepDone("share"), hidden });
    };
    read();
    window.addEventListener(STEP_EVENT, read);
    return () => window.removeEventListener(STEP_EVENT, read);
  }, []);

  if (!state || state.hidden) return null;
  const steps = [
    { done: methodCount > 0, title: "Add your payment apps", detail: "Cash App, Venmo, Zelle and more.", href: "/dashboard/payments" },
    { done: state.qr, title: "Save or share your QR code", detail: "Put it on your counter, booth or Story.", href: "/dashboard?view=link" },
    { done: state.share, title: "Send your link to a customer", detail: "Copy it or share it in one tap.", href: "/dashboard?view=link" },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount === steps.length) return null;

  const hide = () => {
    try {
      window.localStorage.setItem(HIDE_KEY, "1");
    } catch {
      // ignore
    }
    setState({ ...state, hidden: true });
  };

  return (
    <section className="rounded-2xl border-2 border-[#C9A048] bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-[26px] leading-tight text-[#064E3B]">Get started 🍎</h2>
          <p className="text-[14px] text-[#3F574C]">
            {doneCount} of {steps.length} done. Pages that are shared on day one get paid much sooner.
          </p>
        </div>
        <button type="button" onClick={hide} aria-label="Hide" className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-full text-[#6B7F75] hover:bg-[#F3F4F2]">
          ✕
        </button>
      </div>
      <div className="mt-3 h-2 rounded-full bg-[#EEF3F0]">
        <div className="h-2 rounded-full bg-[#16A34A] transition-all" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
      </div>
      <ol className="mt-3 flex flex-col gap-2">
        {steps.map((s, i) => (
          <li key={s.title}>
            <Link
              href={s.href}
              className={`flex min-h-14 items-center gap-3 rounded-xl border px-3 ${
                s.done ? "border-[#BFE3CF] bg-[#ECF7F0]" : "border-[#DCE5DF] bg-white hover:bg-[#F7FAF8]"
              }`}
            >
              <span
                className={`flex h-8 w-8 flex-none items-center justify-center rounded-full text-[14px] font-bold ${
                  s.done ? "bg-[#16A34A] text-white" : "bg-[#F1E6CC] text-[#7A5A12]"
                }`}
              >
                {s.done ? "✓" : i + 1}
              </span>
              <span className="flex-1">
                <span className={`block font-bold ${s.done ? "text-[#3F574C] line-through decoration-[#16A34A]/50" : "text-[#0B1F18]"}`}>{s.title}</span>
                <span className="block text-[13px] text-[#4B6358]">{s.detail}</span>
              </span>
              {s.done ? null : <span className="font-bold text-[#064E3B]">›</span>}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
