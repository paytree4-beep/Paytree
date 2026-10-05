// app/dashboard/payments/page.tsx
//
// Add, change and remove payment methods. One small form per method, each
// posting to a Server Action, so it works without any JavaScript.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Field, Notice } from "@/components/auth/fields";
import { SubmitButton } from "@/components/auth/submit-button";
import { Logo } from "@/components/brand/logo";
import { param, type SearchParams } from "@/lib/auth";
import { METHOD_FORMS, findMethodForm, formValues } from "@/lib/payment-forms";
import { createClient } from "@/lib/supabase/server";
import { removePaymentMethod, savePaymentMethod } from "./actions";

export const metadata: Metadata = { title: "Payment methods", robots: { index: false } };
export const dynamic = "force-dynamic";

type Row = { method_id: string; public_config: unknown };

export default async function PaymentsPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/payments");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) redirect("/onboarding");
  const username = (profile as { username: string }).username;

  const { data } = await supabase
    .from("payment_methods")
    .select("method_id, public_config")
    .eq("profile_id", user.id);
  const stored = new Map<string, unknown>();
  for (const row of (data ?? []) as Row[]) stored.set(row.method_id, row.public_config);

  const params = await searchParams;
  const error = param(params, "error");
  const errorMethod = param(params, "method");
  const saved = findMethodForm(param(params, "saved"));
  const removed = findMethodForm(param(params, "removed"));
  const addedCount = METHOD_FORMS.filter((m) => stored.has(m.id)).length;

  return (
    <div className="min-h-screen bg-[#FBFBFB] text-[#0B1F18]">
      <header className="bg-[#064E3B] px-5 py-3">
        <div className="mx-auto flex max-w-[880px] items-center justify-between gap-4">
          <Logo size={30} />
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center rounded-full px-4 text-[15px] font-semibold text-[#FBFBFB]/90 hover:text-[#FBFBFB]"
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
          <p className="mt-2 text-[#4B6358]">
            Add the ways clients can pay you. Only the methods you fill in appear on your page.
          </p>
        </div>

        {saved ? <Notice tone="success">{saved.title} is saved and live on your page.</Notice> : null}
        {removed ? <Notice tone="success">{removed.title} was removed from your page.</Notice> : null}

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/${username}`}
            className="inline-flex min-h-11 items-center rounded-full bg-[#064E3B] px-6 font-bold text-[#FBFBFB]"
          >
            View my page
          </Link>
          <span className="text-[15px] text-[#4B6358]">
            {addedCount === 0 ? "No methods added yet." : `${addedCount} added.`}
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {METHOD_FORMS.map((form) => {
            const isAdded = stored.has(form.id);
            const values = formValues(form, stored.get(form.id));
            const hasError = errorMethod === form.id && Boolean(error);
            const open = hasError || saved?.id === form.id;
            return (
              <details
                key={form.id}
                id={form.id}
                open={open}
                className="group scroll-mt-4 rounded-2xl border border-[#DCE5DF] bg-white"
              >
                <summary className="flex min-h-[60px] cursor-pointer list-none items-center justify-between gap-3 px-5 [&::-webkit-details-marker]:hidden">
                  <span className="font-semibold">{form.title}</span>
                  <span
                    className={`inline-flex min-h-8 items-center rounded-full px-3 text-[13px] font-semibold ${
                      isAdded ? "bg-[#E3F0EA] text-[#064E3B]" : "bg-[#F1F4F2] text-[#4B6358]"
                    }`}
                  >
                    {isAdded ? "Added" : "Add"}
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
                    {form.fields.map((field) => (
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
                    ))}
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

        <p className="text-[13px] text-[#4B6358]">
          Bank transfer (ACH) and wire transfer arrive in a later update, with bank-level encryption
          for account numbers.
        </p>
      </main>
    </div>
  );
}
