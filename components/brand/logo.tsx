// components/brand/logo.tsx
//
// The PayTree mark and wordmark, drawn exactly as on the legal pages and the
// design previews.

import Link from "next/link";

export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="#D9B873"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11 10 L16 5 L21 10" />
      <path d="M9 16 L16 9 L23 16" />
      <path d="M7 22 L16 13 L25 22" />
      <path d="M16 22 V28" />
    </svg>
  );
}

export function Logo({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <Link
      href="/"
      className={`inline-flex min-h-11 items-center gap-2.5 font-bold text-[#FBFBFB] ${className}`}
      aria-label="PayTree home"
    >
      <LogoMark size={size} />
      <span className="text-[21px]">
        PayTree
      </span>
    </Link>
  );
}
