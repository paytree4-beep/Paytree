// app/[username]/paid-form.tsx
//
// "I've paid" on the public page, shown only when the owner turned on the
// payment log. A plain form inside <details>, so it works without JavaScript.

import { SubmitButton } from "@/components/auth/submit-button";
import { AppleCelebration } from "@/components/marketing/apple-celebration";
import { methodLabel, type ClaimMethod } from "@/lib/payment-log";
import { notifyPayment } from "./paid-actions";

const ERRORS: Record<string, string> = {
  name: "Please enter your name (at least 2 letters).",
  amount: "Please enter the amount you paid, for example 25 or 25.50.",
  method: "Please choose how you paid.",
  busy: "This page received many notes in the last hour. Please try again later.",
  save: "We could not send that. Please try again.",
};

const inputClass =
  "min-h-[52px] w-full rounded-xl border border-[#C9D6CE] bg-white px-4 text-base text-[#0B1F18] outline-none focus:border-[#064E3B]";

export function PaidForm({
  username,
  displayName,
  methods,
  sent,
  error,
}: {
  username: string;
  displayName: string;
  methods: ClaimMethod[];
  sent: boolean;
  error: string | undefined;
}) {
  const options: ClaimMethod[] = [...methods, "cash", "other"];
  const message = error ? ERRORS[error] ?? ERRORS.save : null;

  if (sent) {
    return (
      <section
        id="paid"
        className="scroll-mt-6 rounded-2xl border border-[#BFE3CF] bg-[#ECF7F0] p-5 text-center"
      >
        <AppleCelebration />
        <p className="font-serif text-2xl text-[#064E3B]">Thank you for your support!</p>
      </section>
    );
  }

  return (
    <section
      id="paid"
      className="scroll-mt-6 rounded-2xl border border-white/80 bg-white/70 p-5 shadow-[0_10px_30px_-18px_rgba(6,78,59,0.35)] backdrop-blur-xl"
    >
      <details open={Boolean(message)} className="group">
        <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
          <span>
            <span className="mb-1 inline-block rounded-full bg-[#F1E6CC] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#7A5A12]">
              Optional
            </span>
            <span className="block font-bold text-[#064E3B]">Already paid?</span>
            <span className="block text-[14px] text-[#4B6358]">Let {displayName} know.</span>
          </span>
          <span className="inline-flex min-h-11 flex-none items-center rounded-full bg-[#064E3B] px-5 font-bold text-[#FBFBFB] group-open:hidden">
            I&rsquo;ve paid
          </span>
        </summary>

        <form action={notifyPayment} className="mt-4 flex flex-col gap-4" noValidate>
          {message ? (
            <p role="alert" className="rounded-xl bg-[#FEF3F2] px-4 py-3 text-[14px] text-[#7A271A]">
              {message}
            </p>
          ) : null}
          <input type="hidden" name="username" value={username} />
          {/* Spam trap: hidden from people, bots fill it in. */}
          <div aria-hidden="true" className="absolute left-[-9999px] h-px w-px overflow-hidden">
            <label>
              Website
              <input type="text" name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">Your name</span>
            <input name="payer_name" required minLength={2} maxLength={60} autoComplete="name" className={inputClass} />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">Amount</span>
            <span className="flex min-h-[52px] items-center rounded-xl border border-[#C9D6CE] bg-white px-4 focus-within:border-[#064E3B]">
              <span className="text-[#4B6358]">$</span>
              <input
                name="amount"
                required
                inputMode="decimal"
                maxLength={12}
                placeholder="0.00"
                className="min-w-0 flex-1 bg-transparent py-3 pl-1 text-base outline-none"
              />
            </span>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">Paid with</span>
            <select name="method" defaultValue="" className={inputClass}>
              <option value="">Choose…</option>
              {options.map((m) => (
                <option key={m} value={m}>
                  {methodLabel(m)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">Note (optional)</span>
            <input name="note" maxLength={140} placeholder="For example: order #12" className={inputClass} />
          </label>

          <SubmitButton pendingText="Sending…">Send</SubmitButton>
          <p className="text-center text-[12px] text-[#4B6358]">
            This only lets {displayName} know. It does not send money.
          </p>
        </form>
      </details>
    </section>
  );
}
