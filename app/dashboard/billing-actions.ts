"use server";
// app/dashboard/billing-actions.ts
//
// Starts a Stripe Checkout for a new subscription, or opens the Stripe
// Customer Portal so the owner can change plan, update their card or cancel.

import { redirect } from "next/navigation";

import { requestOrigin } from "@/lib/auth";
import { grantsAccess, trialEndFrom, type SubscriptionRow } from "@/lib/billing";
import { createCheckoutSession, createPortalSession, type Plan } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

async function currentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");
  const [{ data, error: subscriptionError }, { data: profile, error: profileError }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("provider, provider_customer_id, provider_subscription_id, plan, status, current_period_end, cancel_at_period_end")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.from("profiles").select("created_at").eq("id", user.id).maybeSingle(),
  ]);
  if (subscriptionError || profileError) redirect("/dashboard?view=billing&error=billing");
  const row = data as SubscriptionRow | null;
  return {
    userId: user.id as string,
    email: (user.email as string | undefined) ?? undefined,
    customerId: row?.provider === "stripe" ? row.provider_customer_id : null,
    member: grantsAccess(row),
    trialEnd: trialEndFrom((profile as { created_at?: string } | null)?.created_at),
  };
}

export async function startCheckout(formData: FormData): Promise<void> {
  // One plan only: monthly.
  const plan: Plan = "monthly";
  void formData;
  const { userId, email, customerId, member, trialEnd } = await currentUser();
  if (member) redirect("/dashboard/billing");
  if (!trialEnd) redirect("/dashboard?view=billing&error=billing");
  const origin = await requestOrigin();

  let url: string;
  try {
    url = await createCheckoutSession({ plan, userId, email, customerId, origin, trialEnd });
  } catch {
    redirect("/dashboard?view=billing&error=billing");
  }
  redirect(url);
}

export async function openBillingPortal(): Promise<void> {
  const { customerId } = await currentUser();
  if (!customerId) redirect("/dashboard?view=billing");
  const origin = await requestOrigin();

  let url: string;
  try {
    url = await createPortalSession(customerId, origin);
  } catch {
    redirect("/dashboard?view=billing&error=portal");
  }
  redirect(url);
}
