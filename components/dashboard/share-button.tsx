"use client";

// components/dashboard/share-button.tsx
//
// A small "Share" button that sits next to Open and Delete. On a phone it opens
// the share sheet; elsewhere it copies the link.

import { useState } from "react";

export function ShareButton({ url, text }: { url: string; text: string }) {
  const [copied, setCopied] = useState(false);

  const onClick = async () => {
    try {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({ text, url });
        return;
      }
    } catch {
      // The person closed the share sheet: nothing to do.
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-10 items-center rounded-full bg-[#064E3B] px-4 text-[14px] font-bold text-[#FBFBFB]"
    >
      {copied ? "Copied ✓" : "Share"}
    </button>
  );
}

export function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-10 items-center rounded-full border border-[#064E3B]/40 px-4 text-[14px] font-bold text-[#064E3B]"
    >
      {copied ? "Copied ✓" : "Copy"}
    </button>
  );
}
