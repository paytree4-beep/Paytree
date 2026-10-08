// lib/supabase/public.ts
//
// Signed-out Supabase client for public pages (paytree.to/<username>). It never
// touches cookies, so it sees exactly what any visitor may see under Row Level
// Security: published profiles and their visible payment methods.

import { createClient } from "@supabase/supabase-js";

import { supabaseEnv } from "./env";

export function createPublicClient() {
  const env = supabaseEnv();
  if (!env) return null;
  return createClient(env.url, env.key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
