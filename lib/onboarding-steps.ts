// lib/onboarding-steps.ts
//
// Remembers, in this browser, which "Get started" steps the owner did
// (saved or shared the QR code, sent their link). No imports: client-safe.

export type StepId = "qr" | "share";
export const STEP_EVENT = "pt-step-done";

export function markStep(id: StepId): void {
  try {
    window.localStorage.setItem(`pt_step_${id}`, "1");
  } catch {
    // ignore
  }
  try {
    window.dispatchEvent(new CustomEvent(STEP_EVENT, { detail: id }));
  } catch {
    // ignore
  }
}

export function stepDone(id: StepId): boolean {
  try {
    return window.localStorage.getItem(`pt_step_${id}`) === "1";
  } catch {
    return false;
  }
}
