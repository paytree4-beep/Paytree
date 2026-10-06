// app/check-email/page.tsx
//
// Shown right after sign-up while the confirmation email is on its way.

import type { Metadata } from "next";
import Link from "next/link";

import { resendConfirmation } from "@/app/auth-actions";
import { Notice } from "@/components/auth/fields";
import { AuthShell } from "@/components/auth/shell";
import { SubmitButton } from "@/components/auth/submit-button";
import { param, type SearchParams } from "@/lib/auth";

export const metadata: Metadata = { title: "Check your inbox", robots: { index: false } };

export default async function CheckEmailPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const email = param(params, "email");
  const sent = param(params, "sent");
  const error = param(params, "error");

  return (
    <AuthShell
      title="Check your inbox"
      subtitle="We sent a confirmation link to this address. Open it to activate your account."
    >
      <div className="flex flex-col gap-5">
        {email ? (
          <div className="rounded-2xl border-2 border-[#D9B873] bg-[#FBF6EA] p-4 text-center">
            <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-[#7A5A12]">Your email</p>
            <p className="mt-1 break-all text-[20px] font-bold text-[#064E3B]">{email}</p>
            <p className="mt-2 text-[14px] text-[#5C4513]">Please check it is spelled correctly.</p>
          </div>
        ) : null}
        {sent ? <Notice tone="success">A new link is on its way.</Notice> : null}
        {error === "rate" ? (
          <Notice tone="error">Too many emails were sent. Please wait a few minutes and try again.</Notice>
        ) : null}
        <p className="text-[15px] text-[#4B6358]">
          Can&rsquo;t find it? Wait a minute, then look in your spam or junk folder.
        </p>
        {email ? (
          <form action={resendConfirmation}>
            <input type="hidden" name="email" value={email} />
            <SubmitButton variant="outline" pendingText="Sending…">
              Send it again
            </SubmitButton>
          </form>
        ) : null}
        <Link
          href="/signup"
          className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-[#064E3B] px-7 font-bold text-[#FBFBFB]"
        >
          Wrong email? Sign up again
        </Link>
      </div>
    </AuthShell>
  );
}
