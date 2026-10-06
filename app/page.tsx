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
  Link2,
  Mail,
  QrCode,
  ShieldCheck,
  Smartphone,
  ClipboardCheck,
  Wallet,
  Pizza,
  Clapperboard,
  HandCoins,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { Apple, AppleBackdrop, AppleHalo } from "@/components/marketing/apples";
import { Cta } from "@/components/marketing/cta";
import { ExampleAvatar } from "@/components/marketing/example-avatar";
import { ExampleQr } from "@/components/marketing/example-qr";
import { Pricing } from "@/components/marketing/pricing";
import { Reveal } from "@/components/marketing/reveal";
import { badgeColor } from "@/lib/payment-colors";
import { PRICING, SIGNUPS_OPEN, SITE_HOST, SITE_URL, TRIAL_DAYS } from "@/lib/site";

const glass =
  "rounded-[28px] border border-white/70 bg-white/55 shadow-[0_24px_60px_-34px_rgba(6,78,59,0.45)] backdrop-blur-xl";

const headingClass =
  "font-serif text-[clamp(34px,4.6vw,56px)] font-normal leading-[1.08] tracking-[-0.01em] text-[#064E3B] [text-wrap:balance]";

const goldText =
  "pt-shine bg-gradient-to-r from-[#9A6E1A] via-[#C9A048] to-[#9A6E1A] bg-clip-text text-transparent";

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

const FEATURES: { title: string; body: string; Icon: LucideIcon; tint: string; apple?: boolean }[] = [
  { title: "Split the bill", body: "Dinner or a trip: everyone sees their share and pays you.", Icon: Pizza, tint: "#E5484D", apple: true },
  { title: "Pay me here", body: "A ready card for Stories, plus a video with music for TikTok and Reels.", Icon: Clapperboard, tint: "#3FA34D", apple: true },
  { title: "Tip me", body: "Creators and musicians: turn your page into a tip jar.", Icon: HandCoins, tint: "#E8AE1C", apple: true },
  { title: "One link", body: "Cash App, Venmo, Zelle, PayPal and more in one place.", Icon: Link2, tint: "#E5484D" },
  { title: "Your QR code", body: "For your counter, booth or business card.", Icon: QrCode, tint: "#064E3B" },
  { title: "Payment log", body: "Confirm payments and see daily and monthly totals.", Icon: ClipboardCheck, tint: "#6D1ED4" },
  { title: "Private stats", body: "Visits and taps. No cookies, no tracking.", Icon: BarChart3, tint: "#7BC86C" },
  { title: "Paid to you", body: "Money goes straight to your accounts.", Icon: ShieldCheck, tint: "#008CFF" },
];

/** Title in the apple colors: first letter of each word red, the rest green and yellow. */
function AppleTitle({ text }: { text: string }) {
  const others = ["#3FA34D", "#E8AE1C"];
  let n = 0;
  let wordStart = true;
  return (
    <>
      {Array.from(text).map((ch, i) => {
        if (ch === " ") {
          wordStart = true;
          return " ";
        }
        const color = wordStart ? "#E5484D" : others[n++ % others.length];
        wordStart = false;
        return (
          <span key={i} style={{ color }}>
            {ch}
          </span>
        );
      })}
    </>
  );
}

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
    a: `You get ${TRIAL_DAYS} days with every feature, and no card is needed to start. If you choose to continue, it is ${PRICING.monthly.price} a month or ${PRICING.annual.price} a year.`,
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
    q: "What is the apple basket?",
    a: "Every PayTree page has its own referral link. When someone joins through it and subscribes, you earn an apple: $3 for a yearly member, $0.50 for a monthly member. On January 1, 2027, PayTree buys your apples and pays you.",
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

const PHONE =
  "pt-bob w-full overflow-hidden rounded-[30px] border-[7px] border-[#0B1F18] bg-[#FAF5EA] shadow-[0_30px_60px_-28px_rgba(6,78,59,0.6)]";

/** Two small phones side by side: a payment page and its statistics. */
function PhoneExample() {
  return (
    <div className="mx-auto flex w-full max-w-[460px] items-start justify-center gap-3">
      {/* Phone 1: the public payment page */}
      <div className="w-1/2 max-w-[220px]">
        <div
          role="img"
          aria-label="Example PayTree page for Cedar Coffee Co. with Cash App, Venmo, Zelle, Apple Cash and a QR code"
          className={PHONE}
          style={{ animationDuration: "7s" }}
        >
          <div className="relative flex flex-col items-center gap-0.5 overflow-hidden bg-gradient-to-b from-[#E6F2EA] to-[#FAF5EA] px-2 pb-2.5 pt-4 text-center text-[#064E3B]">
            <AppleHalo compact />
            <span className="relative mb-0.5">
              <ExampleAvatar size={40} />
            </span>
            <span className="relative font-serif text-[17px] leading-tight">Cedar Coffee Co.</span>
            <span className="relative text-[10.5px] text-[#4B6358]">{SITE_HOST}/cedarcoffee</span>
          </div>
          <div className="flex flex-col gap-1.5 p-2">
            {EXAMPLE.map(({ id, name, detail, Icon, copy }) => {
              const c = badgeColor(id);
              const Action = copy ? Copy : ArrowUpRight;
              return (
                <div key={id} className="flex items-center gap-1.5 rounded-[10px] border border-[#DCE5DF] bg-white px-2 py-2">
                  <span
                    className="flex h-6 w-6 flex-none items-center justify-center rounded-full"
                    style={{ backgroundColor: c.bg, color: c.fg }}
                  >
                    <Icon className="h-3 w-3" strokeWidth={2.4} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12px] font-bold leading-tight">{name}</span>
                    <span className="block truncate text-[10px] text-[#4B6358]">{detail}</span>
                  </span>
                  <Action className="h-3 w-3 flex-none text-[#064E3B]" />
                </div>
              );
            })}
            <div className="flex items-center gap-1.5 rounded-[10px] border border-[#CFE3D6] bg-[#E6F2EA] px-2 py-1.5 text-[#064E3B]">
              <ExampleQr url={SITE_URL} size={30} />
              <span className="text-[12px] font-semibold">Scan to pay</span>
            </div>
          </div>
        </div>
        <p className="mt-2 text-center text-[12px] font-semibold text-[#2F4A3E]">Your page</p>
      </div>

      {/* Next to the phone: the three standout features, stacked */}
      <div className="flex w-1/2 max-w-[220px] flex-col gap-2.5 self-center">
        {FEATURES.filter((f) => f.apple).map(({ title, body, Icon, tint }) => (
          <div key={title} className={`flex flex-col gap-1 p-3 ring-2 ring-[#E2C27A]/70 ${glass}`}>
            <span className="flex items-center gap-2">
              <span
                className="flex h-7 w-7 flex-none items-center justify-center rounded-lg text-white"
                style={{ backgroundColor: tint }}
                aria-hidden="true"
              >
                <Icon className="h-4 w-4" strokeWidth={2.2} />
              </span>
              <span className="text-[17px] font-extrabold leading-tight">
                <AppleTitle text={title} />
              </span>
            </span>
            <span className="text-[14px] leading-snug text-[#1F362B]">{body}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const trialCta = `Start your ${TRIAL_DAYS}-day free trial`;

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#FAF5EA] text-[17px] leading-[1.6] text-[#0B1F18]">
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
        <section className="mx-auto grid max-w-[1180px] items-center gap-14 px-5 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:pt-20">
          <div className="flex min-w-0 flex-col items-start gap-6">
            <span className={`inline-flex items-center gap-2 px-4 py-2 text-[14px] font-bold tracking-[0.08em] text-[#064E3B] ${glass} rounded-full`}>
              <span className="h-2 w-2 rounded-full bg-[#7BC86C]" aria-hidden="true" />
              {TRIAL_DAYS} DAYS FREE · NO CARD NEEDED
            </span>
            <h1 className="font-serif text-[clamp(38px,6vw,76px)] font-normal uppercase leading-[1.03] tracking-[-0.01em] text-[#064E3B] [text-wrap:balance]">
              All your payment methods.
              <br />
              <span className={goldText}>One simple link.</span>
            </h1>
            <p className="max-w-[560px] text-[19px] leading-[1.65] text-[#1F362B] sm:text-xl">
              Make it easier and faster for your customers to pay you.
            </p>
            <ul aria-label="Included" className="flex flex-wrap gap-2">
              {[
                { label: "Your link", Icon: Link2 },
                { label: "QR code", Icon: QrCode },
                { label: "Statistics", Icon: BarChart3 },
              ].map(({ label, Icon }) => (
                <li key={label} className={`inline-flex min-h-9 items-center gap-1.5 px-3 text-[13px] font-semibold text-[#064E3B] sm:min-h-10 sm:px-4 sm:text-[15px] ${glass} rounded-full`}>
                  <Icon className="h-4 w-4 text-[#9A6E1A]" aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>
            <div className="flex w-full flex-wrap gap-3 sm:w-auto">
              <Cta variant="emerald" className="w-full shadow-[0_18px_40px_-18px_rgba(6,78,59,0.8)] sm:w-auto sm:min-w-[260px]">
                {trialCta}
              </Cta>
              <a
                href="#example"
                className={`inline-flex min-h-[52px] w-full items-center justify-center px-7 font-semibold text-[#064E3B] sm:w-auto ${glass} rounded-full`}
              >
                See an example
              </a>
            </div>
            <p className="text-[15px] font-medium text-[#2F4A3E]">
              Then {PRICING.monthly.price}/month or {PRICING.annual.price}/year. Cancel any time.
            </p>
          </div>

          <div id="example" className="scroll-mt-24">
            <PhoneExample />
          </div>
        </section>

        {/* Moving strip of payment methods */}
        <section aria-label="Supported payment methods" className="border-y border-white/70 bg-white/40 py-5 backdrop-blur-md">
          <div className="overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
            <ul className="pt-marquee flex w-max gap-3">
              {[...METHODS, ...METHODS].map((m, i) => (
                <li
                  key={`${m.id}-${i}`}
                  aria-hidden={i >= METHODS.length ? "true" : undefined}
                  className="inline-flex min-h-11 items-center gap-2.5 rounded-full border border-white/80 bg-white/70 px-5 text-[15px] font-semibold text-[#0B1F18]"
                >
                  <MethodDot id={m.id} size={12} />
                  {m.name}
                </li>
              ))}
            </ul>
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
                {FEATURES.filter((f) => !f.apple).map(({ title, body, Icon, tint, apple }, i) => (
                  <Reveal key={title} delay={i * 60} className={i === 4 ? "col-span-2 lg:col-span-1" : ""}>
                    <div
                      className={`flex h-full flex-col gap-2 p-4 transition-transform duration-300 hover:-translate-y-1 motion-reduce:transition-none ${glass} ${
                        apple ? "ring-2 ring-[#E2C27A]/70" : ""
                      }`}
                    >
                      <span
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
                        style={{ backgroundColor: tint }}
                        aria-hidden="true"
                      >
                        <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
                      </span>
                      <h3 className={`font-extrabold leading-tight ${apple ? "text-[18px]" : "text-[16px]"}`}>
                        {apple ? <AppleTitle text={title} /> : title}
                      </h3>
                      <p className="text-[14px] leading-snug text-[#1F362B]">{body}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          {/* Steps */}
          <section id="how" className="px-5 pb-20 sm:px-6">
            <Reveal className={`mx-auto max-w-[1180px] p-6 sm:p-10 ${glass}`}>
              <h2 className={headingClass}>Ready in 3 steps</h2>
              <ol className="mt-6 grid grid-cols-3 gap-3 sm:gap-8">
                {STEPS.map((s) => (
                  <li key={s.n} className="flex min-w-0 flex-col gap-1.5 border-t-2 border-[#064E3B] pt-3">
                    <span aria-hidden="true" className={`font-serif text-[34px] leading-none sm:text-[48px] ${goldText}`}>
                      {s.n}
                    </span>
                    <h3 className="text-[16px] font-bold leading-tight sm:text-xl">{s.title}</h3>
                    <p className="text-[14px] leading-snug text-[#1F362B] sm:text-[17px]">{s.body}</p>
                  </li>
                ))}
              </ol>
            </Reveal>
          </section>

          {/* Apple basket (referral offer) */}
          <section id="apples" className="scroll-mt-24 px-5 pb-20 sm:px-6">
            <Reveal className="mx-auto flex max-w-[1180px] flex-col gap-6 rounded-[32px] border-2 border-[#E2C27A] bg-gradient-to-br from-white/85 via-[#FBF3DF]/85 to-[#F4E3B8]/85 p-6 backdrop-blur-xl sm:flex-row sm:items-center sm:gap-10 sm:p-10">
              <div className="flex flex-col gap-3 sm:flex-1">
                <span className="text-sm font-bold tracking-[0.14em] text-[#9A6E1A]">EARN APPLES 🧺</span>
                <h2 className={headingClass}>Every PayTree page comes with a referral link.</h2>
                <p className="text-[19px] leading-[1.65] text-[#1F362B]">
                  Share your link, or let your page do it for you: every page has a &ldquo;Get your own payment page&rdquo;
                  link that counts as yours. When someone joins PayTree through it, an apple drops in your basket.
                  On January 1, 2027, PayTree buys your apples.
                </p>
                <p className="text-[14px] text-[#2F4A3E]">Launch offer for new members who join by December 31, 2026.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:w-[340px]">
                <div className="flex flex-col items-center gap-1 rounded-[22px] bg-white/85 p-4 text-center">
                  <Apple color="red" size={52} />
                  <span className="font-serif text-[30px] leading-none text-[#064E3B]">$3.00</span>
                  <span className="text-[13px] font-semibold text-[#2F4A3E]">for each yearly member</span>
                </div>
                <div className="flex flex-col items-center gap-1 rounded-[22px] bg-white/85 p-4 text-center">
                  <Apple color="green" size={44} />
                  <span className="font-serif text-[30px] leading-none text-[#064E3B]">$0.50</span>
                  <span className="text-[13px] font-semibold text-[#2F4A3E]">for each monthly member</span>
                </div>
              </div>
            </Reveal>
          </section>

          {/* Pricing */}
          <section id="pricing" className="scroll-mt-24 px-5 pb-20 sm:px-6">
            <div className="mx-auto flex max-w-[1000px] flex-col items-center gap-8">
              <Reveal className="flex max-w-[640px] flex-col items-center gap-3 text-center">
                <span className="text-sm font-bold tracking-[0.14em] text-[#9A6E1A]">PRICING</span>
                <h2 className={headingClass}>Try everything free for {TRIAL_DAYS} days</h2>
                <p className="text-[19px] text-[#1F362B]">No card needed. One simple plan with every feature after that.</p>
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
              <p className="text-[19px] leading-[1.75] text-[#1F362B]">
                <em>&ldquo;Do you take Zelle, Venmo or Cash App?&rdquo;</em> PayTree answers it with one simple link.
                We built a calm, elegant page that brings all your payment methods together, so your customers can
                pay you in seconds, and you can focus on your work.
              </p>
              <p className="text-[19px] leading-[1.75] text-[#1F362B]">
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
                      <summary className="flex min-h-[60px] cursor-pointer list-none items-center justify-between gap-4 text-[18px] font-bold text-[#064E3B] [&::-webkit-details-marker]:hidden">
                        {q}
                        <span
                          aria-hidden="true"
                          className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[#064E3B] text-lg leading-none text-[#FBFBFB] transition-transform group-open:rotate-45"
                        >
                          +
                        </span>
                      </summary>
                      <p className="pb-5 text-[17px] leading-[1.7] text-[#1F362B]">{a}</p>
                    </details>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          {/* Final call to action */}
          <section id="signup" className="px-5 pb-16 sm:px-6">
            <Reveal className="relative mx-auto max-w-[1180px] overflow-hidden rounded-[36px] border-2 border-[#E2C27A] bg-gradient-to-br from-white/85 via-[#FBF3DF]/85 to-[#F4E3B8]/85 px-7 py-14 text-[#064E3B] shadow-[0_40px_80px_-40px_rgba(154,110,26,0.55)] backdrop-blur-xl sm:px-14">
              <div className="relative z-10 flex flex-col items-start gap-5">
                <h2 className="font-serif text-[clamp(36px,5vw,64px)] font-normal leading-[1.05] [text-wrap:balance]">
                  Ready to get paid?
                </h2>
                <p className="max-w-[520px] text-[19px] text-[#1F362B]">
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
          <div className={`mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-4 px-6 py-5 text-[15px] text-[#1F362B] ${glass}`}>
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
