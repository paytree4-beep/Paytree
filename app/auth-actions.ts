"use server";
// app/auth-actions.ts
//
// Server Actions for signing up, logging in, password resets and logging out.
// Every action validates its input on the server and redirects back with a
// short code (?error=...) that the page turns into a friendly message.
// Messages never reveal whether an email address has an account.

import { redirect } from "next/navigation";

import { cleanEmail, passwordProblem, requestOrigin, safeNext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function qs(values: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value) search.set(key, value);
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

export async function signUp(formData: FormData): Promise<void> {
  const email = cleanEmail(formData.get("email"));
  if (!email) redirect(`/signup${qs({ error: "email" })}`);

  const password = formData.get("password");
  const problem = passwordProblem(password);
  if (problem) redirect(`/signup${qs({ error: `password-${problem}`, email })}`);

  const origin = await requestOrigin();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: String(password),
    options: { emailRedirectTo: `${origin}/auth/callback?next=/onboarding` },
  });

  if (error) {
    const code = error.code === "over_email_send_rate_limit" || error.status === 429 ? "rate" : "signup";
    redirect(`/signup${qs({ error: code, email })}`);
  }

  // Email confirmation switched off in Supabase: the user is signed in already.
  if (data.session) redirect("/onboarding");

  redirect(`/check-email${qs({ email })}`);
}

export async function resendConfirmation(formData: FormData): Promise<void> {
  const email = cleanEmail(formData.get("email"));
  if (!email) redirect("/check-email?error=email");

  const origin = await requestOrigin();
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${origin}/auth/callback?next=/onboarding` },
  });

  if (error && (error.code === "over_email_send_rate_limit" || error.status === 429)) {
    redirect(`/check-email${qs({ email, error: "rate" })}`);
  }
  redirect(`/check-email${qs({ email, sent: "1" })}`);
}

export async function logIn(formData: FormData): Promise<void> {
  const next = safeNext(formData.get("next"));
  const email = cleanEmail(formData.get("email"));
  const password = formData.get("password");
  if (!email || typeof password !== "string" || password.length === 0) {
    redirect(`/login${qs({ error: "invalid", next: next === "/dashboard" ? undefined : next })}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.code === "email_not_confirmed") {
      redirect(`/login${qs({ error: "unconfirmed", email })}`);
    }
    const code = error.status === 429 ? "rate" : "invalid";
    redirect(`/login${qs({ error: code, email, next: next === "/dashboard" ? undefined : next })}`);
  }

  redirect(next);
}

export async function sendPasswordReset(formData: FormData): Promise<void> {
  const email = cleanEmail(formData.get("email"));
  if (!email) redirect("/forgot?error=email");

  const origin = await requestOrigin();
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error && (error.code === "over_email_send_rate_limit" || error.status === 429)) {
    redirect("/forgot?error=rate");
  }
  // Same answer whether or not the account exists.
  redirect("/forgot?sent=1");
}

export async function updatePassword(formData: FormData): Promise<void> {
  const password = formData.get("password");
  const problem = passwordProblem(password);
  if (problem) redirect(`/reset-password?error=password-${problem}`);

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: String(password) });
  if (error) {
    const code = error.code === "same_password" ? "same" : "update";
    redirect(`/reset-password?error=${code}`);
  }
  redirect("/dashboard?notice=password");
}

export async function logOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login?notice=loggedout");
}
