"use server";
// app/dashboard/billing-actions.ts
//
// Starts a Stripe Checkout for a new subscription, or opens the Stripe
// Customer Portal so the owner can change plan, update their card or cancel.

import { redirect } from "next/navigation";

import { requestOrigin } from "@/lib/auth";
import { grantsAccess, type SubscriptionRow } from "@/lib/billing";
import { createCheckoutSession, createPortalSession, type Plan } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

async function currentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");
  const { data } = await supabase
    .from("subscriptions")
    .select("provider, provider_customer_id, provider_subscription_id, plan, status, current_period_end, cancel_at_period_end")
    .eq("user_id", user.id)
    .maybeSingle();
  const row = data as SubscriptionRow | null;
  return {
    userId: user.id as string,
    email: (user.email as string | undefined) ?? undefined,
    customerId: row?.provider === "stripe" ? row.provider_customer_id : null,
    member: grantsAccess(row),
  };
}

export async function startCheckout(formData: FormData): Promise<void> {
  // One plan only: monthly.
  const plan: Plan = "monthly";
  void formData;
  const { userId, email, customerId, member } = await currentUser();
  if (member) redirect("/dashboard/billing");
  const origin = await requestOrigin();

  let url: string;
  try {
    url = await createCheckoutSession({ plan, userId, email, customerId, origin });
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
