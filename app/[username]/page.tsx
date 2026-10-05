// app/[username]/page.tsx
//
// Public payment page: paytree.me/<username>
// A Server Component. It loads the profile, validates every payment method on
// the server, and hands only safe, ready-to-render buttons to the client.
// The icons and interactivity live in ./payment-methods.tsx, because buttons
// that copy to the clipboard and open apps must run in the browser.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getProfileByUsername, resolveMethods } from "@/lib/profiles";
import { PaymentMethods } from "./payment-methods";
import { QrCard } from "./qr-card";

// Public address of the site, no trailing slash. Set NEXT_PUBLIC_SITE_URL in production.
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://paytree.me").replace(/\/+$/, "");

// Always read fresh data, so a change saved in the dashboard shows up on the
// public page immediately. Swap for tag-based revalidation if you add caching.
export const dynamic = "force-dynamic";

type PageProps = {
  // In Next.js 15 and later, route params arrive as a Promise.
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfileByUsername(username);

  if (!profile) {
    return { title: "Page not found · PayTree.me", robots: { index: false } };
  }

  return {
    title: `${profile.displayName} · PayTree.me`,
    description: `Pay ${profile.displayName} with Cash App, Venmo, PayPal, Zelle, bank transfer, card, Wise or crypto.`,
  };
}

export default async function PublicPaymentPage({ params }: PageProps) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);

  if (!profile) {
    notFound();
  }

  // Only methods the user entered, and that passed validation, come back.
  const methods = resolveMethods(profile.payments);
  const initial = profile.displayName.trim().charAt(0).toUpperCase() || "P";

  return (
    <div className="flex min-h-screen flex-col bg-[#FBFBFB] font-sans text-[#0B1F18]">
      {/* Profile header */}
      <header className="bg-[#064E3B] px-5 pb-12 pt-14 text-[#FBFBFB]">
        <div className="mx-auto flex max-w-[560px] flex-col items-center gap-3.5 text-center">
          <span
            aria-hidden="true"
            className="flex h-[92px] w-[92px] items-center justify-center rounded-full bg-[#FBFBFB] font-serif text-5xl leading-none text-[#064E3B] ring-4 ring-[#D9B873]/55"
          >
            {initial}
          </span>
          <h1 className="font-serif text-[2.9rem] font-normal leading-[1.05] tracking-tight">
            {profile.displayName}
          </h1>
          <p className="text-[15px] text-[#FBFBFB]/80">paytree.me/{profile.username}</p>
          {profile.bio ? (
            <p className="max-w-[420px] text-[#FBFBFB]/90">{profile.bio}</p>
          ) : null}
        </div>
      </header>

      {/* Payment methods */}
      <main className="mx-auto w-full max-w-[560px] flex-1 px-5 pb-28 pt-9">
        <PaymentMethods
          username={profile.username}
          displayName={profile.displayName}
          methods={methods}
        />

        <QrCard
          url={`${SITE_URL}/${profile.username}`}
          label={`${SITE_URL.replace(/^https?:\/\//, "")}/${profile.username}`}
        />

        <p className="mt-8 text-center text-[13px] text-[#4B6358]">
          Always confirm the recipient before you send money.
        </p>
        <p className="mt-2 text-center text-[13px] text-[#4B6358]">
          <Link href="/terms" className="underline-offset-2 hover:underline">
            Terms
          </Link>
          <span aria-hidden="true"> · </span>
          <Link href="/privacy" className="underline-offset-2 hover:underline">
            Privacy
          </Link>
        </p>
      </main>

      {/* Persistent promotional footer: stays pinned to the bottom of the viewport */}
      <footer
        className="sticky bottom-0 z-40 border-t border-[#D9B873]/45 bg-[#064E3B] px-4 pt-3.5 text-center text-[#FBFBFB]"
        style={{ paddingBottom: "max(0.875rem, env(safe-area-inset-bottom))" }}
      >
        <Link
          href="/"
          className="inline-flex min-h-11 items-center justify-center font-semibold hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9B873]"
        >
          <span aria-hidden="true">👉</span>
          <span className="ml-1.5">Get your own payment page by PayTree</span>
        </Link>
      </footer>
    </div>
  );
}
