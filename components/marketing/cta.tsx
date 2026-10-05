// components/marketing/cta.tsx
//
// Call-to-action used on the homepage. While sign-ups are closed (see
// SIGNUPS_OPEN in lib/site.ts) it renders a plain, non-clickable note instead
// of a link to a page that does not exist yet.

import Link from "next/link";
import type { ReactNode } from "react";

import { SIGNUPS_OPEN } from "@/lib/site";

type Variant = "gold" | "light" | "emerald" | "outline";

const STYLES: Record<Variant, string> = {
  gold: "bg-[#D9B873] text-[#064E3B]",
  light: "bg-[#FBFBFB] text-[#064E3B]",
  emerald: "bg-[#064E3B] text-[#FBFBFB]",
  outline: "border border-[#064E3B]/40 text-[#064E3B]",
};

export function Cta({
  children,
  variant = "emerald",
  href = "/signup",
  className = "",
}: {
  children: ReactNode;
  variant?: Variant;
  href?: string;
  className?: string;
}) {
  const base = `flex min-h-[52px] items-center justify-center rounded-full px-7 text-center font-bold ${STYLES[variant]} ${className}`;

  if (!SIGNUPS_OPEN) {
    return (
      <span role="note" className={`${base} opacity-80`}>
        Sign-ups open soon
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={`${base} transition-transform duration-150 hover:-translate-y-px motion-reduce:transition-none motion-reduce:hover:transform-none`}
    >
      {children}
    </Link>
  );
}
