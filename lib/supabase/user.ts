// lib/supabase/user.ts
//
// Reads the signed-in user from the session cookie, with no network call.
// The middleware has already checked the session with Supabase for every
// /dashboard request, and the database checks it again on every query (RLS),
// so pages can skip a second round trip to Supabase just to learn who is here.
import type { SupabaseClient, User } from "@supabase/supabase-js";

export async function getPageUser(supabase: SupabaseClient): Promise<User | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
}
