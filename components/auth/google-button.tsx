// components/auth/google-button.tsx
//
// "Continue with Google", followed by an "or use your email" divider. Renders
// nothing until GOOGLE_SIGNIN is switched on (see lib/site.ts).

import Link from "next/link";

import { continueWithGoogle } from "@/app/auth-actions";
import { GOOGLE_SIGNIN } from "@/lib/site";
import { GoogleSubmit } from "./google-submit";

function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

/** Google button that submits the surrounding form (used on sign-up, so the
 * Terms checkbox travels with it). */
export function GoogleButtonInForm() {
  if (!GOOGLE_SIGNIN) return null;
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3 text-[13px] text-[#4B6358]">
        <span className="h-px flex-1 bg-[#DCE5DF]" aria-hidden="true" />
        or
        <span className="h-px flex-1 bg-[#DCE5DF]" aria-hidden="true" />
      </div>
      <GoogleSubmit formAction={continueWithGoogle}>
        <GoogleMark />
        Continue with Google
      </GoogleSubmit>
    </div>
  );
}

export function GoogleSignIn() {
  if (!GOOGLE_SIGNIN) return null;
  return (
    <div className="mb-6 flex flex-col gap-6">
      <form action={continueWithGoogle} className="flex flex-col gap-2">
        <GoogleSubmit>
          <GoogleMark />
          Continue with Google
        </GoogleSubmit>
        <p className="text-center text-[12px] text-[#4B6358]">
          New here? By continuing with Google you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-2">Terms</Link> and{" "}
          <Link href="/privacy" className="underline underline-offset-2">Privacy Policy</Link>.
        </p>
      </form>
      <div className="flex items-center gap-3 text-[13px] text-[#4B6358]">
        <span className="h-px flex-1 bg-[#DCE5DF]" aria-hidden="true" />
        or use your email
        <span className="h-px flex-1 bg-[#DCE5DF]" aria-hidden="true" />
      </div>
    </div>
  );
}
