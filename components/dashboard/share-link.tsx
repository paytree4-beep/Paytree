"use client";
// components/dashboard/share-link.tsx
//
// "Copy link" and "Share" buttons for the owner's public address. Share uses
// the phone's own share sheet (WhatsApp, Messages, Instagram...) where the
// browser supports it, and falls back to copying.

import { useEffect, useRef, useState } from "react";

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  area.setSelectionRange(0, text.length);
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(area);
  return ok;
}

const CHECK = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

export function ShareLink({ url, name }: { url: string; name: string }) {
  const [status, setStatus] = useState<string>("");
  // Which button shows its green "done" state for a moment.
  const [done, setDone] = useState<"copy" | "share" | null>(null);
  const timer = useRef<number>(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const flash = (which: "copy" | "share") => {
    setDone(which);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setDone(null), 2500);
  };

  const onCopy = async () => {
    const ok = await copyText(url);
    if (ok) {
      flash("copy");
      setStatus("Link copied. Paste it anywhere.");
    } else {
      setDone(null);
      setStatus("Press and hold the link above to copy it");
    }
  };

  const onShare = async () => {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: `Pay ${name}`, url });
        flash("share");
        setStatus("");
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    await onCopy();
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onCopy}
          className={`inline-flex min-h-11 items-center gap-2 rounded-full px-6 font-bold transition-colors duration-200 ${
            done === "copy" ? "bg-[#16A34A] text-white" : "bg-[#D9B873] text-[#064E3B]"
          }`}
        >
          {done === "copy" ? (
            <>
              {CHECK}
              Copied!
            </>
          ) : (
            "Copy link"
          )}
        </button>
        <button
          type="button"
          onClick={onShare}
          className={`inline-flex min-h-11 items-center gap-2 rounded-full px-6 font-bold transition-colors duration-200 ${
            done === "share"
              ? "border border-[#16A34A] bg-[#16A34A] text-white"
              : "border border-[#064E3B]/40 text-[#064E3B]"
          }`}
        >
          {done === "share" ? (
            <>
              {CHECK}
              Shared
            </>
          ) : (
            "Share"
          )}
        </button>
      </div>
      <p role="status" aria-live="polite" className="min-h-5 text-[13px] font-semibold text-[#064E3B]">
        {status}
      </p>
    </div>
  );
}
