// components/auth/shell.tsx
//
// Shared frame for the sign-up, log-in and password pages: the brand panel on
// the left (on top, slimmed down, on phones) and the form on the right.

import type { ReactNode } from "react";

import { Logo } from "@/components/brand/logo";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#FBFBFB] text-[#0B1F18] lg:flex-row">
      <aside className="bg-[#064E3B] px-5 py-4 text-[#FBFBFB] lg:flex lg:w-[44%] lg:flex-col lg:justify-between lg:px-14 lg:py-12">
        <Logo />
        <div className="hidden lg:block">
          <p className="font-serif text-[52px] leading-[1.05] tracking-[-0.01em]">
            Every way to pay you.
            <br />
            <span className="text-[#D9B873]">One refined link.</span>
          </p>
          <p className="mt-5 max-w-[420px] text-lg text-[#FBFBFB]/80">
            Cash App, Venmo, Zelle, cards and more, arranged exactly the way you want them.
          </p>
        </div>
        <p className="hidden max-w-[420px] text-sm text-[#FBFBFB]/70 lg:block">
          PayTree never holds your money. Payments go straight to your own accounts.
        </p>
      </aside>

      <main className="flex flex-1 justify-center px-5 pb-16 pt-10 lg:items-center lg:py-16">
        <div className="w-full max-w-[420px]">
          <h1 className="font-serif text-[40px] font-normal leading-[1.05] tracking-[-0.01em] text-[#064E3B]">
            {title}
          </h1>
          {subtitle ? <p className="mt-2 text-[#4B6358]">{subtitle}</p> : null}
          <div className="mt-7">{children}</div>
        </div>
      </main>
    </div>
  );
}
