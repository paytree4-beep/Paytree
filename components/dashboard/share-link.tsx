"use client";
// components/dashboard/share-link.tsx
//
// "Copy link" and "Share" buttons for the owner's public address. Share uses
// the phone's own share sheet (WhatsApp, Messages, Instagram...) where the
// browser supports it, and falls back to copying.

import { useState } from "react";

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

export function ShareLink({ url, name }: { url: string; name: string }) {
  const [status, setStatus] = useState<string>("");

  const onCopy = async () => {
    const ok = await copyText(url);
    setStatus(ok ? "Link copied" : "Press and hold the link above to copy it");
  };

  const onShare = async () => {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: `Pay ${name}`, url });
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
          className="inline-flex min-h-11 items-center rounded-full bg-[#D9B873] px-6 font-bold text-[#064E3B]"
        >
          Copy link
        </button>
        <button
          type="button"
          onClick={onShare}
          className="inline-flex min-h-11 items-center rounded-full border border-[#064E3B]/40 px-6 font-bold text-[#064E3B]"
        >
          Share
        </button>
      </div>
      <p role="status" aria-live="polite" className="min-h-5 text-[13px] font-semibold text-[#064E3B]">
        {status}
      </p>
    </div>
  );
}
