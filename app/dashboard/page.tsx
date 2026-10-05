// app/dashboard/page.tsx
//
// The signed-in home. For now: the public link, the profile details and the
// publish switch. Payment methods arrive in the next phase.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { logOut } from "@/app/auth-actions";
import { Field, Notice, TextArea } from "@/components/auth/fields";
import { SubmitButton } from "@/components/auth/submit-button";
import { Logo } from "@/components/brand/logo";
import { param, type SearchParams } from "@/lib/auth";
import { SITE_HOST } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import { setPublished, updateProfile } from "./actions";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };
export const dynamic = "force-dynamic";

const NOTICES: Record<string, string> = {
  welcome: "Your page is ready. Share your link, and add payment methods next.",
  saved: "Your changes are saved.",
  published: "Your page is public again.",
  hidden: "Your page is hidden. Visitors will see a not-found page.",
  password: "Your new password is saved.",
};

const ERRORS: Record<string, string> = {
  name: "Your display name needs 2 to 60 characters.",
  save: "We could not save that. Please try again.",
};

type ProfileRow = {
  username: string;
  display_name: string;
  bio: string | null;
  is_published: boolean;
};

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("profiles")
    .select("username, display_name, bio, is_published")
    .eq("id", user.id)
    .maybeSingle();
  if (!data) redirect("/onboarding");
  const profile = data as ProfileRow;

  const params = await searchParams;
  const notice = param(params, "notice");
  const error = param(params, "error");
  const pagePath = `/${profile.username}`;

  return (
    <div className="min-h-screen bg-[#FBFBFB] text-[#0B1F18]">
      <header className="bg-[#064E3B] px-5 py-3">
        <div className="mx-auto flex max-w-[880px] items-center justify-between gap-4">
          <Logo size={30} />
          <form action={logOut}>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center rounded-full px-4 text-[15px] font-semibold text-[#FBFBFB]/90 hover:text-[#FBFBFB]"
            >
              Log out
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto flex max-w-[880px] flex-col gap-6 px-5 pb-20 pt-8">
        <div>
          <h1 className="font-serif text-[40px] font-normal leading-[1.05] tracking-[-0.01em] text-[#064E3B]">
            Hello, {profile.display_name}
          </h1>
          <p className="mt-1 text-[#4B6358]">{user.email}</p>
        </div>

        {notice && NOTICES[notice] ? <Notice tone="success">{NOTICES[notice]}</Notice> : null}
        {error && ERRORS[error] ? <Notice tone="error">{ERRORS[error]}</Notice> : null}

        <section className="rounded-2xl border border-[#DCE5DF] bg-white p-5 sm:p-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-[#4B6358]">Your link</h2>
          <p className="mt-2 break-all font-serif text-[28px] leading-tight text-[#064E3B]">
            {SITE_HOST}/{profile.username}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link
              href={pagePath}
              className="inline-flex min-h-11 items-center rounded-full bg-[#064E3B] px-6 font-bold text-[#FBFBFB]"
            >
              View my page
            </Link>
            <span
              className={`inline-flex min-h-8 items-center rounded-full px-3 text-[13px] font-semibold ${
                profile.is_published ? "bg-[#E3F0EA] text-[#064E3B]" : "bg-[#FEF3F2] text-[#7A271A]"
              }`}
            >
              {profile.is_published ? "Public" : "Hidden"}
            </span>
          </div>
        </section>

        <section className="rounded-2xl border border-[#DCE5DF] bg-white p-5 sm:p-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-[#4B6358]">
            Payment methods
          </h2>
          <p className="mt-2 text-[15px] text-[#4B6358]">
            Adding Cash App, Venmo, Zelle, PayPal and the rest arrives in the next update. Until
            then your page shows your name and details only.
          </p>
        </section>

        <section className="rounded-2xl border border-[#DCE5DF] bg-white p-5 sm:p-6">
          <h2 className="mb-5 text-sm font-bold uppercase tracking-[0.1em] text-[#4B6358]">Profile</h2>
          <form action={updateProfile} className="flex flex-col gap-5">
            <Field
              label="Display name"
              name="display_name"
              autoComplete="name"
              autoCapitalize="words"
              defaultValue={profile.display_name}
              minLength={2}
              maxLength={60}
            />
            <TextArea
              label="Short bio (optional)"
              name="bio"
              defaultValue={profile.bio ?? ""}
              maxLength={140}
              hint="Up to 140 characters, shown under your name."
            />
            <div className="sm:max-w-[240px]">
              <SubmitButton pendingText="Saving…">Save changes</SubmitButton>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-[#DCE5DF] bg-white p-5 sm:p-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-[#4B6358]">Visibility</h2>
          <p className="mt-2 text-[15px] text-[#4B6358]">
            {profile.is_published
              ? "Anyone with your link can see your page."
              : "Your page is hidden. Visitors see a not-found page."}
          </p>
          <form action={setPublished} className="mt-4 sm:max-w-[240px]">
            <input type="hidden" name="publish" value={profile.is_published ? "0" : "1"} />
            <SubmitButton variant="outline" pendingText="Saving…">
              {profile.is_published ? "Hide my page" : "Make my page public"}
            </SubmitButton>
          </form>
        </section>
      </main>
    </div>
  );
}
