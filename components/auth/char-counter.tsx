"use client";

// components/auth/char-counter.tsx
//
// Small live counter shown under a text box that has a character limit.
// It listens to the box by id, so the form itself stays a plain HTML form.

import { useEffect, useState } from "react";

export function CharCounter({ targetId, max, initial }: { targetId: string; max: number; initial: number }) {
  const [count, setCount] = useState(initial);

  useEffect(() => {
    const el = document.getElementById(targetId) as HTMLTextAreaElement | HTMLInputElement | null;
    if (!el) return;
    const update = () => setCount(el.value.length);
    update();
    el.addEventListener("input", update);
    return () => el.removeEventListener("input", update);
  }, [targetId]);

  const full = count >= max;
  return (
    <div className="flex items-center justify-between gap-3" aria-live="polite">
      <span className="text-[15px] font-semibold" style={{ color: full ? "#B42318" : "transparent" }}>
        {full ? "Max reached" : "."}
      </span>
      <span className="text-[15px] font-bold" style={{ color: full ? "#B42318" : "#2C463A" }}>
        {count}/{max}
      </span>
    </div>
  );
}
