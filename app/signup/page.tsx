// app/signup/page.tsx

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { signUp } from "@/app/auth-actions";
import { Field, Notice } from "@/components/auth/fields";
import { GoogleSignIn } from "@/components/auth/google-button";
import { AuthShell } from "@/components/auth/shell";
import { SubmitButton } from "@/components/auth/submit-button";
import { AuthTabs } from "@/components/auth/tabs";
import { param, type SearchParams } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Build your payment page", robots: { index: false } };

const ERRORS: Record<string, string> = {
  email: "Please enter a valid email address.",
  "password-short": "Your password needs at least 8 characters.",
  "password-long": "Your password can be at most 72 characters.",
  "password-weak": "Your password needs at least one letter and one number.",
  rate: "Too many attempts. Please wait a few minutes and try again.",
  signup: "We could not create your account. Please try again.",
  agree: "Please tick the box to agree to the Terms and Privacy Policy.",
};

export default async function SignUpPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  const params = await searchParams;
  const error = param(params, "error");
  const email = param(params, "email");

  return (
    <AuthShell title="Build your payment page" subtitle="All your payment methods. One simple link.">
      <AuthTabs active="signup" />
      <GoogleSignIn />
      <form action={signUp} className="flex flex-col gap-5" noValidate>
        {error && ERRORS[error] ? <Notice tone="error">{ERRORS[error]}</Notice> : null}
        <input type="hidden" name="from" value="signup" />
        <Field
          label="Email address"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          defaultValue={email}
          required={false}
          maxLength={254}
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          required={false}
          minLength={8}
          maxLength={72}
          hint="At least 8 characters, with a letter and a number."
        />
        <label
          className={`flex cursor-pointer items-start gap-3 text-[14px] leading-snug text-[#2F4A3E] ${
            error === "agree" ? "rounded-xl bg-[#FEF3F2] p-3 text-[#7A271A]" : ""
          }`}
        >
          <input
            type="checkbox"
            name="agree"
            value="yes"
            required
            className="mt-0.5 h-5 w-5 flex-none accent-[#064E3B]"
          />
          <span>
            I agree to the PayTree{" "}
            <Link href="/terms" target="_blank" className="font-semibold text-[#064E3B] underline underline-offset-2">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" target="_blank" className="font-semibold text-[#064E3B] underline underline-offset-2">
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        <SubmitButton pendingText="Building your page…">Build your payment page</SubmitButton>
      </form>
    </AuthShell>
  );
}
