// components/auth/fields.tsx
//
// Form building blocks used across the auth pages and the dashboard. Plain HTML
// forms posting to Server Actions, so they work even before JavaScript loads.

import type { ReactNode } from "react";

export function Field({
  label,
  name,
  type = "text",
  autoComplete,
  hint,
  defaultValue,
  required = true,
  minLength,
  maxLength,
  prefix,
  inputMode,
  autoCapitalize = "none",
}: {
  label: string;
  name: string;
  type?: "text" | "email" | "password";
  autoComplete?: string;
  hint?: ReactNode;
  defaultValue?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  prefix?: string;
  inputMode?: "text" | "email";
  autoCapitalize?: "none" | "words";
}) {
  const id = `field-${name}`;
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-[#0B1F18]">
        {label}
      </label>
      <div className="flex min-h-[52px] items-center rounded-xl border border-[#C9D6CE] bg-white px-4 focus-within:border-[#064E3B]">
        {prefix ? <span className="shrink-0 text-[#4B6358]">{prefix}</span> : null}
        <input
          id={id}
          name={name}
          type={type}
          autoComplete={autoComplete}
          defaultValue={defaultValue}
          required={required}
          minLength={minLength}
          maxLength={maxLength}
          inputMode={inputMode}
          autoCapitalize={autoCapitalize}
          spellCheck={false}
          aria-describedby={hintId}
          className="min-w-0 flex-1 bg-transparent py-3 text-base text-[#0B1F18] outline-none placeholder:text-[#4B6358]/70"
        />
      </div>
      {hint ? (
        <p id={hintId} className="text-[13px] text-[#4B6358]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function TextArea({
  label,
  name,
  defaultValue,
  maxLength,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  maxLength?: number;
  hint?: ReactNode;
}) {
  const id = `field-${name}`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-[#0B1F18]">
        {label}
      </label>
      <textarea
        id={id}
        name={name}
        defaultValue={defaultValue}
        maxLength={maxLength}
        rows={3}
        className="rounded-xl border border-[#C9D6CE] bg-white px-4 py-3 text-base text-[#0B1F18] outline-none focus:border-[#064E3B]"
      />
      {hint ? <p className="text-[13px] text-[#4B6358]">{hint}</p> : null}
    </div>
  );
}

const TONES = {
  error: "border-[#B42318]/30 bg-[#FEF3F2] text-[#7A271A]",
  success: "border-[#064E3B]/25 bg-[#E3F0EA] text-[#064E3B]",
  info: "border-[#D9B873]/60 bg-[#FBF6EA] text-[#5C4513]",
} as const;

export function Notice({
  tone = "info",
  children,
}: {
  tone?: keyof typeof TONES;
  children: ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-xl border px-4 py-3 text-[15px] ${TONES[tone]}`}
    >
      {children}
    </div>
  );
}
