// lib/supabase/env.ts
//
// Reads the Supabase connection details. The Supabase integration on Vercel
// fills these in automatically. The URL and the anon (publishable) key are
// designed to be public: Row Level Security in the database protects the data.

export interface SupabaseEnv {
  url: string;
  key: string;
}

export function supabaseEnv(): SupabaseEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return { url, key };
}
