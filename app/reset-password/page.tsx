// app/reset-password/page.tsx
//
// Reached from the password reset email (the callback signs the person in
// first). The middleware sends anyone who is not signed in to /login.

import type { Metadata } from "next";

import { updatePassword } from "@/app/auth-actions";
import { Field, Notice } from "@/components/auth/fields";
import { AuthShell } from "@/components/auth/shell";
import { SubmitButton } from "@/components/auth/submit-button";
import { param, type SearchParams } from "@/lib/auth";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

const ERRORS: Record<string, string> = {
  "password-short": "Your password needs at least 8 characters.",
  "password-long": "Your password can be at most 72 characters.",
  "password-weak": "Your password needs at least one letter and one number.",
  same: "Please choose a password you have not used before.",
  update: "We could not update your password. Please try again.",
};

export default async function ResetPasswordPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const error = param(params, "error");

  return (
    <AuthShell title="Choose a new password">
      <form action={updatePassword} className="flex flex-col gap-5" noValidate>
        {error && ERRORS[error] ? <Notice tone="error">{ERRORS[error]}</Notice> : null}
        <Field
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={72}
          hint="At least 8 characters, with a letter and a number."
        />
        <SubmitButton pendingText="Saving…">Save new password</SubmitButton>
      </form>
    </AuthShell>
  );
}
