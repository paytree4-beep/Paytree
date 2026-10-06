// components/brand/page-loader.tsx
//
// Shown instantly while a page loads, instead of a blank white screen:
// the PayTree tree with three apples bouncing under it.

import { Apple } from "@/components/marketing/apples";

export function PageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[#FAF5EA] text-[#064E3B]" role="status" aria-live="polite">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-mark.png" alt="" width={72} height={72} className="h-[72px] w-[72px]" />
      <div className="flex items-end gap-3" aria-hidden="true">
        {(["red", "green", "yellow"] as const).map((c, i) => (
          <span key={c} className="pt-hop inline-block" style={{ animationDelay: `${i * 0.15}s` }}>
            <Apple color={c} size={26} />
          </span>
        ))}
      </div>
      <p className="text-[15px] font-semibold">{label}</p>
    </div>
  );
}
