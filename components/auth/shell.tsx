// components/auth/shell.tsx
//
// Shared frame for the sign-up, log-in, password and onboarding pages, in the
// same cream, glass and apples style as the homepage.

import type { ReactNode } from "react";

import { Logo } from "@/components/brand/logo";
import { AppleBackdrop } from "@/components/marketing/apples";

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
    <div className="relative min-h-screen overflow-x-clip bg-[#FAF5EA] text-[#0B1F18]">
      <AppleBackdrop />

      <header className="sticky top-0 z-30 border-b border-white/80 bg-[#FAF5EA]/80 px-4 py-2.5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1100px] items-center">
          <Logo size={30} tone="dark" />
        </div>
      </header>

      <div className="relative z-10 mx-auto flex max-w-[1100px] flex-col items-center gap-10 px-5 pb-16 pt-8 lg:flex-row lg:items-center lg:justify-between lg:pt-16">
        <section className="hidden max-w-[460px] lg:block">
          <p className="font-serif text-[52px] uppercase leading-[1.04] tracking-[-0.01em] text-[#064E3B]">
            All your payment methods.
            <br />
            <span className="text-[#B8893A]">One simple link.</span>
          </p>
          <p className="mt-5 text-[19px] leading-[1.65] text-[#1F362B]">
            Make it easier and faster for your customers to pay you.
          </p>
          <p className="mt-6 text-[15px] font-medium text-[#2F4A3E]">
            PayTree never holds your money. Payments go straight to your own accounts.
          </p>
        </section>

        <main className="w-full max-w-[460px] rounded-[28px] border border-white/90 bg-white/80 p-6 shadow-[0_30px_60px_-30px_rgba(6,78,59,0.35)] backdrop-blur-xl sm:p-8">
          <h1 className="font-serif text-[38px] font-normal leading-[1.05] tracking-[-0.01em] text-[#064E3B]">
            {title}
          </h1>
          {subtitle ? <p className="mt-2 text-[16px] text-[#2F4A3E]">{subtitle}</p> : null}
          <div className="mt-7">{children}</div>
        </main>
      </div>
    </div>
  );
}
