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
      subtitle={
        <>
          We sent a confirmation link to{" "}
          <strong className="text-[#0B1F18]">{email ?? "your email address"}</strong>. Open it to
          activate your account.
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {sent ? <Notice tone="success">A new link is on its way.</Notice> : null}
        {error === "rate" ? (
          <Notice tone="error">Too many emails were sent. Please wait a few minutes and try again.</Notice>
        ) : null}
        <p className="text-[15px] text-[#4B6358]">
          Can&rsquo;t find it? Look in your spam or promotions folder. Open the link on this
          device if you can.
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
          className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-[#064E3B] underline-offset-2 hover:underline"
        >
          Use a different email
        </Link>
      </div>
    </AuthShell>
  );
}
