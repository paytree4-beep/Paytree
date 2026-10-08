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

import { saveStripeSubscription } from "@/lib/billing";
import { getSubscription, verifyWebhook, type StripeSubscription } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

type StripeEvent = {
  id: string;
  type: string;
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

  const handled = [
    "checkout.session.completed",
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
  ];
  if (!handled.includes(event.type)) return new Response(null, { status: 200 });

  const admin = createAdminClient();
  if (!admin) return new Response("not configured", { status: 500 });

  // Process each event once. A duplicate insert means we already handled it.
  const { error: seenError } = await admin
    .from("billing_events")
    .insert({ provider: "stripe", event_id: event.id, event_type: event.type });
  if (seenError) {
    if (seenError.code === "23505") return new Response(null, { status: 200 });
    return new Response("log failed", { status: 500 });
  }

  try {
    const object = event.data.object;
    let userId: string | null = null;
    let subscription: StripeSubscription | null = null;

    if (event.type === "checkout.session.completed") {
      userId = text(object.client_reference_id) ?? text((object.metadata as Record<string, unknown>)?.user_id);
      const subId = text(object.subscription);
      if (subId) subscription = await getSubscription(subId);
    } else {
      subscription = object as unknown as StripeSubscription;
      userId = text(subscription.metadata?.user_id);
    }

    if (userId && UUID.test(userId) && subscription) {
      await saveStripeSubscription(userId, subscription);

      const { data } = await admin.from("profiles").select("username").eq("id", userId).maybeSingle();
      const username = (data as { username?: string } | null)?.username;
      if (username) revalidatePath(`/${username}`);
    }

    await admin
      .from("billing_events")
      .update({ processed_at: new Date().toISOString() })
      .eq("provider", "stripe")
      .eq("event_id", event.id);
    return new Response(null, { status: 200 });
  } catch {
    // Let Stripe retry: forget that we saw this event.
    await admin.from("billing_events").delete().eq("provider", "stripe").eq("event_id", event.id);
    return new Response("processing failed", { status: 500 });
  }
}
