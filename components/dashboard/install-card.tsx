"use client";
// components/dashboard/install-card.tsx
//
// "Add PayTree to your Home Screen". Android/Chrome gets a one-tap Install
// button; iPhone gets the two steps (Share, then Add to Home Screen). Hidden
// once PayTree is opened as an app, or after "Not now".

import { useEffect, useState } from "react";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const KEY = "pt_install_dismissed";

export function InstallCard() {
  const [mode, setMode] = useState<"hidden" | "ios" | "prompt">("hidden");
  const [promptEvent, setPromptEvent] = useState<InstallPrompt | null>(null);

  useEffect(() => {
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) return;
    try {
      if (localStorage.getItem(KEY)) return;
    } catch {
      // ignore
    }
    const ua = navigator.userAgent;
    const isIos = /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
    if (isIos) {
      setMode("ios");
      return;
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as InstallPrompt);
      setMode("prompt");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      // ignore
    }
    setMode("hidden");
  };

  if (mode === "hidden") return null;

  return (
    <section className="flex items-start gap-3 rounded-[22px] border border-white/90 bg-white/85 p-4 shadow-[0_14px_30px_-22px_rgba(6,78,59,0.55)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/icon-192.png" alt="" width={48} height={48} className="h-12 w-12 flex-none rounded-[12px]" />
      <div className="min-w-0 flex-1">
        <p className="font-bold text-[#064E3B]">Add PayTree to your Home Screen</p>
        {mode === "ios" ? (
          <p className="mt-1 text-[14px] leading-snug text-[#2F4A3E]">
            In Safari, tap <strong>Share</strong> <span aria-hidden="true">⬆️</span>, then{" "}
            <strong>Add to Home Screen</strong>. PayTree opens like an app.
          </p>
        ) : (
          <p className="mt-1 text-[14px] leading-snug text-[#2F4A3E]">Open your dashboard in one tap, like an app.</p>
        )}
        <div className="mt-3 flex gap-2">
          {mode === "prompt" && promptEvent ? (
            <button
              type="button"
              onClick={async () => {
                await promptEvent.prompt();
                await promptEvent.userChoice.catch(() => null);
                setMode("hidden");
              }}
              className="inline-flex min-h-10 items-center rounded-full bg-[#064E3B] px-5 text-[14px] font-bold text-[#FBFBFB]"
            >
              Install
            </button>
          ) : null}
          <button type="button" onClick={dismiss} className="inline-flex min-h-10 items-center px-2 text-[14px] font-semibold text-[#4B6358]">
            Not now
          </button>
        </div>
      </div>
    </section>
  );
}
