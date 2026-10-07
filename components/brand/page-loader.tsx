// components/brand/page-loader.tsx
//
// Shown instantly while a page loads, instead of a blank white screen: the
// PayTree logo with a small spinner. No apples here; apples are kept for the
// one-time welcome and for payments.

export function PageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#FAF5EA] text-[#064E3B]" role="status" aria-live="polite">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-mark.png" alt="" width={64} height={64} className="h-16 w-16" />
      <span aria-hidden="true" className="pt-spin inline-block h-6 w-6 rounded-full border-[3px] border-[#C9D6CE] border-t-[#064E3B]" />
      <p className="text-[15px] font-semibold">{label}</p>
    </div>
  );
}
