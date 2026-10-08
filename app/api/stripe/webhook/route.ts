// app/api/stripe/webhook/route.ts
//
// Stripe calls this address when a subscription starts, renews, changes or
// ends. Every request is signature-checked, and each event is processed at
// most once (billing_events has a unique key on the event id).
//
// In Stripe: Developers > Webhooks > Add endpoint
//   URL:    https://paytree.to/api/stripe/webhook
//   Events: checkout.session.completed, customer.subscription.created,
//           customer.subscription.updated, customer.subscription.deleted

import { revalidatePath } from "next/cache";

import { applyStripeSubscriptionEvent } from "@/lib/billing";
import { getSubscription, verifyWebhook, type StripeSubscription } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

type StripeEvent = {
  id: string;
  type: string;
  created: number;
  data: { object: Record<string, unknown> };
};

function text(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

export async function POST(request: Request): Promise<Response> {
  const raw = await request.text();
  if (raw.length > 512 * 1024) return new Response(null, { status: 413 });
  if (!verifyWebhook(raw, request.headers.get("stripe-signature"))) {
    return new Response("invalid signature", { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(raw) as StripeEvent;
  } catch {
    return new Response("bad json", { status: 400 });
  }
  if (!/^evt_[A-Za-z0-9]+$/.test(event?.id) ||
      !Number.isSafeInteger(event?.created) ||
      !event?.data || typeof event.data.object !== "object" || event.data.object === null) {
    return new Response("bad event", { status: 400 });
  }

  const handled = [
    "checkout.session.completed",
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
  ];
  if (!handled.includes(event.type)) return new Response(null, { status: 200 });

  try {
    const object = event.data.object;
    let userId: string | null = null;
    let subscription: StripeSubscription | null = null;

    if (event.type === "checkout.session.completed") {
      userId = text(object.client_reference_id) ?? text((object.metadata as Record<string, unknown>)?.user_id);
      const subId = text(object.subscription);
      if (subId) subscription = await getSubscription(subId);
    } else {
      const subId = text(object.id);
      if (subId) subscription = await getSubscription(subId);
      userId = text(subscription?.metadata?.user_id);
    }

    if (userId && UUID.test(userId) && subscription) {
      if (subscription.metadata?.user_id !== userId) throw new Error("subscription_owner_mismatch");
      const admin = createAdminClient();
      if (!admin) throw new Error("admin_client_missing");

      const { data, error } = await admin.from("profiles").select("username").eq("id", userId).maybeSingle();
      if (error) throw error;
      if (!data) return new Response(null, { status: 200 }); // Deleted account.
      const applied = await applyStripeSubscriptionEvent(event, userId, subscription);
      const username = (data as { username?: string } | null)?.username;
      if (applied && username) revalidatePath(`/${username}`);
    }

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("stripe_webhook_processing_failed", error instanceof Error ? error.message : error);
    return new Response("processing failed", { status: 500 });
  }
}
