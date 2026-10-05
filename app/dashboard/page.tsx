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
import { AvatarUploader } from "@/components/dashboard/avatar-uploader";
import { ShareLink } from "@/components/dashboard/share-link";
import { QrCard } from "@/app/[username]/qr-card";
import { param, type SearchParams } from "@/lib/auth";
import { avatarUrl } from "@/lib/avatar";
import { PRICING, SITE_HOST, SITE_URL } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import { deleteAccount, setPublished, updateProfile } from "./actions";
import { openBillingPortal, startCheckout } from "./billing-actions";
import { grantsAccess, type SubscriptionRow } from "@/lib/billing";
import { billingConfigured } from "@/lib/stripe";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };
export const dynamic = "force-dynamic";

const NOTICES: Record<string, string> = {
  welcome: "Your page is ready. Add your payment methods next.",
  saved: "Your changes are saved.",
  published: "Your page is public again.",
  hidden: "Your page is hidden. Visitors will see a not-found page.",
  password: "Your new password is saved.",
  subscribed: "Thank you! Your membership is active and your page is live. It can take a few seconds to update.",
  "checkout-cancelled": "Checkout was cancelled. You have not been charged.",
};

const ERRORS: Record<string, string> = {
  name: "Your display name needs 2 to 60 characters.",
  save: "We could not save that. Please try again.",
  confirm: "The link name you typed does not match. Your account was not deleted.",
  delete: "We could not delete your account. Please try again, or contact us.",
  "delete-billing": "We could not cancel your subscription, so your account was not deleted. Please try again.",
  billing: "We could not open checkout. Please try again in a moment.",
  portal: "We could not open billing settings. Please try again in a moment.",
};

type ProfileRow = {
  username: string;
  display_name: string;
  bio: string | null;
  is_published: boolean;
  avatar_path: string | null;
};

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("profiles")
    .select("username, display_name, bio, is_published, avatar_path")
    .eq("id", user.id)
    .maybeSingle();
  if (!data) redirect("/onboarding");
  const profile = data as ProfileRow;

  const { count } = await supabase
    .from("payment_methods")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", user.id);
  const methodCount = typeof count === "number" ? count : 0;

  const { data: subData } = await supabase
    .from("subscriptions")
    .select("provider, provider_customer_id, provider_subscription_id, plan, status, current_period_end, cancel_at_period_end")
    .eq("user_id", user.id)
    .maybeSingle();
  const subscription = subData as SubscriptionRow | null;
  const billingOn = billingConfigured();
  const isMember = !billingOn || grantsAccess(subscription);
  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

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

        {billingOn ? (
          <section
            id="billing"
            className={`scroll-mt-4 rounded-2xl border p-5 sm:p-6 ${
              isMember ? "border-[#DCE5DF] bg-white" : "border-[#D9B873] bg-[#FBF6EA]"
            }`}
          >
            <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-[#4B6358]">Membership</h2>
            {isMember && subscription ? (
              <>
                <p className="mt-2 text-[15px] text-[#0B1F18]">
                  {subscription.provider === "comp"
                    ? "Your membership is active."
                    : subscription.status === "past_due"
                      ? `Your last payment did not go through. Update your card to keep your page live${periodEnd ? ` after ${periodEnd}` : ""}.`
                      : subscription.cancel_at_period_end || subscription.status === "canceled"
                        ? `Your membership is cancelled and ends on ${periodEnd ?? "the end of this period"}. Your page stays live until then.`
                        : `${subscription.plan === "annual" ? "Annual" : "Monthly"} membership, active${periodEnd ? `. Renews on ${periodEnd}` : ""}.`}
                </p>
                {subscription.provider === "stripe" ? (
                  <form action={openBillingPortal} className="mt-4 sm:max-w-[260px]">
                    <SubmitButton variant="outline" pendingText="Opening…">
                      Manage billing
                    </SubmitButton>
                  </form>
                ) : null}
              </>
            ) : (
              <>
                <p className="mt-2 text-[15px] text-[#0B1F18]">
                  <strong>Your page is not live yet.</strong> Choose a membership to publish it. Cancel
                  any time.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <form action={startCheckout}>
                    <input type="hidden" name="plan" value="annual" />
                    <SubmitButton pendingText="Opening checkout…">
                      {`Yearly · ${PRICING.annual.price}`}
                    </SubmitButton>
                  </form>
                  <form action={startCheckout}>
                    <input type="hidden" name="plan" value="monthly" />
                    <SubmitButton variant="outline" pendingText="Opening checkout…">
                      {`Monthly · ${PRICING.monthly.price}`}
                    </SubmitButton>
                  </form>
                </div>
                <p className="mt-3 text-[13px] text-[#4B6358]">
                  {`Yearly works out to ${PRICING.annual.perMonth} a month (${PRICING.annual.badge}). Secure checkout by Stripe.`}
                </p>
                {subscription?.provider === "stripe" && subscription.provider_customer_id ? (
                  <form action={openBillingPortal} className="mt-3">
                    <button type="submit" className="inline-flex min-h-11 items-center text-sm font-semibold text-[#064E3B] underline underline-offset-2">
                      View past invoices
                    </button>
                  </form>
                ) : null}
              </>
            )}
          </section>
        ) : null}

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
                isMember && profile.is_published ? "bg-[#E3F0EA] text-[#064E3B]" : "bg-[#FEF3F2] text-[#7A271A]"
              }`}
            >
              {!isMember ? "Not live" : profile.is_published ? "Public" : "Hidden"}
            </span>
          </div>
          <div className="mt-4">
            <ShareLink url={`${SITE_URL}/${profile.username}`} name={profile.display_name} />
          </div>
          <QrCard url={`${SITE_URL}/${profile.username}`} label={`${SITE_HOST}/${profile.username}`} />
        </section>

        <section className="rounded-2xl border border-[#DCE5DF] bg-white p-5 sm:p-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-[#4B6358]">
            Payment methods
          </h2>
          <p className="mt-2 text-[15px] text-[#4B6358]">
            {methodCount === 0
              ? "You have not added any payment methods yet. Add Cash App, Venmo, Zelle, PayPal and more."
              : `${methodCount} payment ${methodCount === 1 ? "method is" : "methods are"} on your page.`}
          </p>
          <Link
            href="/dashboard/payments"
            className="mt-4 inline-flex min-h-11 items-center rounded-full bg-[#064E3B] px-6 font-bold text-[#FBFBFB]"
          >
            {methodCount === 0 ? "Add payment methods" : "Manage payment methods"}
          </Link>
        </section>

        <section className="rounded-2xl border border-[#DCE5DF] bg-white p-5 sm:p-6">
          <h2 className="mb-5 text-sm font-bold uppercase tracking-[0.1em] text-[#4B6358]">Profile</h2>
          <div className="mb-6">
            <AvatarUploader
              currentUrl={avatarUrl(profile.avatar_path)}
              initial={profile.display_name.trim().charAt(0).toUpperCase() || "P"}
            />
          </div>
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
        <section
          id="delete"
          className="scroll-mt-4 rounded-2xl border border-[#B42318]/30 bg-white p-5 sm:p-6"
        >
          <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-[#7A271A]">
            Delete account
          </h2>
          <p className="mt-2 text-[15px] text-[#4B6358]">
            This permanently deletes your account, your page and your payment methods. Your link
            stops working right away. This cannot be undone.
          </p>
          <details className="mt-4">
            <summary className="inline-flex min-h-11 cursor-pointer list-none items-center rounded-full border border-[#B42318]/40 px-6 font-bold text-[#B42318] [&::-webkit-details-marker]:hidden">
              Delete my account
            </summary>
            <form action={deleteAccount} className="mt-4 flex flex-col gap-4">
              <Field
                label={`To confirm, type your link name: ${profile.username}`}
                name="confirm"
                autoComplete="off"
                maxLength={30}
              />
              <button
                type="submit"
                className="flex min-h-[52px] w-full items-center justify-center rounded-full bg-[#B42318] px-7 font-bold text-white sm:max-w-[280px]"
              >
                Permanently delete my account
              </button>
            </form>
          </details>
        </section>
      </main>
    </div>
  );
}
