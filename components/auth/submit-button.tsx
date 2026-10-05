"use client";
// components/auth/submit-button.tsx
//
// Submit button that shows a busy state while its form is being sent, so
// people do not tap twice.

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

export function SubmitButton({
  children,
  pendingText = "Please wait…",
  variant = "emerald",
}: {
  children: ReactNode;
  pendingText?: string;
  variant?: "emerald" | "outline";
}) {
  const { pending } = useFormStatus();
  const style =
    variant === "emerald"
      ? "bg-[#064E3B] text-[#FBFBFB]"
      : "border border-[#064E3B]/40 bg-transparent text-[#064E3B]";
  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className={`flex min-h-[52px] w-full items-center justify-center rounded-full px-7 font-bold transition-opacity disabled:opacity-70 ${style}`}
    >
      {pending ? pendingText : children}
    </button>
  );
}
