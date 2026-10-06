"use client";
// components/auth/google-submit.tsx
//
// "Continue with Google" button that shows it is working right away
// (spinner + "Opening Google…"), so people do not tap it again.

import { useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

export function GoogleSubmit({
  children,
  formAction,
}: {
  children: ReactNode;
  formAction?: (formData: FormData) => void | Promise<void>;
}) {
  const { pending } = useFormStatus();
  const [clicked, setClicked] = useState(false);
  const busy = clicked && pending;
  return (
    <button
      type="submit"
      formAction={formAction}
      formNoValidate
      onClick={() => setClicked(true)}
      disabled={busy}
      aria-busy={busy}
      className="flex min-h-[52px] w-full items-center justify-center gap-3 rounded-full border border-[#C9D6CE] bg-white px-7 font-bold text-[#0B1F18] hover:border-[#064E3B] active:scale-[0.98] disabled:opacity-80"
    >
      {busy ? (
        <>
          <span className="pt-spin inline-block h-5 w-5 rounded-full border-[3px] border-[#C9D6CE] border-t-[#064E3B]" aria-hidden="true" />
          Opening Google…
        </>
      ) : (
        children
      )}
    </button>
  );
}
