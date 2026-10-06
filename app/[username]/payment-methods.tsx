// app/[username]/payment-methods.tsx
"use client";

// Interactive part of the public page: icons, deep links, one-click copy,
// the toast and privacy-friendly click tracking. It receives only validated
// methods from the server component.
//
// Requires: npm install lucide-react

import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import {
  ArrowUpRight,
  Banknote,
  Bell,
  Building2,
  Check,
  CircleAlert,
  Coins,
  Copy,
  CreditCard,
  DollarSign,
  Globe,
  Landmark,
  Link as LinkIcon,
  Mail,
  Phone,
  ShoppingBag,
  Smartphone,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { badgeColor } from "@/lib/payment-colors";
import type { MethodGroup, MethodIcon, MethodId, ResolvedMethod } from "@/lib/profiles";
import { track } from "./track";

const TOAST_MS = 2400;
const APP_OPEN_TIMEOUT_MS = 1500;

type Tone = "success" | "warning";

interface ToastState {
  message: string;
  tone: Tone;
}

/** One Lucide icon per method, chosen on the server and mapped here. */
const ICONS: Record<MethodIcon, LucideIcon> = {
  "dollar-sign": DollarSign, // Cash App
  wallet: Wallet, // Venmo
  "credit-card": CreditCard, // PayPal and Stripe
  mail: Mail, // Zelle with an email address
  phone: Phone, // Zelle with a phone number
  building: Building2, // ACH bank transfer
  globe: Globe, // Wise (international)
  coins: Coins, // Crypto
  smartphone: Smartphone, // Apple Cash
  bell: Bell, // Chime
  landmark: Landmark, // Wire transfer
  banknote: Banknote, // Check by mail
  "shopping-bag": ShoppingBag, // Square
  link: LinkIcon, // Custom link
};

const GROUPS: { id: MethodGroup; title: string; hint: string }[] = [
  {
    id: "online",
    title: "PAY ONLINE",
    hint: "Tap to pay with the service you already use.",
  },
  {
    id: "bank",
    title: "TRANSFERS",
    hint: "Copy the details, then paste them into your banking or payment app.",
  },
  {
    id: "crypto",
    title: "CRYPTO",
    hint: "Send only on the network shown. Transfers cannot be reversed.",
  },
];

/**
 * Copies text to the clipboard. Uses the async Clipboard API where it is
 * available (secure contexts), and falls back to a hidden textarea with
 * execCommand for older browsers and in-app web views.
 */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Permission denied or blocked: fall through to the legacy path.
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "0";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, text.length);

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }
  document.body.removeChild(textarea);
  return copied;
}

interface PaymentMethodsProps {
  username: string;
  displayName: string;
  methods: ResolvedMethod[];
  /** Optional box (the "I've paid" form) shown among the methods. */
  extra?: ReactNode;
  /** How many methods come before `extra`, in display order. Missing = after all of them. */
  extraIndex?: number | null;
  /** "tip" relabels the first group for a tip jar. */
  mode?: "pay" | "tip";
}

export function PaymentMethods({ username, displayName, methods, extra, extraIndex, mode = "pay" }: PaymentMethodsProps) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const viewTracked = useRef(false);

  const showToast = useCallback((message: string, tone: Tone = "success") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, tone });
    toastTimer.current = setTimeout(() => {
      setToast(null);
      setCopiedId(null);
    }, TOAST_MS);
  }, []);

  // Count one page view per visit. The ref stops React Strict Mode from
  // double-counting in development.
  useEffect(() => {
    if (viewTracked.current) return;
    viewTracked.current = true;
    track({ username, action: "view", referrer: document.referrer });
  }, [username]);

  // Clear any pending timers when the page unmounts.
  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      if (appTimer.current) clearTimeout(appTimer.current);
    };
  }, []);

  const handleCopy = useCallback(
    async (method: ResolvedMethod) => {
      if (!method.copyValue) return;
      const ok = await copyToClipboard(method.copyValue);
      if (ok) {
        setCopiedId(method.id);
        showToast(method.copyToast ?? `${method.label} copied to clipboard`);
        track({ username, action: "copy", method: method.id });
      } else {
        showToast(
          "Copying was blocked by your browser. Press and hold the details to copy them.",
          "warning",
        );
      }
    },
    [showToast, username],
  );

  /**
   * Custom-scheme links (venmo://) are handed to the operating system. The
   * browser never tells us whether an app answered, so we watch for the page
   * being hidden (an app took focus). If it is still visible after a short
   * wait, no app opened, and we send the visitor to the web page instead.
   */
  const handleLinkClick = useCallback(
    (_event: MouseEvent<HTMLAnchorElement>, method: ResolvedMethod) => {
      track({ username, action: "open", method: method.id });

      const fallback = method.fallbackHref;
      if (!fallback) return;

      if (appTimer.current) clearTimeout(appTimer.current);

      let leftPage = false;
      const onVisibility = () => {
        if (document.visibilityState === "hidden") leftPage = true;
      };
      document.addEventListener("visibilitychange", onVisibility);
      window.addEventListener("pagehide", onVisibility);

      // The anchor's own href then opens venmo://... (no preventDefault).
      appTimer.current = setTimeout(() => {
        document.removeEventListener("visibilitychange", onVisibility);
        window.removeEventListener("pagehide", onVisibility);
        if (!leftPage && document.visibilityState === "visible") {
          showToast(`${method.fallbackName ?? "App"} did not open. Taking you to the website.`, "warning");
          window.setTimeout(() => window.location.assign(fallback), 700);
        }
      }, APP_OPEN_TIMEOUT_MS);
    },
    [showToast, username],
  );

  const renderGroup = (group: (typeof GROUPS)[number], items: ResolvedMethod[]) => (
    <section key={group.id} aria-labelledby={`heading-${group.id}`} className="flex flex-col gap-3">

                <div>
                  <h2
                    id={`heading-${group.id}`}
                    className="text-[13px] font-bold tracking-[0.12em] text-[#064E3B]"
                  >
                    {mode === "tip" && group.id === "online" ? "SEND A TIP 💸" : group.title}
                  </h2>
                  <p className="mt-0.5 text-sm text-[#4B6358]">
                    {mode === "tip" && group.id === "online" ? "Tap the app you already use. Every tip helps!" : group.hint}
                  </p>
                </div>

                {items.map((method) =>
                  method.kind === "link" ? (
                    <LinkRow
                      key={method.id}
                      method={method}
                      onClick={(event) => handleLinkClick(event, method)}
                    />
                  ) : (
                    <CopyRow
                      key={method.id}
                      method={method}
                      copied={copiedId === method.id}
                      onCopy={() => handleCopy(method)}
                    />
                  ),
                )}
    </section>
  );

  return (
    <>
      {methods.length === 0 ? (
        <div className="flex flex-col gap-6">
          <div className="rounded-[18px] border border-dashed border-[#B9CBC0] p-7 text-center text-[#4B6358]">
            {displayName} has not added any payment methods yet.
          </div>
          {extra}
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {(() => {
            // Place the optional box after `extraIndex` methods, between groups.
            const visible = GROUPS.map((group) => ({ group, items: methods.filter((m) => m.group === group.id) })).filter(
              (g) => g.items.length > 0,
            );
            const target =
              extraIndex === null || extraIndex === undefined ? methods.length : Math.max(0, Math.min(extraIndex, methods.length));
            let before = 0;
            let placed = !extra;
            const out: ReactNode[] = [];
            for (const { group, items } of visible) {
              if (!placed && target <= before) {
                out.push(<div key="extra">{extra}</div>);
                placed = true;
              }
              before += items.length;
              out.push(renderGroup(group, items));
            }
            if (!placed) out.push(<div key="extra">{extra}</div>);
            return out;
          })()}
        </div>
      )}

      {/* Toast: the live region stays mounted so screen readers announce changes. */}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4"
      >
        <div
          className={`flex max-w-[420px] items-center gap-2.5 rounded-[14px] bg-[#0B1F18] px-[18px] py-3 text-sm font-semibold text-[#FBFBFB] shadow-[0_18px_40px_-16px_rgba(0,0,0,0.5)] transition-all duration-200 motion-reduce:transition-none ${
            toast ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
          }`}
        >
          {toast ? (
            toast.tone === "success" ? (
              <Check className="h-[18px] w-[18px] text-[#D9B873]" strokeWidth={2.6} aria-hidden="true" />
            ) : (
              <CircleAlert className="h-[18px] w-[18px] text-[#F4B183]" strokeWidth={2.4} aria-hidden="true" />
            )
          ) : null}
          <span>{toast?.message ?? ""}</span>
        </div>
      </div>
    </>
  );
}

const ROW_CLASSES =
  "flex min-h-[72px] w-full items-center gap-3.5 rounded-[18px] border border-[#DCE5DF] bg-white px-[18px] py-3.5 text-left text-[#0B1F18] transition duration-150 hover:-translate-y-px hover:shadow-[0_10px_24px_-14px_rgba(6,78,59,0.55)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9B873] motion-reduce:transition-none motion-reduce:hover:transform-none";


/** Round badge with the method's icon on its signature color. */
function IconBadge({ icon, id }: { icon: MethodIcon; id: MethodId }) {
  const Icon = ICONS[icon];
  const color = badgeColor(id);
  return (
    <span
      aria-hidden="true"
      style={{ backgroundColor: color.bg, color: color.fg }}
      className="flex h-11 w-11 flex-none items-center justify-center rounded-full"
    >
      <Icon className="h-5 w-5" strokeWidth={1.75} />
    </span>
  );
}

function RowText({ method }: { method: ResolvedMethod }) {
  return (
    <span className="min-w-0 flex-1">
      <span className="block font-bold">
        {method.label}
        {method.tag ? (
          <span className="text-[13px] font-medium text-[#4B6358]"> · {method.tag}</span>
        ) : null}
      </span>
      <span className="block truncate text-[13px] tabular-nums text-[#4B6358]">{method.detail}</span>
    </span>
  );
}

function LinkRow({
  method,
  onClick,
}: {
  method: ResolvedMethod;
  onClick: (event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  // https links open in a new tab (and in the native app when the OS has a
  // universal link for the domain). Custom schemes must stay in the same tab.
  const isWeb = method.href?.startsWith("https://") ?? false;

  return (
    <a
      href={method.href}
      onClick={onClick}
      {...(isWeb ? { target: "_blank", rel: "noopener noreferrer nofollow ugc" } : {})}
      className={ROW_CLASSES}
    >
      <IconBadge icon={method.icon} id={method.id} />
      <RowText method={method} />
      <ArrowUpRight className="h-5 w-5 flex-none text-[#064E3B]" strokeWidth={2} aria-hidden="true" />
    </a>
  );
}

function CopyRow({
  method,
  copied,
  onCopy,
}: {
  method: ResolvedMethod;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={`Copy ${method.label} details`}
      className={ROW_CLASSES}
    >
      <IconBadge icon={method.icon} id={method.id} />
      <RowText method={method} />
      <span
        className={`inline-flex min-h-9 flex-none items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold ${
          copied ? "bg-[#064E3B] text-[#FBFBFB]" : "bg-[#E3F0EA] text-[#064E3B]"
        }`}
      >
        {copied ? (
          <Check className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
        ) : (
          <Copy className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
        )}
        {copied ? "Copied" : "Copy"}
      </span>
    </button>
  );
}
