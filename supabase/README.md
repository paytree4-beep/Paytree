# PayTree.me database (Supabase)

Phase 1 foundation. Nothing here talks to the app yet; Phase 2 connects it.

## What is in this folder

- `migrations/20261005000001_foundation.sql` — the whole schema: tables, Row Level
  Security, grants, and helper functions.
- `tests/00_supabase_stub.sql` — a small stand-in for Supabase's built-in `auth`
  schema and roles. Only for testing on a plain PostgreSQL. Never run it on Supabase.
- `tests/10_foundation_rls.test.sql` — 58 checks of the security rules.

## Tables

| Table | Purpose |
| --- | --- |
| `reserved_usernames` | Names nobody can claim (admin, login, api, ...). Must match `RESERVED_USERNAMES` in `lib/profiles.ts`. |
| `profiles` | One row per user: username, display name, bio, theme. |
| `payment_methods` | Public details for each method (handle, link, display order, visibility). |
| `payment_method_secrets` | Encrypted bank account and routing numbers. Server only. No browser access at all. |
| `subscriptions` | Plan and status. Provider-neutral until a billing provider is chosen. |
| `billing_events` | Webhook log. Server only. |
| `analytics_events` | view / open / copy events. No IP, no user agent, no cookies. |

## Security rules worth knowing

- Every table has Row Level Security on.
- Visitors (`anon`) can read only public, visible methods of active profiles.
- Users can only touch rows that belong to them (`auth.uid()`).
- `payment_method_secrets`, `billing_events` and `analytics_events` cannot be read by
  the browser roles. Only the server key (`service_role`) can.
- Helper functions are not callable from the browser. Supabase grants this by default,
  so the migration revokes it explicitly. The tests check it.

## How to apply (when you have a Supabase project)

1. Install the CLI and log in: `supabase login`
2. Link the project: `supabase link --project-ref <your-ref>`
3. Push: `supabase db push`

Or paste the migration file into the Supabase dashboard's SQL Editor and run it once.

## How to run the tests locally

Needs a local PostgreSQL (not Supabase):

```bash
psql -f tests/00_supabase_stub.sql
psql -f migrations/20261005000001_foundation.sql
psql -f tests/10_foundation_rls.test.sql
```

Run the tests on a throwaway database; they create test users and a `tst` schema.

The last query prints `passed` and `failed` counts. Expected: 58 passed, 0 failed. Any row marked `<<< FAIL` above it shows which rule broke.

## Rules for future migrations

- Never edit an applied migration. Add a new file with a later timestamp.
- Every new table needs RLS on and explicit grants.
- Every new function needs an explicit `revoke ... from public, anon, authenticated`
  unless the browser is meant to call it.
