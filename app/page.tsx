// app/page.tsx  ->  paytree.to
//
// Landing page. Cream background with slowly floating apples (the fruit of
// the PayTree), frosted-glass cards and gentle motion. Copy sticks to what
// PayTree actually does: it shows payment methods; it never moves money.

import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  Copy,
  DollarSign,
  Mail,
  QrCode,
  ShieldCheck,
  Smartphone,
  ClipboardCheck,
  Wallet,
  Pizza,
  Clapperboard,
  HandCoins,
  ReceiptText,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { AppleBackdrop, AppleHalo } from "@/components/marketing/apples";
import { Cta } from "@/components/marketing/cta";
import { ExampleAvatar } from "@/components/marketing/example-avatar";
import { ExampleQr } from "@/components/marketing/example-qr";
import { Pricing } from "@/components/marketing/pricing";
import { Reveal } from "@/components/marketing/reveal";
import { badgeColor } from "@/lib/payment-colors";
import { PRICING, SIGNUPS_OPEN, SITE_HOST, SITE_URL, TRIAL_DAYS } from "@/lib/site";

const glass =
  "rounded-[28px] border border-[#EADFC4] bg-white/95 shadow-[0_24px_60px_-34px_rgba(6,78,59,0.45)]";

const headingClass =
  "font-serif text-[clamp(34px,4.6vw,56px)] font-normal leading-[1.08] tracking-[-0.01em] text-[#064E3B] [text-wrap:balance]";

const goldText =
  "text-[#9A6E1A]";

const METHODS = [
  { id: "cashapp", name: "Cash App" },
  { id: "venmo", name: "Venmo" },
  { id: "zelle", name: "Zelle" },
  { id: "paypal", name: "PayPal" },
  { id: "applecash", name: "Apple Cash" },
  { id: "chime", name: "Chime" },
  { id: "stripe", name: "Cards by Stripe" },
  { id: "square", name: "Square" },
  { id: "wise", name: "Wise" },
  { id: "crypto", name: "USDT" },
  { id: "check", name: "Check by mail" },
];

const FEATURES: { title: string; body: string; Icon: LucideIcon; tint: string }[] = [
  { title: "Split the bill", body: "Dinner or a trip: everyone sees their share and pays you.", Icon: Pizza, tint: "#E5484D" },
  { title: "Invoices", body: "Send a customer a bill. They pay with their app, you confirm it.", Icon: ReceiptText, tint: "#C9A048" },
  { title: "Pay me here card", body: "A ready card for Stories, plus a video with music for TikTok and Reels.", Icon: Clapperboard, tint: "#3FA34D" },
  { title: "Tip me card", body: "Creators and musicians: turn your page into a tip jar and share a ready Tip me card.", Icon: HandCoins, tint: "#E8AE1C" },
  { title: "One link + QR", body: "Cash App, Venmo, Zelle and more in one link, plus a QR for your counter.", Icon: QrCode, tint: "#064E3B" },
  { title: "My money", body: "See what came in and what you spent, by day, month and year. Download it to Excel.", Icon: ClipboardCheck, tint: "#6D1ED4" },
  { title: "Private stats", body: "Visits and taps. No cookies, no tracking.", Icon: BarChart3, tint: "#7BC86C" },
  { title: "Paid to you", body: "We never hold your money. It goes straight to your own accounts.", Icon: ShieldCheck, tint: "#008CFF" },
];

const STEPS = [
  { n: "1", title: "Sign up", body: "Pick your link name." },
  { n: "2", title: "Add your apps", body: "Cash App, Venmo, Zelle and more." },
  { n: "3", title: "Share", body: "Send your link or show your QR code." },
];

const FAQ = [
  {
    q: "Does PayTree hold my money?",
    a: "Never. Your customers pay you directly in the app they choose, and the money goes straight to your own account. PayTree only shows your payment options.",
  },
  {
    q: "How does the free trial work?",
    a: `You get ${TRIAL_DAYS} days with every feature, and no card is needed to start. If you choose to continue, it is ${PRICING.monthly.price} a month, with every feature included. Cancel any time.`,
  },
  {
    q: "What happens when the trial ends?",
    a: "Your page is paused, not deleted. Everything you added is kept, and your page comes back the moment you subscribe.",
  },
  {
    q: "Do my customers need an account?",
    a: "No. They open your link or scan your QR code, tap the app they already use, and pay.",
  },
  {
    q: "Can I cancel any time?",
    a: "Yes. Cancel in one tap from your dashboard. You keep access until the end of the period you paid for.",
  },
  {
    q: "Is my information safe?",
    a: "We store only what your page needs, every account is protected, and visitor statistics never include IP addresses or cookies.",
  },
];

const EXAMPLE = [
  { id: "cashapp", name: "Cash App", detail: "$cedarcoffee", Icon: DollarSign, copy: false },
  { id: "venmo", name: "Venmo", detail: "@cedar-coffee-co", Icon: Wallet, copy: false },
  { id: "zelle", name: "Zelle", detail: "pay@cedarcoffee.co", Icon: Mail, copy: true },
  { id: "applecash", name: "Apple Cash", detail: "(555) 010-0142", Icon: Smartphone, copy: true },
] as const;

function MethodDot({ id, size = 10 }: { id: string; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="flex-none rounded-full"
      style={{ width: size, height: size, backgroundColor: badgeColor(id).bg }}
    />
  );
}

// Same look as a real PayTree page: dark green with gold rays, gold-ringed avatar,
// cream cards with gold frames. Cream phone body, thin black line inside, gold outline.
const PHONE =
  "pt-bob w-full overflow-hidden rounded-[30px] border-[7px] shadow-[inset_0_0_0_2px_#0B1F18,0_0_0_3px_#E3B93C,0_30px_60px_-28px_rgba(0,0,0,0.6)]";

const PHONE_BG =
  "repeating-conic-gradient(from 0deg at 50% 20%, rgba(227,185,60,0.14) 0 7deg, rgba(227,185,60,0) 7deg 20deg), radial-gradient(circle at 50% 18%, #34705C 0, #1C4A3A 55%, #143A2E 100%)";

const CARD_STYLE = { background: "#FAF5EA", border: "2px solid #E3B93C" } as const;

/** Two small phones side by side: a payment page and its statistics. */
function PhoneExample() {
  return (
    <div className="mx-auto flex w-full max-w-[460px] items-center justify-center gap-4">
      {/* Phone 1: the public payment page */}
      <div className="w-1/2 max-w-[220px] flex-none">
        <div
          role="img"
          aria-label="Example PayTree page for Cedar Coffee Co. with Cash App, Venmo, Zelle, Apple Cash and a QR code"
          className={PHONE}
          style={{ animationDuration: "7s", background: PHONE_BG, borderColor: "#FAF5EA" }}
        >
          <div className="relative flex flex-col items-center gap-0.5 overflow-hidden px-2 pb-2.5 pt-4 text-center">
            <AppleHalo compact />
            <span
              className="relative mb-0.5 rounded-full"
              style={{ boxShadow: "0 0 0 3px #E3B93C, 0 0 18px rgba(227,185,60,0.45)" }}
            >
              <ExampleAvatar size={50} />
            </span>
            <span className="relative font-serif text-[21px] leading-tight" style={{ color: "#FFFFFF" }}>Cedar Coffee Co.</span>
            <span className="relative text-[11.5px] font-semibold" style={{ color: "#E3B93C" }}>{SITE_HOST}/cedarcoffee</span>
          </div>
          <div className="flex flex-col gap-1.5 p-2">
            {EXAMPLE.map(({ id, name, detail, Icon, copy }) => {
              const c = badgeColor(id);
              const Action = copy ? Copy : ArrowUpRight;
              return (
                <div key={id} className="flex items-center gap-1.5 rounded-[9px] px-2 py-1.5" style={CARD_STYLE}>
                  <span
                    className="flex h-5 w-5 flex-none items-center justify-center rounded-full"
                    style={{ backgroundColor: c.bg, color: c.fg }}
                  >
                    <Icon className="h-2.5 w-2.5" strokeWidth={2.4} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10.5px] font-bold leading-tight">{name}</span>
                    <span className="block truncate text-[9px] text-[#2F4A3E]">{detail}</span>
                  </span>
                  <Action className="h-2.5 w-2.5 flex-none text-[#064E3B]" />
                </div>
              );
            })}
            <div className="flex items-center gap-1.5 rounded-[10px] px-2 py-1.5 text-[#064E3B]" style={CARD_STYLE}>
              <ExampleQr url={SITE_URL} size={26} />
              <span className="text-[10.5px] font-semibold">Scan to pay</span>
            </div>
          </div>
        </div>
        <p className="mt-2 text-center text-[12px] font-semibold text-[#2F4A3E]">Your page</p>
      </div>

      {/* Next to the phone: ready in 3 steps */}
      <div id="how" className="flex w-1/2 max-w-[220px] scroll-mt-24 flex-col gap-3">
        <p className="font-serif text-[24px] leading-tight text-[#064E3B]">Ready in 3 steps</p>
        <ol className="flex flex-col gap-3">
          {STEPS.map((step) => (
            <li key={step.n} className={`flex gap-3 p-3 ${glass}`}>
              <span aria-hidden="true" className={`font-serif text-[34px] leading-none ${goldText}`}>
                {step.n}
              </span>
              <span className="min-w-0">
                <span className="block text-[17px] font-bold leading-tight text-[#0B1F18]">{step.title}</span>
                <span className="mt-0.5 block text-[14px] font-semibold leading-snug text-[#0F2419]">{step.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export default function HomePage() {
  const trialCta = `Start your ${TRIAL_DAYS}-day free trial`;

  return (
    <div className="relative min-h-screen overflow-x-clip [text-rendering:optimizeLegibility] bg-[#FAF5EA] text-[19px] leading-[1.6] text-[#0B1F18]">
      <style>{`
/* Dark green theme (homepage only) */
/* Logo style: gold accents */
header > div{border:1.5px solid rgba(227,185,60,.5)!important}
.pt-box.pt-box.pt-box{border:2.5px solid #E3B93C!important;box-shadow:0 14px 30px rgba(0,0,0,.35)}
.pt-badge{width:140px;height:140px;border-radius:9999px;background:#FAF5EA;border:8px solid #B9A04A;display:flex;align-items:center;justify-content:center;box-shadow:0 0 70px rgba(227,185,60,.45);position:relative}
h1{-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision;text-shadow:0 2px 3px rgba(0,0,0,.28)}
h1 [class*="text-[#E3B93C"],h1 span{text-shadow:none}
.pt-badge img{width:114px;height:114px;object-fit:contain}
.pt-rays{position:absolute;left:50%;top:50%;width:1100px;height:1100px;margin:-550px 0 0 -550px;pointer-events:none;background:repeating-conic-gradient(rgba(227,185,60,.10) 0 6deg,rgba(227,185,60,0) 6deg 18deg);-webkit-mask:radial-gradient(circle,#000 0,transparent 60%);mask:radial-gradient(circle,#000 0,transparent 60%)}
[class*="bg-[#FAF5EA]"]:not(.pt-bob):not(.pt-bob *){background:linear-gradient(180deg,#25594A 0%,#1C4A3A 60%,#143A2E 100%)!important;color:#FFFFFF!important}
/* dark text -> light */
:is([class*="text-[#064E3B]"],[class*="text-[#0B1F18]"],[class*="text-[#0F2419]"],[class*="text-[#2F4A3E]"],[class*="text-[#053D2E]"],[class*="text-[#1A3326]"]):not(.pt-bob):not(.pt-bob *){color:#FFFFFF!important}
[class*="text-[#9A6E1A]"]:not(.pt-bob):not(.pt-bob *){color:#E3B93C!important}
strong[class*="text-[#064E3B]"]{color:#FFFFFF!important}
/* glass cards / chips */
:is([class*="bg-white/"],[class*="bg-[#E3F0EA]"]):not(.pt-bob):not(.pt-bob *){background:rgba(255,255,255,.09)!important;border-color:rgba(255,255,255,.16)!important}
[class*="bg-[#E3F0EA]"]:not(.pt-bob):not(.pt-bob *){color:#FFFFFF!important}
/* main buttons: yellow */
[class*="bg-[#064E3B]"]:not(.pt-bob):not(.pt-bob *){background:#E3B93C!important;color:#17402F!important}
[class*="bg-[#064E3B]"]:not(.pt-bob):not(.pt-bob *) *{color:#17402F!important}
/* gold CTA card */
[class*="from-white"][class*="via-[#FBF3DF]"]{background:linear-gradient(135deg,#2C6755,#1E5444)!important;border-color:#E3B93C!important}
:is(details,summary):not(.pt-bob):not(.pt-bob *){border-color:rgba(255,255,255,.18)!important}
header,[class*="backdrop-blur"]{background-color:rgba(20,58,46,.6)!important}
.pt-box{background:#fff!important}
.pt-box p:first-child,.pt-box [class*="text-[#064E3B]"]{color:#064E3B!important}
.pt-box [class*="text-[#2F4A3E]"]{color:#2F4A3E!important}
[class*="border-[#C9A048]"][class*="bg-white"]{background:rgba(255,255,255,.09)!important;border-color:#E3B93C!important}
[class*="border-[#E2C27A]"],[class*="border-[#C9A048]"]{border-color:#E3B93C!important}
[class*="border-[#E8C766]"]{background:#fff!important}
[class*="border-[#E8C766]"] p{color:#064E3B!important}
[class*="border-[#E8C766]"] p+p{color:#2F4A3E!important}
.pt-bob{color:#0B1F18!important}
.pt-bob,.pt-bob *{color:inherit}.pt-bob{color:#0B1F18!important}

.pt-box.pt-box.pt-box p:first-child{color:#062A1E!important}
.pt-box.pt-box.pt-box p+p{color:#0B1F18!important;font-weight:600!important}
[class*="border-[#E8C766]"][class*="border-[#E8C766]"][class*="border-[#E8C766]"] p{color:#064E3B!important}
[class*="border-[#E8C766]"][class*="border-[#E8C766]"][class*="border-[#E8C766]"] p+p{color:#2F4A3E!important}
/* moving strip of payment methods: white frame */
.pt-strip.pt-strip.pt-strip{border-color:#FFFFFF!important}
.pt-strip .pt-chip.pt-chip.pt-chip{border-color:#FFFFFF!important}
/* yellow frame on every card, same yellow as the pricing card */
[class*="border-[#EADFC4]"]:not(.pt-bob):not(.pt-bob *){border-color:#E3B93C!important;border-width:2px!important}
/* check marks in the pricing list: gold so they show on dark green */
#pricing li svg,#pricing li svg *{stroke:#E3B93C!important;color:#E3B93C!important}

        .pt-stroke { stroke-dasharray: 1; stroke-dashoffset: 1; animation: pt-draw 0.9s ease-out 0.5s forwards; }
        .pt-stroke2 { animation-delay: 1.35s; }
        @keyframes pt-draw { to { stroke-dashoffset: 0; } }
        .pt-box { animation: pt-pulse 2.6s ease-in-out 2.2s infinite; }
        @keyframes pt-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(214,64,63,0), 0 10px 20px -14px rgba(214,64,63,0.55); }
          50% { box-shadow: 0 0 0 7px rgba(214,64,63,0.14), 0 10px 20px -14px rgba(214,64,63,0.55); }
        }
        .pt-wig { display: inline-block; transform-origin: 50% 90%; animation: pt-wig 2.6s ease-in-out 2.4s infinite; }
        @keyframes pt-wig { 0%, 14%, 100% { transform: rotate(0deg); } 4% { transform: rotate(-14deg); } 9% { transform: rotate(12deg); } }
        @media (prefers-reduced-motion: reduce) {
          .pt-stroke { animation: none; stroke-dashoffset: 0; }
          .pt-box, .pt-wig { animation: none; }
        }
      `}</style>
      <AppleBackdrop />

      <div className="relative z-10">
        {/* Navigation */}
        <header className="sticky top-0 z-40 px-3 pt-3">
          <div className={`mx-auto flex max-w-[1180px] items-center justify-between gap-3 px-4 py-1.5 sm:px-6 ${glass} rounded-full`}>
            <Logo tone="dark" size={30} />
            <nav aria-label="Main" className="hidden items-center gap-7 text-[15px] font-semibold text-[#064E3B]/85 md:flex">
              <a href="#features" className="hover:text-[#064E3B]">Features</a>
              <a href="#pricing" className="hover:text-[#064E3B]">Pricing</a>
              <a href="#about" className="hover:text-[#064E3B]">About</a>
              <a href="#faq" className="hover:text-[#064E3B]">FAQ</a>
            </nav>
            {SIGNUPS_OPEN ? (
              <div className="flex items-center gap-1.5">
                <Link href="/login" className="inline-flex min-h-11 items-center px-3 text-[15px] font-semibold text-[#064E3B]">
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex min-h-11 items-center rounded-full bg-[#064E3B] px-5 text-[15px] font-semibold text-[#FBFBFB]"
                >
                  Start free
                </Link>
              </div>
            ) : null}
          </div>
        </header>

        {/* Hero */}
        <section className="mx-auto grid max-w-[1180px] items-center gap-14 px-5 pb-20 pt-0 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:pt-20">
          <div className="flex min-w-0 flex-col items-center gap-6 text-center lg:items-start lg:text-left">
            <div className="flex min-h-[calc(100svh-76px)] w-full flex-col items-center justify-start gap-3 pt-3 lg:min-h-0 lg:items-start lg:justify-start lg:pt-0">
            <div className="relative flex w-full justify-center lg:justify-start">
              <div className="pt-rays" aria-hidden="true" />
              <div className="pt-badge">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-mark.png" alt="PayTree" />
              </div>
            </div>
            <h1 className="font-serif text-[clamp(38px,10vw,92px)] font-normal uppercase leading-[1.03] tracking-[0.01em] text-[#064E3B] [text-wrap:balance]">
              All your payment methods.
              <br />
              <span className="pt-onelink">In one link.</span>
              <style>{`
.pt-onelink{display:inline-block;white-space:nowrap;font-size:1.05em;line-height:1.05;margin-top:6px;color:#F2C94C;text-shadow:0 2px 3px rgba(0,0,0,.35);animation:pt-ol-glow 2.4s ease-in-out infinite}
@keyframes pt-ol-glow{0%,100%{text-shadow:0 2px 3px rgba(0,0,0,.35),0 0 0 rgba(242,201,76,0)}50%{text-shadow:0 2px 3px rgba(0,0,0,.35),0 0 12px rgba(242,201,76,.4)}}
@media (prefers-reduced-motion:reduce){.pt-onelink{animation:none}}
              `}</style>
            </h1>
            <div aria-hidden="true" className="h-[4px] rounded-full bg-[#F2C94C] w-[78%] max-w-[360px] lg:w-[300px]" />
            <p className="max-w-[560px] text-[22px] leading-[1.4] font-bold text-[#0B1F18] sm:text-[24px]">
              Make it easier &amp; faster for your customers to pay you.
            </p>
            <div aria-hidden="true" className="h-[4px] rounded-full bg-[#F2C94C] w-[62%] max-w-[300px] lg:w-[240px]" />
            <p className="max-w-[560px] text-[19px] leading-[1.45] font-extrabold text-[#064E3B] sm:text-[21px]">
              Share your page link. Display your QR code. <span className="text-[#9A6E1A]">Get paid your way.</span>
            </p>
            {/* Two compact tap-to-open boxes (plain class names so the dark theme above leaves them alone) */}
            <style>{`
.pt-hb.pt-hb.pt-hb{width:100%;max-width:318px;box-sizing:border-box;border:2.5px solid #E3B93C!important;border-radius:16px;box-shadow:0 10px 22px rgba(0,0,0,.35);text-align:left;background:#FAF5EA}
.pt-hb-apple.pt-hb-apple.pt-hb-apple{background:#FFFFFF}
.pt-hb summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:9px;padding:7px 12px;min-height:44px;-webkit-tap-highlight-color:transparent}
.pt-hb summary::-webkit-details-marker{display:none}
.pt-hb-ic{flex:none;width:24px;height:24px;color:#064E3B}
.pt-hb-ap{flex:none;font-size:23px;line-height:1}
.pt-hb-t{flex:1;font-weight:800;font-size:14.5px;line-height:1.2;color:#064E3B}
.pt-hb-t small{display:block;margin-top:2px;font-size:12px;font-weight:600;line-height:1.25;color:#2F4A3E}
.pt-hb-plus{flex:none;width:24px;height:24px;border-radius:9999px;background:#E3B93C;color:#17402F;font-weight:800;font-size:18px;display:flex;align-items:center;justify-content:center;transition:transform .2s}
.pt-hb[open] .pt-hb-plus{transform:rotate(45deg)}
.pt-hb-body{padding:0 12px 12px;font-size:13px;line-height:1.4;font-weight:600;color:#2F4A3E}
.pt-hb-body b{color:#064E3B}
.pt-hb-st{margin:0 0 8px;padding-left:18px}
.pt-hb-st li{margin-bottom:4px}
.pt-hb-go{display:block;margin-top:9px;text-align:center;background:#E3B93C;color:#17402F;font-weight:800;border-radius:9999px;padding:9px;text-decoration:none;font-size:14.5px}
            `}</style>
            <details className="pt-hb">
              <summary>
                <ShieldCheck className="pt-hb-ic" strokeWidth={2} aria-hidden="true" />
                <span className="pt-hb-t">PayTree never touches your money.</span>
                <span className="pt-hb-plus" aria-hidden="true">+</span>
              </summary>
              <div className="pt-hb-body">Clients pay you directly. We only link to your own accounts.</div>
            </details>
            <details className="pt-hb pt-hb-apple">
              <summary>
                <span aria-hidden="true" className="pt-wig pt-hb-ap">🍎</span>
                <span className="pt-hb-t">
                  Earn $0.25 per friend
                  <small>Free to join. An apple for every friend who subscribes</small>
                </span>
                <span className="pt-hb-plus" aria-hidden="true">+</span>
              </summary>
              <div className="pt-hb-body">
                <ol className="pt-hb-st">
                  <li><b>Sign up free</b> (7-day free trial, no credit card required). Your own invite link is ready in your dashboard.</li>
                  <li><b>Share it</b> with your friends. It keeps working until Dec 31, 2026, even if you don&apos;t subscribe.</li>
                  <li>Every friend who <b>subscribes</b> drops an apple in your basket, worth <b>$0.25</b>.</li>
                </ol>
                On Harvest Day, <b>Jan 1, 2027</b>, swap your apples for cash.
                {SIGNUPS_OPEN ? (
                  <Link href="/signup" className="pt-hb-go">
                    Start free
                  </Link>
                ) : null}
              </div>
            </details>
            {/* Moving strip of payment methods (full width on phones) */}
            <section
              aria-label="Supported payment methods"
              className="pt-strip -mx-5 w-[calc(100%+2.5rem)] self-center border-y-[1.5px] border-white bg-white/85 py-5 sm:-mx-6 sm:w-[calc(100%+3rem)] lg:mx-0 lg:w-full"
            >
              <div className="overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
                <ul className="pt-marquee flex w-max gap-3">
                  {[...METHODS, ...METHODS].map((m, i) => (
                    <li
                      key={`${m.id}-${i}`}
                      aria-hidden={i >= METHODS.length ? "true" : undefined}
                      className="pt-chip inline-flex min-h-11 items-center gap-2.5 rounded-full border-[1.5px] border-white/80 bg-white/70 px-5 text-[15px] font-semibold text-[#0B1F18]"
                    >
                      <MethodDot id={m.id} size={12} />
                      {m.name}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
            <div className="flex w-full flex-wrap justify-center gap-3 sm:w-auto lg:justify-start">
              <Cta variant="emerald" className="w-full shadow-[0_18px_40px_-18px_rgba(6,78,59,0.8)] sm:w-auto sm:min-w-[260px]">
                {`Try it free for ${TRIAL_DAYS} days`}
              </Cta>
            </div>
            <p className="text-[16px] font-bold text-[#064E3B]">No credit card required &middot; Then {PRICING.monthly.price}/month</p>
            </div>
          </div>

          <div id="example" className="flex scroll-mt-24 flex-col items-center gap-5">
            <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-[#2F4A3E]">Example</p>
            <PhoneExample />
          </div>
        </section>

        <main>
          {/* Features */}
          <section id="features" className="scroll-mt-24 px-5 py-20 sm:px-6">
            <div className="mx-auto flex max-w-[1180px] flex-col gap-10">
              <Reveal className="flex max-w-[640px] flex-col gap-3">
                <span className="text-sm font-bold tracking-[0.14em] text-[#9A6E1A]">WHY PAYTREE</span>
                <h2 className={headingClass}>Everything you need to get paid. Nothing you don&rsquo;t.</h2>
              </Reveal>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                {FEATURES.map(({ title, body, Icon, tint }, i) => (
                  <Reveal key={title} delay={i * 60}>
                    <div
                      className={`flex h-full flex-col gap-2 p-4 transition-transform duration-300 hover:-translate-y-1 motion-reduce:transition-none ${glass}`}
                    >
                      <span
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
                        style={{ backgroundColor: tint }}
                        aria-hidden="true"
                      >
                        <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
                      </span>
                      <h3 className="text-[18px] font-extrabold leading-tight text-[#0B1F18]">{title}</h3>
                      <p className="text-[16px] leading-snug font-semibold text-[#0F2419]">{body}</p>
                    </div>
                  </Reveal>
                ))}
                <Reveal className="col-span-2 lg:col-span-4" delay={FEATURES.length * 60}>
                  <div className={`flex items-start gap-4 border-[#E2C27A] p-5 ${glass}`}>
                    <span aria-hidden="true" className="text-[40px] leading-none">🍎</span>
                    <div className="flex flex-col gap-1">
                      <h3 className="text-[18px] font-extrabold leading-tight text-[#0B1F18]">Apple basket</h3>
                      <p className="text-[16px] leading-snug font-semibold text-[#0F2419]">
                        Share your link. Every friend who joins PayTree and pays drops an apple in your basket, worth $0.25. On January 1, 2027, we buy all your apples and pay you.
                      </p>
                    </div>
                  </div>
                </Reveal>
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section id="pricing" className="scroll-mt-24 px-5 pb-20 sm:px-6">
            <div className="mx-auto flex max-w-[1000px] flex-col items-center gap-8">
              <Reveal className="flex max-w-[640px] flex-col items-center gap-3 text-center">
                <span className="text-sm font-bold tracking-[0.14em] text-[#9A6E1A]">PRICING</span>
                <h2 className={headingClass}>Try everything free for {TRIAL_DAYS} days</h2>
                <p className="text-[21px] font-semibold text-[#0F2419]">No card needed. One simple plan with every feature after that.</p>
              </Reveal>
              <Reveal className="w-full">
                <Pricing />
              </Reveal>
            </div>
          </section>

          {/* About */}
          <section id="about" className="scroll-mt-24 px-5 pb-20 sm:px-6">
            <Reveal className={`mx-auto flex max-w-[860px] flex-col gap-4 p-7 sm:p-12 ${glass}`}>
              <span className="text-sm font-bold tracking-[0.14em] text-[#9A6E1A]">ABOUT US</span>
              <h2 className={headingClass}>Built for the question every business hears</h2>
              <p className="text-[21px] leading-[1.75] font-semibold text-[#0F2419]">
                <em>&ldquo;Do you take Zelle, Venmo or Cash App?&rdquo;</em> PayTree answers it with one simple link.
                We built a calm, elegant page that brings all your payment methods together, so your customers can
                pay you in seconds, and you can focus on your work.
              </p>
              <p className="text-[21px] leading-[1.75] font-semibold text-[#0F2419]">
                <strong className="text-[#064E3B]">We never touch your money.</strong> Payments go straight from
                your customers to your own accounts. Our mission is simple: make getting paid effortless for
                businesses and professionals everywhere.
              </p>
            </Reveal>
          </section>

          {/* FAQ */}
          <section id="faq" className="scroll-mt-24 px-5 pb-20 sm:px-6">
            <div className="mx-auto flex max-w-[860px] flex-col gap-6">
              <Reveal>
                <h2 className={headingClass}>Questions, answered</h2>
              </Reveal>
              <div className="flex flex-col gap-3">
                {FAQ.map(({ q, a }) => (
                  <Reveal key={q}>
                    <details className={`group px-6 py-1 ${glass} rounded-[22px]`}>
                      <summary className="flex min-h-[60px] cursor-pointer list-none items-center justify-between gap-4 text-[19px] font-bold text-[#064E3B] [&::-webkit-details-marker]:hidden">
                        {q}
                        <span
                          aria-hidden="true"
                          className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[#064E3B] text-lg leading-none text-[#FBFBFB] transition-transform group-open:rotate-45"
                        >
                          +
                        </span>
                      </summary>
                      <p className="pb-5 text-[19px] leading-[1.7] font-semibold text-[#0F2419]">{a}</p>
                    </details>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          {/* Final call to action */}
          <section id="signup" className="px-5 pb-16 sm:px-6">
            <Reveal className="relative mx-auto max-w-[1180px] overflow-hidden rounded-[36px] border-2 border-[#E2C27A] bg-gradient-to-br from-white via-[#FBF3DF] to-[#F4E3B8] px-7 py-14 text-[#064E3B] shadow-[0_40px_80px_-40px_rgba(154,110,26,0.55)] sm:px-14">
              <div className="relative z-10 flex flex-col items-start gap-5">
                <h2 className="font-serif text-[clamp(36px,5vw,64px)] font-normal leading-[1.05] [text-wrap:balance]">
                  Ready to get paid?
                </h2>
                <p className="max-w-[520px] text-[21px] font-semibold text-[#0F2419]">
                  Build your payment page in two minutes. {TRIAL_DAYS} days free, no card needed.
                </p>
                <Cta variant="emerald" className="min-w-[260px] shadow-[0_18px_40px_-18px_rgba(6,78,59,0.8)]">
                  {trialCta}
                </Cta>
              </div>
              <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-[#E5484D]/15 blur-3xl" />
              <span aria-hidden="true" className="pointer-events-none absolute -bottom-16 right-24 h-64 w-64 rounded-full bg-[#7BC86C]/25 blur-3xl" />
            </Reveal>
          </section>
        </main>

        <footer className="px-5 pb-10 sm:px-6">
          <div className={`mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-4 px-6 py-5 text-[15px] font-semibold text-[#0F2419] ${glass}`}>
            <span>&copy; {new Date().getFullYear()} PayTree. All rights reserved.</span>
            <nav aria-label="Legal" className="flex flex-wrap gap-6">
              <a href="#about" className="inline-flex min-h-11 items-center hover:text-[#064E3B]">About</a>
              <Link href="/terms" className="inline-flex min-h-11 items-center hover:text-[#064E3B]">Terms</Link>
              <Link href="/privacy" className="inline-flex min-h-11 items-center hover:text-[#064E3B]">Privacy</Link>
            </nav>
          </div>
        </footer>
      </div>
    </div>
  );
}
