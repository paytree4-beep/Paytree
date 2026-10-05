// lib/supabase/admin.ts
//
// SERVER ONLY. A Supabase client with the service role key, which bypasses
// Row Level Security. Used for the few things a user cannot do for
// themselves, such as deleting their own sign-in record. Never import this
// from a file marked "use client".

import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
