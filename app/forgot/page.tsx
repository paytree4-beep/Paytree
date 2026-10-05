// app/forgot/page.tsx

import type { Metadata } from "next";
import Link from "next/link";

import { sendPasswordReset } from "@/app/auth-actions";
import { Field, Notice } from "@/components/auth/fields";
import { AuthShell } from "@/components/auth/shell";
import { SubmitButton } from "@/components/auth/submit-button";
import { param, type SearchParams } from "@/lib/auth";

export const metadata: Metadata = { title: "Reset your password", robots: { index: false } };

const ERRORS: Record<string, string> = {
  email: "Please enter a valid email address.",
  rate: "Too many emails were sent. Please wait a few minutes and try again.",
  link: "That reset link has expired or was already used. Ask for a new one below.",
  browser: "Please open the reset link on the same device and browser you asked for it on, or ask for a new one below.",
};

export default async function ForgotPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const error = param(params, "error");
  const sent = param(params, "sent");

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email and we will send you a link to choose a new password."
    >
      <form action={sendPasswordReset} className="flex flex-col gap-5" noValidate>
        {sent ? (
          <Notice tone="success">
            If an account exists for that email, a reset link is on its way. It expires in 1 hour.
          </Notice>
        ) : null}
        {error && ERRORS[error] ? <Notice tone="error">{ERRORS[error]}</Notice> : null}
        <Field
          label="Email address"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          maxLength={254}
        />
        <SubmitButton pendingText="Sending…">Send reset link</SubmitButton>
        <Link
          href="/login"
          className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-[#064E3B] underline-offset-2 hover:underline"
        >
          Back to log in
        </Link>
      </form>
    </AuthShell>
  );
}
