// app/auth/callback/route.ts
//
// Where the links in Supabase emails land: sign-up confirmation and password
// reset. It turns the one-time code into a signed-in session, then sends the
// person on to the right page.

import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { safeNext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNext(searchParams.get("next"), "/dashboard");
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const isReset = next === "/reset-password";

  // Supabase reports expired or already-used links with an error parameter.
  if (searchParams.get("error") || searchParams.get("error_code")) {
    return NextResponse.redirect(`${origin}${isReset ? "/forgot?error=link" : "/login?error=link"}`);
  }

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    // The link was opened in a different browser from the one used to sign up.
    // Supabase has already confirmed the email, so the person only needs to
    // log in here.
    return NextResponse.redirect(
      `${origin}${isReset ? "/forgot?error=browser" : "/login?notice=confirmed"}`,
    );
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}${isReset ? "/forgot?error=link" : "/login?error=link"}`);
}
