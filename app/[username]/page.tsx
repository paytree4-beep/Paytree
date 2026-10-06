// app/[username]/page.tsx
//
// Public payment page: paytree.to/<username>
// A Server Component. It loads the profile, validates every payment method on
// the server, and hands only safe, ready-to-render buttons to the client.
// The icons and interactivity live in ./payment-methods.tsx, because buttons
// that copy to the clipboard and open apps must run in the browser.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { applyOrder, getProfileByUsername, resolveMethods } from "@/lib/profiles";
import { SITE_HOST, SITE_URL } from "@/lib/site";
import { PaymentMethods } from "./payment-methods";
import { QrCard } from "./qr-card";
import { AppleHalo } from "@/components/marketing/apples";
import { PaidForm } from "./paid-form";
import { param, type SearchParams } from "@/lib/auth";


// Always read fresh data, so a change saved in the dashboard shows up on the
// public page immediately. Swap for tag-based revalidation if you add caching.
export const dynamic = "force-dynamic";

type PageProps = {
  // In Next.js 15 and later, route params arrive as a Promise.
  params: Promise<{ username: string }>;
  searchParams: SearchParams;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfileByUsername(username);

  if (!profile) {
    return { title: "Page not found · PayTree", robots: { index: false } };
  }

  return {
    title: `${profile.displayName} · PayTree`,
    description: `Pay ${profile.displayName} with Cash App, Venmo, PayPal, Zelle, bank transfer, card, Wise or crypto.`,
  };
}

export default async function PublicPaymentPage({ params, searchParams }: PageProps) {
  const { username } = await params;
  const query = await searchParams;
  const profile = await getProfileByUsername(username);

  if (!profile) {
    notFound();
  }

  // Only methods the user entered, and that passed validation, come back.
  if (profile.paused) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[#FBFBFB] px-6 text-center text-[#0B1F18]">
        <p className="text-sm font-bold tracking-[0.12em] text-[#064E3B]">PAGE PAUSED</p>
        <h1 className="font-serif text-[clamp(34px,6vw,52px)] font-normal leading-[1.08] text-[#064E3B]">
          {profile.displayName}&rsquo;s page is paused
        </h1>
        <p className="max-w-[420px] text-[#4B6358]">
          This payment page is not available right now. Please contact {profile.displayName} for another
          way to pay.
        </p>
        <Link href="/login" className="text-sm font-semibold text-[#064E3B] underline underline-offset-2">
          Is this your page? Log in to turn it back on
        </Link>
      </div>
    );
  }

  const methods = applyOrder(resolveMethods(profile.payments), profile.order);
  const initial = profile.displayName.trim().charAt(0).toUpperCase() || "P";

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF5EA] font-sans text-[#0B1F18]">
      {/* Profile header */}
      <header className="relative overflow-hidden bg-gradient-to-b from-[#E6F2EA] via-[#F1F6EE] to-[#FAF5EA] px-5 pb-8 pt-10 text-[#064E3B]">
        <AppleHalo />
        <div className="relative mx-auto flex max-w-[560px] flex-col items-center gap-1.5 text-center">
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatarUrl}
              alt=""
              width={120}
              height={120}
              className="mb-2 h-[120px] w-[120px] rounded-full bg-white object-cover shadow-[0_12px_30px_-12px_rgba(6,78,59,0.5)] ring-4 ring-white"
            />
          ) : (
            <span
              aria-hidden="true"
              className="mb-2 flex h-[120px] w-[120px] items-center justify-center rounded-full bg-[#064E3B] font-serif text-6xl leading-none text-[#FBFBFB] shadow-[0_12px_30px_-12px_rgba(6,78,59,0.5)] ring-4 ring-white"
            >
              {initial}
            </span>
          )}
          <h1 className="font-serif text-[2rem] font-normal leading-[1.1] tracking-tight">
            {profile.displayName}
          </h1>
          <p className="text-[13px] text-[#4B6358]">
            {SITE_HOST}/{profile.username}
          </p>
          {profile.bio ? (
            <p className="max-w-[420px] text-[15px] text-[#3F574C]">{profile.bio}</p>
          ) : null}
        </div>
      </header>

      {/* Payment methods */}
      <main className="mx-auto w-full max-w-[560px] flex-1 px-5 pb-28 pt-6">
        <PaymentMethods
          username={profile.username}
          displayName={profile.displayName}
          methods={methods}
          extraIndex={profile.paidPosition}
          extra={
            profile.paymentLog ? (
              <PaidForm
                username={profile.username}
                displayName={profile.displayName}
                methods={methods.map((m) => m.id)}
                sent={param(query, "paid") === "1"}
                error={param(query, "paid_error")}
              />
            ) : null
          }
        />

        <QrCard
          url={`${SITE_URL}/${profile.username}`}
          label={`${SITE_HOST}/${profile.username}`}
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
        className="sticky bottom-0 z-40 border-t border-white/80 bg-white/75 px-4 pt-3.5 text-center text-[#064E3B] backdrop-blur-xl"
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
