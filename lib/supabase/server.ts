// lib/supabase/server.ts
//
// Supabase client for Server Components, Server Actions and Route Handlers.
// It reads and writes the signed-in user's session cookies, so every query runs
// as that user and Row Level Security applies.

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

import { supabaseEnv } from "./env";

export async function createClient() {
  const env = supabaseEnv();
  if (!env) {
    throw new Error("Supabase is not configured. Connect it in Vercel (Integrations > Supabase).");
  }

  const cookieStore = await cookies();

  return createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component, where cookies are read-only. The
          // middleware refreshes the session instead, so this is safe to ignore.
        }
      },
    },
  });
}
