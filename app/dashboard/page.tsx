// app/dashboard/page.tsx
//
// The signed-in home. For now: the public link, the profile details and the
// publish switch. Payment methods arrive in the next phase.

import { getPageUser } from "@/lib/supabase/user";
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
import { deleteAccount, setPageMode, setPublished, updateProfile } from "./actions";
import { ShareCardMaker } from "@/components/dashboard/share-card";
import { WelcomeCelebration } from "@/components/dashboard/welcome-celebration";
import { OwnerCookie } from "@/components/dashboard/owner-cookie";
import { GettingStarted } from "@/components/dashboard/getting-started";
import { InstallCard } from "@/components/dashboard/install-card";
import { openBillingPortal, startCheckout } from "./billing-actions";
import { computeAccess, grantsAccess, type SubscriptionRow } from "@/lib/billing";
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
  "tip-on": "Tip me is on. Your page now says \u201cSend me a tip\u201d.",
  "tip-off": "Your page is back to a regular payment page.",
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
  created_at: string;
};

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const user = await getPageUser(supabase);
  if (!user) redirect("/login");

  // Everything the dashboard needs is asked in one go, not one after another:
  // each question to the database costs a round trip, and they add up.
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const [
    { data },
    { count },
    { count: weekViews },
    { count: weekAll },
    { count: invoiceWaitingCount },
    { data: modeRow, error: modeError },
    { data: subData },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, display_name, bio, is_published, avatar_path, created_at")
      .eq("id", user.id)
      .maybeSingle(),
    supabase.from("payment_methods").select("id", { count: "exact", head: true }).eq("profile_id", user.id),
    supabase
      .from("analytics_events")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", user.id)
      .eq("action", "view")
      .gte("occurred_at", weekAgo),
    supabase
      .from("analytics_events")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", user.id)
      .gte("occurred_at", weekAgo),
    // Invoices a customer marked as paid, waiting for the owner to confirm.
    supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id)
      .not("claimed_at", "is", null)
      .is("confirmed_at", null),
    // Tip me mode. Read on its own so a missing column never breaks the page.
    supabase.from("profiles").select("page_mode").eq("id", user.id).maybeSingle(),
    supabase
      .from("subscriptions")
      .select("provider, provider_customer_id, provider_subscription_id, plan, status, current_period_end, cancel_at_period_end")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);
  if (!data) redirect("/onboarding");
  const profile = data as ProfileRow;
  const methodCount = typeof count === "number" ? count : 0;
  const views7 = typeof weekViews === "number" ? weekViews : 0;
  const taps7 = Math.max(0, (typeof weekAll === "number" ? weekAll : 0) - views7);
  const invoicesWaiting = typeof invoiceWaitingCount === "number" ? invoiceWaitingCount : 0;
  const modeReady = !modeError;
  const tipMode = (modeRow as { page_mode?: string } | null)?.page_mode === "tip";

  const subscription = subData as SubscriptionRow | null;
  const billingOn = billingConfigured();
  const isMember = !billingOn || grantsAccess(subscription);
  const access = computeAccess(profile.created_at, subscription);
  const trialEndDate = access.trialEndsAt
    ? new Date(access.trialEndsAt).toLocaleDateString("en-US", { month: "long", day: "numeric" })
    : null;
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
  const VIEWS = ["home", "link", "profile", "settings", "billing", "share"] as const;
  const requestedView = param(params, "view");
  const view = VIEWS.find((v) => v === requestedView) ?? "home";

  type Tile = { icon: string; title: string; detail: string; href: string; badge?: string; chip?: string };
  // Order matters: the three core steps first (payment methods, share, profile),
  // then the secondary tools, then membership and settings at the bottom.
  const coreTiles: Tile[] = [
    {
      icon: "💳",
      title: "Payment Methods",
      detail: methodCount === 0 ? "Add your payment methods" : `${methodCount} payment ${methodCount === 1 ? "method" : "methods"}`,
      href: "/dashboard/payments",
      badge: methodCount === 0 ? "!" : undefined,
    },
    { icon: "🔗", title: "Your Link & QR", detail: "Share your link & QR code", href: "/dashboard/link" },
    { icon: "👤", title: "Profile", detail: "Photo, name & bio", href: "/dashboard/profile" },
  ];
  const toolTiles: Tile[] = [
    { icon: "📸", title: "Pay Me / Tip Me", detail: "Photo & video for Instagram & TikTok", href: "/dashboard/share" },
    {
      icon: "🧾",
      title: "Invoices",
      detail: "Send professional invoices",
      href: "/dashboard/invoices",
      badge: invoicesWaiting > 0 ? String(invoicesWaiting) : undefined,
    },
    { icon: "🍕", title: "Split the Bill", detail: "Split a bill with friends", href: "/dashboard/split" },
    { icon: "📊", title: "Statistics", detail: "Track views & payment taps", href: "/dashboard/stats", chip: `${views7} views · ${taps7} taps this week` },
    { icon: "💰", title: "Income & Spending", detail: "Track your money in and out", href: "/dashboard/budget" },
    { icon: "🌳", title: "Money Tree", detail: "See your monthly payment growth", href: "/dashboard/tree" },
    ...(billingOn
      ? [{
          icon: "⭐",
          title: "Membership",
          detail: "Manage your plan",
          href: "/dashboard/billing",
          chip: isMember ? "Active" : access.reason === "trial" ? `${access.trialDaysLeft} days left` : "Paused",
        }]
      : []),
    { icon: "⚙️", title: "Settings", detail: "Account & preferences", href: "/dashboard/settings" },
  ];

  return (
    <div className="min-h-screen bg-[#FAF5EA] text-[#0B1F18]">
      {notice === "welcome" ? <WelcomeCelebration /> : null}
      <OwnerCookie username={profile.username} />
      <header className="sticky top-0 z-40 border-b border-white/80 bg-[#FAF5EA]/85 px-4 py-2.5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[880px] items-center justify-between gap-4">
          <Logo size={30} tone="dark" />
          {view === "home" ? (
            <form action={logOut}>
              <button
                type="submit"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-[#064E3B] bg-white px-5 text-[15px] font-bold text-[#064E3B] shadow-sm active:bg-[#E6F2EA]"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3 M10 17l5-5-5-5 M15 12H4" />
                </svg>
                Log out
              </button>
            </form>
          ) : (
            <Link
              href="/dashboard"
              className="inline-flex min-h-11 items-center rounded-full border-2 border-[#064E3B] bg-white px-5 text-[15px] font-bold text-[#064E3B]"
            >
              Dashboard
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto flex max-w-[880px] flex-col gap-5 px-5 pb-20 pt-6">
        {view === "home" ? (
          <div>
            <h1 className="font-serif text-[36px] font-normal leading-[1.05] tracking-[-0.01em] text-[#064E3B]">
              Hello, {profile.display_name}
            </h1>
            <p className="mt-1 text-[14px] text-[#4B6358]">{user.email}</p>
            <Link
              href={pagePath}
              className="mt-4 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#064E3B] px-6 font-bold text-[#FBFBFB] shadow-[0_14px_30px_-16px_rgba(6,78,59,0.8)] sm:w-auto"
            >
              View my page
              <span aria-hidden="true">↗</span>
            </Link>
          </div>
        ) : null}

        {notice && NOTICES[notice] ? <Notice tone="success">{NOTICES[notice]}</Notice> : null}
        {error && ERRORS[error] ? <Notice tone="error">{ERRORS[error]}</Notice> : null}

        {view === "home" ? (
          <>
        {access.reason === "trial" ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-[#D9B873] bg-[#FBF6EA] p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[15px] text-[#5C4513]">
              <strong className="text-[#064E3B]">
                {access.trialDaysLeft === 1 ? "1 day" : `${access.trialDaysLeft} days`} left in your free trial.
              </strong>{" "}
              Subscribe before {trialEndDate} to keep your page live.
            </p>
            <Link
              href="/dashboard?view=billing"
              className="inline-flex min-h-11 flex-none items-center justify-center rounded-full bg-[#064E3B] px-6 font-bold text-[#FBFBFB]"
            >
              Subscribe
            </Link>
          </div>
        ) : null}
        {access.reason === "ended" ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-[#B42318]/30 bg-[#FEF3F2] p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[15px] text-[#7A271A]">
              <strong>Your free trial has ended, so your page is paused.</strong> Everything is saved. Subscribe
              and it comes back right away.
            </p>
            <Link
              href="/dashboard?view=billing"
              className="inline-flex min-h-11 flex-none items-center justify-center rounded-full bg-[#064E3B] px-6 font-bold text-[#FBFBFB]"
            >
              Subscribe
            </Link>
          </div>
        ) : null}
            <GettingStarted methodCount={methodCount} profileDone={Boolean(profile.avatar_path) || Boolean(profile.bio && profile.bio.trim())} />
            <InstallCard />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {coreTiles.map((t) => (
                <Link
                  key={t.title}
                  href={t.href}
                  className="relative flex min-h-[84px] items-center gap-4 rounded-[22px] border-2 border-[#BFE3CF] bg-white p-4 shadow-[0_14px_30px_-22px_rgba(6,78,59,0.55)] active:scale-[0.98] sm:min-h-[132px] sm:flex-col sm:items-start sm:justify-between sm:gap-2"
                >
                  <span className="text-[30px] leading-none" aria-hidden="true">{t.icon}</span>
                  <span className="flex-1">
                    <span className="block text-[17px] font-bold leading-tight text-[#064E3B]">{t.title}</span>
                    <span className="mt-0.5 block text-[13.5px] leading-snug text-[#4B6358]">{t.detail}</span>
                  </span>
                  <span className="font-bold text-[#064E3B] sm:hidden" aria-hidden="true">›</span>
                  {t.badge ? (
                    <span className="absolute right-3 top-3 rounded-full bg-[#E5484D] px-2 py-0.5 text-[11px] font-bold text-white">{t.badge}</span>
                  ) : null}
                </Link>
              ))}
            </div>
            <h2 className="-mb-2 mt-1 text-[12px] font-bold uppercase tracking-[0.1em] text-[#6B7F75]">More tools</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {toolTiles.map((t) => (
                <Link
                  key={t.title}
                  href={t.href}
                  className="relative flex min-h-[118px] flex-col justify-between rounded-[22px] border border-white/90 bg-white/85 p-4 shadow-[0_14px_30px_-22px_rgba(6,78,59,0.55)] backdrop-blur-xl active:scale-[0.98]"
                >
                  <span className="text-[26px] leading-none" aria-hidden="true">{t.icon}</span>
                  <span>
                    <span className="block text-[15px] font-bold leading-tight text-[#064E3B]">{t.title}</span>
                    <span className="mt-0.5 block text-[12.5px] leading-snug text-[#4B6358]">{t.detail}</span>
                    {t.chip ? (
                      <span className="mt-1.5 inline-block rounded-full bg-[#E3F0EA] px-2 py-0.5 text-[11px] font-semibold text-[#064E3B]">{t.chip}</span>
                    ) : null}
                  </span>
                  {t.badge ? (
                    <span className="absolute right-3 top-3 rounded-full bg-[#E5484D] px-2 py-0.5 text-[11px] font-bold text-white">{t.badge}</span>
                  ) : null}
                </Link>
              ))}
            </div>
          </>
        ) : (
          <Link href="/dashboard" className="inline-flex min-h-11 w-fit items-center gap-1 text-[15px] font-bold text-[#064E3B]">
            ‹ Dashboard
          </Link>
        )}

        {view === "billing" ? (
          <>
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
                  {access.reason === "trial" ? (
                    <>
                      <strong>Free trial:</strong> {access.trialDaysLeft} days left, with every feature. Subscribe
                      to keep your page live after {trialEndDate}.
                    </>
                  ) : (
                    <>
                      <strong>Your page is paused.</strong> Subscribe to turn it back on. Cancel any time.
                    </>
                  )}
                </p>
                <form action={startCheckout} className="mt-4">
                  <input type="hidden" name="plan" value="monthly" />
                  <SubmitButton pendingText="Opening checkout…">
                    {`Subscribe · ${PRICING.monthly.price} a month`}
                  </SubmitButton>
                </form>
                <p className="mt-3 text-[13px] text-[#4B6358]">
                  Every feature included. Cancel any time. Secure checkout by Stripe. Pay with Apple Pay, Google Pay or card.
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
          </>
        ) : null}

        {view === "link" ? (
          <>
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
                access.active && profile.is_published ? "bg-[#E3F0EA] text-[#064E3B]" : "bg-[#FEF3F2] text-[#7A271A]"
              }`}
            >
              {!access.active ? "Paused" : profile.is_published ? "Public" : "Hidden"}
            </span>
          </div>
          <div className="mt-4">
            <ShareLink url={`${SITE_URL}/${profile.username}`} name={profile.display_name} />
          </div>
          <QrCard url={`${SITE_URL}/${profile.username}`} label={`${SITE_HOST}/${profile.username}`} name={profile.display_name ?? undefined} />
        </section>
          </>
        ) : null}


        {view === "profile" ? (
          <>
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
          </>
        ) : null}

        {view === "settings" ? (
          <>
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
          </>
        ) : null}
        {(view === "share" || view === "settings") && modeReady ? (
          <section className="rounded-2xl border border-[#DCE5DF] bg-white p-5 sm:p-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-[#4B6358]">Tip me</h2>
            <p className="mt-2 text-[15px] text-[#4B6358]">
              {tipMode
                ? "On. Your page says \u201cSend me a tip\u201d. Great for creators, musicians and streamers."
                : "Are you a creator, musician or streamer? Turn this on and your page says \u201cSend me a tip\u201d. Then share your page with the Tip me card below."}
            </p>
            <form action={setPageMode} className="mt-4 sm:max-w-[260px]">
              <input type="hidden" name="mode" value={tipMode ? "pay" : "tip"} />
              <SubmitButton variant={tipMode ? "outline" : "emerald"} pendingText="Saving…">
                {tipMode ? "Turn off Tip me" : "Turn on Tip me"}
              </SubmitButton>
            </form>
          </section>
        ) : null}
        {view === "share" ? (
          <ShareCardMaker
            name={profile.display_name}
            username={profile.username}
            avatar={avatarUrl(profile.avatar_path) ?? null}
            tip={tipMode}
            pageUrl={`${SITE_URL}/${profile.username}`}
          />
        ) : null}

      </main>
    </div>
  );
}
