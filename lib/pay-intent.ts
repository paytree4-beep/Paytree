// lib/pay-intent.ts
//
// Remembers, in this browser only, which payment method a visitor opened or
// copied on a page. "I've paid" stays hidden until they have opened one, and
// the method they used is filled in for them. This is a nudge, not proof:
// the owner still confirms the money arrived.
//
// No imports, so it is safe in client components.

export const OPENED_EVENT = "pt-opened-method";
const KEEP_MS = 24 * 60 * 60 * 1000; // remember for one day

type Entry = { id: string; at: number };

const storageKey = (scope: string) => `pt_opened:${scope}`;

export function readOpened(scope: string): string[] {
  try {
    const raw = JSON.parse(window.localStorage.getItem(storageKey(scope)) ?? "[]") as unknown;
    if (!Array.isArray(raw)) return [];
    const now = Date.now();
    return raw
      .filter((e): e is Entry => !!e && typeof (e as Entry).id === "string" && typeof (e as Entry).at === "number")
      .filter((e) => now - e.at < KEEP_MS)
      .map((e) => e.id);
  } catch {
    return [];
  }
}

export function rememberOpened(scope: string, id: string): void {
  try {
    const now = Date.now();
    const list = readOpened(scope).filter((x) => x !== id).map((x) => ({ id: x, at: now }));
    list.unshift({ id, at: now });
    window.localStorage.setItem(storageKey(scope), JSON.stringify(list.slice(0, 10)));
  } catch {
    // Storage blocked: the event below still unlocks the box for this visit.
  }
  window.dispatchEvent(new CustomEvent(OPENED_EVENT, { detail: { scope, id } }));
}
