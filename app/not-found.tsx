// app/not-found.tsx
//
// Shown for any address that does not exist, and whenever a page calls
// notFound(), for example paytree.me/<username> for a name nobody has claimed.

import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FBFBFB] text-[#0B1F18]">
      <header className="bg-[#064E3B] px-6 py-5">
        <div className="mx-auto max-w-[1100px]">
          <Logo />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[640px] flex-1 flex-col items-center justify-center gap-5 px-6 py-20 text-center">
        <p className="text-sm font-bold tracking-[0.12em] text-[#064E3B]">ERROR 404</p>
        <h1 className="font-serif text-[clamp(40px,6vw,64px)] font-normal leading-[1.05] tracking-[-0.02em] text-[#064E3B]">
          We couldn&rsquo;t find that page
        </h1>
        <p className="text-lg text-[#4B6358]">
          The link may be mistyped, or the page may have been moved or removed. Check the address and
          try again.
        </p>
        <Link
          href="/"
          className="mt-2 inline-flex min-h-[52px] items-center justify-center rounded-full bg-[#064E3B] px-8 font-bold text-[#FBFBFB] transition-transform duration-150 hover:-translate-y-px motion-reduce:transition-none motion-reduce:hover:transform-none"
        >
          Back to PayTree
        </Link>
      </main>
    </div>
  );
}
