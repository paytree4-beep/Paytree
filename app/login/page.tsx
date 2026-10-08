// app/login/page.tsx

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { logIn, resendConfirmation } from "@/app/auth-actions";
import { Field, Notice } from "@/components/auth/fields";
import { GoogleSignIn } from "@/components/auth/google-button";
import { AuthShell } from "@/components/auth/shell";
import { SubmitButton } from "@/components/auth/submit-button";
import { AuthTabs } from "@/components/auth/tabs";
import { param, safeNext, type SearchParams } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Log in", robots: { index: false } };

const ERRORS: Record<string, string> = {
  invalid: "That email and password do not match. Try again, or reset your password.",
  rate: "Too many attempts. Please wait a few minutes and try again.",
  link: "That link has expired or was already used. Log in, or ask for a new link.",
  google: "Google sign-in did not finish. Please try again, or use your email.",
};

const NOTICES: Record<string, string> = {
  confirmed: "Your email is confirmed. Log in to continue.",
  loggedout: "You are logged out.",
  deleted: "Your account and page have been deleted.",
};

export default async function LogInPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const next = safeNext(param(params, "next"));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect(next);

  const error = param(params, "error");
  const notice = param(params, "notice");
  const email = param(params, "email");

  return (
    <AuthShell title="Welcome back" subtitle="Log in to manage your payment page.">
      <AuthTabs active="login" />
      <GoogleSignIn />

      {error === "unconfirmed" ? (
        <div className="mb-5 flex flex-col gap-3">
          <Notice tone="info">
            Please confirm your email first. We sent you a link when you signed up.
          </Notice>
          <form action={resendConfirmation}>
            <input type="hidden" name="email" value={email ?? ""} />
            <SubmitButton variant="outline" pendingText="Sending…">
              Send the link again
            </SubmitButton>
          </form>
        </div>
      ) : null}

      <form action={logIn} className="flex flex-col gap-5" noValidate>
        {error && ERRORS[error] ? <Notice tone="error">{ERRORS[error]}</Notice> : null}
        {notice && NOTICES[notice] ? <Notice tone="success">{NOTICES[notice]}</Notice> : null}
        <input type="hidden" name="next" value={next} />
        <Field
          label="Email address"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          defaultValue={email}
          maxLength={254}
        />
        <Field label="Password" name="password" type="password" autoComplete="current-password" />
        <div className="-mt-2 text-right">
          <Link
            href="/forgot"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-[#064E3B] underline-offset-2 hover:underline"
          >
            Forgot your password?
          </Link>
        </div>
        <SubmitButton pendingText="Logging in…">Log in</SubmitButton>
      </form>
    </AuthShell>
  );
}
