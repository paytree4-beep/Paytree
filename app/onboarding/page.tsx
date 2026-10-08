// app/onboarding/page.tsx
//
// First stop after confirming an email: pick a display name and the link.

import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { claimPage } from "@/app/dashboard/actions";
import { Field, Notice } from "@/components/auth/fields";
import { AuthShell } from "@/components/auth/shell";
import { SubmitButton } from "@/components/auth/submit-button";
import { param, type SearchParams } from "@/lib/auth";
import { SITE_HOST } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Choose your link", robots: { index: false } };
export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  name: "Your display name needs 2 to 60 characters.",
  handle:
    "Your link name needs 3 to 30 characters: lowercase letters, numbers, dots, hyphens and underscores, starting with a letter or number.",
  taken: "That link name is already taken. Please choose another.",
  reserved: "That name is reserved. Please choose another.",
  save: "We could not save your page. Please try again.",
};

export default async function OnboardingPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/onboarding");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (profile) redirect("/dashboard");

  const params = await searchParams;
  const error = param(params, "error");

  return (
    <AuthShell
      title="Choose your link"
      subtitle="This is the address you will share with clients."
    >
      <form action={claimPage} className="flex flex-col gap-5" noValidate>
        {error && ERRORS[error] ? <Notice tone="error">{ERRORS[error]}</Notice> : null}
        <Field
          label="Display name"
          name="display_name"
          autoComplete="name"
          autoCapitalize="words"
          defaultValue={param(params, "name")}
          minLength={2}
          maxLength={60}
          hint="Your name or your business name, as clients know it."
        />
        <Field
          label="Link name"
          name="username"
          prefix={`${SITE_HOST}/`}
          autoComplete="username"
          defaultValue={param(params, "handle")}
          minLength={3}
          maxLength={30}
          hint="3 to 30 characters: lowercase letters, numbers, dots, hyphens and underscores."
        />
        <SubmitButton pendingText="Claiming your page…">Claim my page</SubmitButton>
      </form>
    </AuthShell>
  );
}
