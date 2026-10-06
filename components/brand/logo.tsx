// components/brand/logo.tsx
//
// The PayTree mark (an apple tree whose trunk is a dollar sign) and the
// wordmark. The mark is a transparent PNG in /public.

import Link from "next/link";

export function LogoMark({ size = 36, onDark = false }: { size?: number; onDark?: boolean }) {
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/logo-mark.png" alt="" width={size} height={size} className="block" style={{ width: size, height: size }} />
  );
  // On dark green the leaves need a light backdrop to stay visible.
  if (!onDark) return img;
  return (
    <span
      aria-hidden="true"
      className="inline-flex items-center justify-center rounded-[28%] bg-[#FAF5EA]"
      style={{ width: size + 8, height: size + 8 }}
    >
      {img}
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
      <LogoMark size={Math.round(size * 1.25)} onDark={tone !== "dark"} />
      <span className="text-[21px]">PayTree</span>
    </Link>
  );
}
