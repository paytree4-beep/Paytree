"use client";
// components/ui/instant-actions.tsx
//
// Buttons that answer at once. The screen changes the moment you tap, the
// change is saved quietly in the background, and if saving ever fails the
// screen goes back with a short message. Used for confirming a payment and
// for deleting an invoice or a split bill.

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { MouseEvent } from "react";

type Action = (id: string) => Promise<boolean>;

const primary = "inline-flex min-h-10 items-center rounded-full bg-[#064E3B] px-4 text-[13px] font-bold text-[#FBFBFB]";
const link = "inline-flex min-h-10 items-center px-2 text-[13px] text-[#B42318] underline underline-offset-2";

/** "Confirm ✓" and the "no, it did not arrive" button, side by side. */
export function ConfirmPair({
  id,
  confirm,
  reject,
  rejectLabel,
}: {
  id: string;
  confirm: Action;
  reject: Action;
  rejectLabel: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "confirmed" | "rejected">("idle");
  const [failed, setFailed] = useState(false);

  async function run(next: "confirmed" | "rejected", action: Action) {
    setFailed(false);
    setState(next);
    let ok = false;
    try {
      ok = await action(id);
    } catch {
      ok = false;
    }
    if (!ok) {
      setState("idle");
      setFailed(true);
      return;
    }
    router.refresh();
  }

  if (state === "confirmed") return <span className="inline-flex min-h-10 items-center text-[14px] font-bold text-[#16A34A]">Confirmed ✓</span>;
  if (state === "rejected") return <span className="inline-flex min-h-10 items-center text-[14px] font-semibold text-[#6B7F75]">Done</span>;
  return (
    <span className="flex flex-wrap items-center gap-1">
      <button type="button" onClick={() => run("confirmed", confirm)} className={primary}>
        Confirm ✓
      </button>
      <button type="button" onClick={() => run("rejected", reject)} className={link}>
        {rejectLabel}
      </button>
      {failed ? <span className="w-full text-[12px] text-[#B42318]">Could not save. Please try again.</span> : null}
    </span>
  );
}

/** Deletes at once: the row disappears, then it is saved. Comes back if saving fails. */
export function InstantDelete({ id, action, label = "Delete" }: { id: string; action: Action; label?: string }) {
  const router = useRouter();
  const [gone, setGone] = useState(false);
  const [failed, setFailed] = useState(false);

  async function run(event: MouseEvent<HTMLButtonElement>) {
    const row = event.currentTarget.closest<HTMLElement>("[data-instant-row]");
    setFailed(false);
    if (row) row.style.display = "none";
    setGone(true);
    let ok = false;
    try {
      ok = await action(id);
    } catch {
      ok = false;
    }
    if (!ok) {
      if (row) row.style.display = "";
      setGone(false);
      setFailed(true);
      return;
    }
    router.refresh();
  }

  return (
    <>
      <button type="button" onClick={run} disabled={gone} className={link}>
        {label}
      </button>
      {failed ? <span className="text-[12px] text-[#B42318]">Could not delete. Try again.</span> : null}
    </>
  );
}
