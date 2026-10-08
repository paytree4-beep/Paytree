# PayTree

Next.js payment pages backed by Supabase, with Stripe for PayTree membership.
Owners may also add their own Stripe Payment Links as a public payment method;
those links are separate from PayTree membership billing.

## Run locally

1. Run `npm ci` and copy `.env.example` to `.env.local`.
2. Set the Supabase URL, public key, and service-role key. Keep the service-role
   key on the server only. Apply every migration in `supabase/migrations/` in
   filename order before enabling Stripe.
3. Set `NEXT_PUBLIC_SITE_URL` to the canonical site origin (for example,
   `https://paytree.to` in production). Add it to Supabase's allowed redirect
   URLs. Run `npm run dev`.

`npm run typecheck`, `npm run lint`, and `npm run build` are the local checks.
The build downloads Google fonts and needs network access. Pages that require
Supabase will show a configuration error at runtime until its keys are set.

## Enable Stripe in test mode first

1. Create a recurring monthly USD $4.99 Price in Stripe test mode. Set
   `STRIPE_SECRET_KEY=sk_test_...` and `STRIPE_PRICE_MONTHLY=price_...` in the
   server environment. Configure the Stripe Customer Portal.
2. Add a webhook endpoint at
   `https://<your-domain>/api/stripe/webhook` for these events:
   `checkout.session.completed`, `customer.subscription.created`,
   `customer.subscription.updated`, and `customer.subscription.deleted`.
   Set its signing secret as `STRIPE_WEBHOOK_SECRET=whsec_...` on the server.
3. Deploy with all three Stripe values and the Supabase service-role key set.
   Billing access switches on when the full configuration is present. Existing
   accounts older than the seven-day trial with no subscription then pause.
4. Test checkout, a successful webhook, portal access, renewal, cancellation,
   and a duplicate webhook delivery in test mode. Check that `subscriptions`
   updates and `billing_events.processed_at` is set. Confirm an expired period
   pauses the public page. Then use matching live-mode key, Price, and webhook
   signing secret for production.

Never put `sk_`, `whsec_`, or the Supabase service-role key in a `NEXT_PUBLIC_`
variable or commit them. The Price ID is an identifier, not a secret.
