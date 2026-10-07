"use client";
// components/ui/period-tabs.tsx
//
// Instant tabs (Today / This month / This year / All time). Every panel is
// already on the page, so switching never waits for the server. The choice
// is kept in the address bar, so a refresh opens the same tab.

import { useState } from "react";
import type { ReactNode } from "react";

export type PeriodTab = { id: string; label: string; content: ReactNode };

export function PeriodTabs({ tabs, initial, param = "period" }: { tabs: PeriodTab[]; initial: string; param?: string }) {
  const [active, setActive] = useState(tabs.some((t) => t.id === initial) ? initial : tabs[0]?.id);

  const pick = (id: string) => {
    setActive(id);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set(param, id);
      window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    } catch {
      // ignore
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Period">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={t.id === active}
            onClick={() => pick(t.id)}
            className={`inline-flex min-h-10 items-center rounded-full px-4 text-[14px] font-bold transition-colors ${
              t.id === active ? "bg-[#064E3B] text-white" : "border border-[#DCE5DF] bg-white text-[#064E3B]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.id} role="tabpanel" hidden={t.id !== active}>
          {t.content}
        </div>
      ))}
    </>
  );
}
