// app/dashboard/payments/page.tsx
//
// Add, change and remove payment methods. One small form per method, each
// posting to a Server Action, so it works without any JavaScript.
// The "12 ways to get paid" button opens a pop-up that also needs no
// JavaScript: it is shown with the :target selector (#ways) and closed with
// a link to #x.

import { getPageUser } from "@/lib/supabase/user";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Field, Notice } from "@/components/auth/fields";
import { SubmitButton } from "@/components/auth/submit-button";
import { Logo } from "@/components/brand/logo";
import { ReorderList, type ReorderItem } from "@/components/dashboard/reorder-list";
import { param, type SearchParams } from "@/lib/auth";
import { badgeColor, isLocalId, LOCAL_BADGES } from "@/lib/payment-colors";
import { CATEGORIES, METHOD_FORMS, findMethodForm, formValues } from "@/lib/payment-forms";
import { LOCAL_COLORS, LOCAL_MAX_ACCOUNTS } from "@/lib/profiles";
import { createClient } from "@/lib/supabase/server";
import { removePaymentMethod, savePaymentMethod } from "./actions";

export const metadata: Metadata = { title: "Payment methods", robots: { index: false } };
export const dynamic = "force-dynamic";

type Row = { method_id: string; public_config: unknown; position: number };

const WAYS: [string, string][] = [
  ["Put your link in your Instagram and TikTok bio", "One link for every way to pay."],
  ["Add it to your email signature", "Every email becomes a payment page."],
  ["Text it right after the job", "Fast, simple, and they pay on the spot."],
  ["Print your QR code for the counter", "Customers scan and pay with their phone."],
  ["Add it to business cards and flyers", "The QR works anywhere on paper."],
  ["Pin it in WhatsApp and Messenger", "Keep it where clients already chat."],
  ["Share your Pay me here card", "Ready-made for Stories, TikTok and Reels."],
  ["Turn your page into a tip jar", "For creators, musicians and servers."],
  ["Split the bill with friends", "Everyone sees their share and pays you."],
  ["Send a customer an invoice", "They pay with their app, you confirm it."],
  ["Add it to your website or link tree", "Anywhere your audience already looks."],
  ["Share it with friends who work for themselves", "Each friend who joins and pays drops an apple in your basket."],
];

export default async function PaymentsPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const user = await getPageUser(supabase);
  if (!user) redirect("/login?next=/dashboard/payments");

  const [{ data: profile }, { data }] = await Promise.all([
    supabase.from("profiles").select("username").eq("id", user.id).maybeSingle(),
    supabase
      .from("payment_methods")
      .select("method_id, public_config, position")
      .eq("profile_id", user.id)
      .order("position", { ascending: true }),
  ]);
  if (!profile) redirect("/onboarding");
  const username = (profile as { username: string }).username;
  const stored = new Map<string, unknown>();
  for (const row of (data ?? []) as Row[]) stored.set(row.method_id, row.public_config);

  const params = await searchParams;
  const error = param(params, "error");
  const errorMethod = param(params, "method");
  const saved = findMethodForm(param(params, "saved"));
  const removed = findMethodForm(param(params, "removed"));
  const addedCount = METHOD_FORMS.filter((m) => stored.has(m.id)).length;
  const orderItems: ReorderItem[] = ((data ?? []) as Row[])
    .map((row) => METHOD_FORMS.find((m) => m.id === row.method_id))
    .filter((m): m is (typeof METHOD_FORMS)[number] => Boolean(m))
    .map((m) => {
      // "Other payment method" shows the owner's own name and color in the list.
      const cfg = stored.get(m.id);
      const obj = typeof cfg === "object" && cfg !== null ? (cfg as Record<string, unknown>) : {};
      const own = isLocalId(m.id);
      const title = own && typeof obj.name === "string" && obj.name ? obj.name : m.title;
      const tone = own && typeof obj.color === "string" ? obj.color : undefined;
      return { id: m.id, title, color: badgeColor(m.id, tone).bg };
    });

  return (
    <div className="min-h-screen bg-[#FAF5EA] text-[#0B1F18]">
      <header className="sticky top-0 z-40 border-b border-white/80 bg-[#FAF5EA]/85 px-4 py-2.5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[880px] items-center justify-between gap-4">
          <Logo size={30} tone="dark" />
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-[#064E3B] bg-white px-5 text-[15px] font-bold text-[#064E3B] shadow-sm active:bg-[#E6F2EA]"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-[880px] flex-col gap-5 px-5 pb-20 pt-8">
        <div>
          <h1 className="font-serif text-[40px] font-normal leading-[1.05] tracking-[-0.01em] text-[#064E3B]">
            Payment methods
          </h1>
          <p className="mt-2 text-[18px] leading-snug text-[#1F3A2E]">
            Add the ways clients can pay you. Only the methods you fill in appear on your page.
          </p>
          <p className="mt-2 text-[18px] leading-snug text-[#1F3A2E]">
            After adding each one, tap it on your page to check it opens your own account.
          </p>
        </div>

        {saved ? (
          <Notice tone="success">
            <strong>{saved.title} is live on your page.</strong> Now open your page and tap it to make
            sure it opens <strong>your own</strong> account. One wrong letter can send a client&rsquo;s
            money to a stranger.{" "}
            <Link href={`/${username}`} className="font-bold underline underline-offset-2">
              Check it now
            </Link>
          </Notice>
        ) : null}
        {removed ? <Notice tone="success">{removed.title} was removed from your page.</Notice> : null}

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/${username}`}
            className="inline-flex min-h-11 items-center rounded-full bg-[#064E3B] px-6 font-bold text-[#FBFBFB]"
          >
            View my page
          </Link>
          <span className="text-[16px] font-medium text-[#1F3A2E]">
            {addedCount === 0
              ? "No methods added yet."
              : `You added ${addedCount} ${addedCount === 1 ? "method" : "methods"}.`}
          </span>
        </div>

        <a
          href="#ways"
          className="flex min-h-12 items-center justify-center rounded-[14px] border-2 border-[#FFE68C] bg-[#F4C029] px-6 text-[18px] font-bold text-[#06382B] shadow-[0_4px_0_#96700A] active:translate-y-[2px] active:shadow-[0_2px_0_#96700A]"
        >
          12 ways to get paid <span aria-hidden="true" className="ml-2">&rsaquo;</span>
        </a>

        <div className="rounded-2xl border-[3px] border-[#C82828] bg-[#FFF9F3] px-3.5 py-3">
          <p className="text-[17px] font-bold leading-snug text-[#064E3B]">PayTree never touches your money.</p>
          <p className="mt-1 text-[16px] leading-snug text-[#1F3A2E]">
            Clients pay you directly in your own accounts. We only link to them.
          </p>
        </div>

        {addedCount > 0 ? (
          <section className="rounded-2xl border border-[#DCE5DF] bg-[#F4F8F6] p-4 sm:p-5">
            <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-[#2C463A]">Order on your page</h2>
            <p className="mb-3 mt-1 text-[15px] text-[#1F3A2E]">
              Hold the dots and drag, or use the arrows. Saves automatically.
            </p>
            <ReorderList key={orderItems.map((i) => i.id).join()} initial={orderItems} />
          </section>
        ) : null}

        <h2 className="mt-2 text-sm font-bold uppercase tracking-[0.1em] text-[#2C463A]">Add or edit</h2>
        <div className="flex flex-col gap-4">
          {CATEGORIES.map((cat) => {
            const forms = METHOD_FORMS.filter((f) => f.category === cat.id);
            const added = forms.filter((f) => stored.has(f.id)).length;
            const openCat =
              forms.some((f) => f.id === errorMethod || f.id === saved?.id) || (cat.id === "apps" && addedCount === 0);
            return (
              <details key={cat.id} open={openCat} className="group/cat rounded-[22px] border border-[#DCE5DF] bg-[#F4F8F6]">
                <summary className="flex min-h-[68px] cursor-pointer list-none items-center justify-between gap-3 px-5 [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0">
                    <span className="block text-[17px] font-bold text-[#064E3B]">{cat.title}</span>
                    <span className="block truncate text-[14px] text-[#2C463A]">{cat.hint}</span>
                  </span>
                  <span className="flex flex-none items-center gap-2">
                    {added > 0 ? (
                      <span className="inline-flex min-h-7 items-center rounded-full bg-[#064E3B] px-2.5 text-[12px] font-bold text-[#FBFBFB]">
                        {added} added
                      </span>
                    ) : null}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#064E3B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="transition-transform group-open/cat:rotate-180">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </span>
                </summary>
                <div className="flex flex-col gap-3 px-3 pb-3">
          {forms.map((form) => {
                  const isAdded = stored.has(form.id);
                  const hasError = errorMethod === form.id && Boolean(error);
                  const values = formValues(form, stored.get(form.id));
                  if (hasError) {
                    // Show what the person typed, not what was saved before.
                    for (const field of form.fields) {
                      const typed = param(params, `v_${field.name}`);
                      if (typed !== undefined) values[field.name] = typed;
                    }
                  }
                  const color = badgeColor(form.id, values.color);
                  const open = hasError || saved?.id === form.id;
                  return (
                    <details
                      key={form.id}
                      id={form.id}
                      open={open}
                      className="group scroll-mt-4 rounded-2xl border border-[#DCE5DF] bg-white"
                    >
                      <summary className="flex min-h-[60px] cursor-pointer list-none items-center justify-between gap-3 px-5 [&::-webkit-details-marker]:hidden">
                        <span className="flex min-w-0 items-center gap-3 font-semibold">
                          <span
                            aria-hidden="true"
                            style={{ backgroundColor: color.bg }}
                            className="h-3.5 w-3.5 flex-none rounded-full"
                          />
                          <span className="min-w-0 truncate">{isLocalId(form.id) && isAdded && values.name ? values.name : form.title}</span>
                        </span>
                        <span
                          className={`inline-flex min-h-8 flex-none items-center rounded-full px-3 text-[13px] font-semibold ${
                            isAdded ? "bg-[#E3F0EA] text-[#064E3B]" : "bg-[#F1F4F2] text-[#4B6358]"
                          }`}
                        >
                          {isAdded ? "Edit" : "Add"}
                        </span>
                      </summary>

                      <div className="flex flex-col gap-4 border-t border-[#DCE5DF] px-5 pb-5 pt-4">
                        {hasError ? (
                          <Notice tone="error">
                            {error === "invalid"
                              ? "That does not look right. Check the format under each field and try again."
                              : "We could not save that. Please try again."}
                          </Notice>
                        ) : null}

                        <form action={savePaymentMethod} className="flex flex-col gap-4">
                          <input type="hidden" name="method" value={form.id} />
                          {form.fields.map((field) =>
                            field.kind === "lines" ? (
                              <div key={field.name} className="flex flex-col gap-1.5">
                                <label htmlFor={`field-${form.id}-${field.name}`} className="text-sm font-semibold text-[#0B1F18]">
                                  {field.label}
                                </label>
                                {Array.from({ length: LOCAL_MAX_ACCOUNTS }, (_, n) => (
                                  <input
                                    key={n}
                                    type="text"
                                    name={field.name}
                                    id={n === 0 ? `field-${form.id}-${field.name}` : undefined}
                                    aria-label={`Account ${n + 1}`}
                                    placeholder={n === 0 ? "Account 1" : `Account ${n + 1} (optional)`}
                                    required={n === 0 && (field.required ?? true)}
                                    maxLength={120}
                                    defaultValue={(values[field.name] ?? "").split("\n")[n] ?? ""}
                                    spellCheck={false}
                                    autoCapitalize="none"
                                    dir="auto"
                                    className="min-h-[52px] w-full rounded-xl border border-[#C9D6CE] bg-white px-4 text-[18px] font-medium text-[#0B1F18] outline-none placeholder:text-[#8AA095] focus:border-[#064E3B]"
                                  />
                                ))}
                                {field.hint ? <p className="text-[14px] text-[#2C463A]">{field.hint}</p> : null}
                              </div>
                            ) : field.kind === "color" ? (
                              <fieldset key={field.name} className="flex flex-col gap-2">
                                <legend className="text-sm font-semibold text-[#0B1F18]">{field.label}</legend>
                                <div className="flex flex-wrap gap-3">
                                  {LOCAL_COLORS.map((c) => (
                                    <label key={c} className="cursor-pointer">
                                      <input
                                        type="radio"
                                        name={field.name}
                                        value={c}
                                        defaultChecked={(values[field.name] ?? "green") === c}
                                        className="peer sr-only"
                                      />
                                      <span
                                        title={c}
                                        style={{ backgroundColor: LOCAL_BADGES[c].bg }}
                                        className="block h-11 w-11 rounded-full ring-offset-2 peer-checked:ring-4 peer-checked:ring-[#064E3B] peer-focus-visible:ring-4 peer-focus-visible:ring-[#D9B873]"
                                      />
                                    </label>
                                  ))}
                                </div>
                              </fieldset>
                            ) : (
                              <Field
                                key={field.name}
                                label={field.label}
                                name={field.name}
                                hint={field.hint}
                                defaultValue={values[field.name]}
                                required={field.required ?? true}
                                maxLength={field.maxLength}
                                inputMode={field.inputMode}
                              />
                            ),
                          )}
                          <div className="sm:max-w-[240px]">
                            <SubmitButton pendingText="Saving…">{isAdded ? "Save changes" : "Add to my page"}</SubmitButton>
                          </div>
                        </form>

                        {isAdded ? (
                          <form action={removePaymentMethod} className="sm:max-w-[240px]">
                            <input type="hidden" name="method" value={form.id} />
                            <SubmitButton variant="outline" pendingText="Removing…">
                              Remove from my page
                            </SubmitButton>
                          </form>
                        ) : null}
                      </div>
                    </details>
                  );
                })}
                </div>
              </details>
            );
          })}
        </div>

        <p className="text-[14px] text-[#2C463A]">
          Bank transfer (ACH) and wire transfer arrive in a later update, with bank-level encryption
          for account numbers.
        </p>
      </main>

      {/* "12 ways to get paid" pop-up. Hidden until the link points at #ways. */}
      <div
        id="ways"
        className="fixed inset-0 z-50 hidden items-end justify-center bg-black/60 p-3 target:flex sm:items-center"
      >
        <a href="#x" aria-label="Close" className="absolute inset-0 cursor-default" />
        <div className="relative z-10 flex max-h-[88vh] w-full max-w-[560px] flex-col rounded-[28px] border-[3px] border-[#E3B93C] bg-[#FAF5EA] shadow-2xl">
          <div className="flex items-center justify-between gap-3 px-6 pb-3 pt-5">
            <h2 className="font-serif text-[30px] font-normal leading-tight text-[#064E3B]">12 ways to get paid</h2>
            <a
              href="#x"
              aria-label="Close"
              className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-full border-2 border-[#064E3B] text-[22px] font-bold leading-none text-[#064E3B]"
            >
              &times;
            </a>
          </div>
          <ol className="flex flex-col gap-4 overflow-y-auto px-6 pb-6 pt-2">
            {WAYS.map(([title, text], i) => (
              <li key={title} className="flex items-start gap-3.5">
                <span
                  aria-hidden="true"
                  className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#F4C029] text-[16px] font-bold text-[#06382B]"
                >
                  {i + 1}
                </span>
                <span>
                  <span className="block text-[17px] font-bold leading-snug text-[#0B1F18]">{title}</span>
                  <span className="mt-0.5 block text-[15px] leading-snug text-[#2C463A]">{text}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
