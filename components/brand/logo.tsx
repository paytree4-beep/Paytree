// components/brand/logo.tsx
//
// The PayTree mark (an apple tree whose trunk is a dollar sign) and the
// wordmark. The mark is a transparent PNG in /public, shown inside a round
// cream badge with a gold ring, on every page.

import Link from "next/link";

export function LogoMark({ size = 36 }: { size?: number; onDark?: boolean }) {
  const box = Math.round(size * 1.15);
  const inner = Math.round(box * 0.74);
  const ring = Math.max(2, Math.round(box / 15));
  return (
    <span
      aria-hidden="true"
      className="inline-flex flex-none items-center justify-center rounded-full bg-[#FAF5EA]"
      style={{ width: box, height: box, border: `${ring}px solid #B9A04A`, boxSizing: "border-box" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-mark.png" alt="" width={inner} height={inner} className="block" style={{ width: inner, height: inner }} />
    </span>
  );
}

export function Logo({
  size = 36,
  className = "",
  tone = "light",
}: {
  size?: number;
  className?: string;
  /** "light" for dark green backgrounds, "dark" for cream or white ones. */
  tone?: "light" | "dark";
}) {
  return (
    <Link
      href="/"
      className={`inline-flex min-h-11 items-center gap-2 font-bold ${tone === "dark" ? "text-[#064E3B]" : "text-[#FBFBFB]"} ${className}`}
      aria-label="PayTree home"
    >
      <LogoMark size={Math.round(size * 1.25)} />
      <span className="text-[21px]">PayTree</span>
    </Link>
  );
}
