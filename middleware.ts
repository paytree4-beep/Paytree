// middleware.ts
//
// Keeps the Supabase session fresh and keeps signed-out visitors out of the
// private pages. It runs only on the routes listed in `config.matcher`, so the
// public payment pages and the homepage stay fast.

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { safeNext } from "@/lib/auth";

const PRIVATE_PATHS = ["/dashboard", "/onboarding", "/reset-password"];

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Do not put code between createServerClient and getUser: getUser is what
  // refreshes an expired session.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPrivate = PRIVATE_PATHS.some((p) => path === p || path.startsWith(`${p}/`));

  if (!user && isPrivate) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = "";
    login.searchParams.set("next", path);
    return NextResponse.redirect(login);
  }

  // Already signed in: skip the log-in and sign-up pages and go straight to
  // the dashboard here, before any page starts loading. Redirecting inside
  // those pages instead caused a loading screen, a white flash and a reload.
  if (user && (path === "/login" || path === "/signup")) {
    const next = request.nextUrl.searchParams.get("next") ?? "";
    const target = request.nextUrl.clone();
    target.search = "";
    target.pathname = path === "/login" ? safeNext(next) : "/dashboard";
    const redirect = NextResponse.redirect(target);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding",
    "/reset-password",
    "/login",
    "/signup",
    "/auth/:path*",
  ],
};
