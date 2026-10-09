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
  "rounded-[28px] border border-white/70 bg-white/55 shadow-[0_24px_60px_-34px_rgba(6,78,59,0.45)] backdrop-blur-xl";

const headingClass =
  "font-serif text-[clamp(34px,4.6vw,56px)] font-normal leading-[1.08] tracking-[-0.01em] text-[#064E3B] [text-wrap:balance]";

const goldText =
  "pt-shine bg-gradient-to-r from-[#86600F] via-[#B8893A] to-[#86600F] bg-clip-text text-transparent";

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

const PHONE =
  "pt-bob w-full overflow-hidden rounded-[30px] border-[7px] border-[#0B1F18] bg-[#FAF5EA] shadow-[0_30px_60px_-28px_rgba(6,78,59,0.6)]";

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
          style={{ animationDuration: "7s" }}
        >
          <div className="relative flex flex-col items-center gap-0.5 overflow-hidden bg-gradient-to-b from-[#E6F2EA] to-[#FAF5EA] px-2 pb-2.5 pt-4 text-center text-[#064E3B]">
            <AppleHalo compact />
            <span className="relative mb-0.5">
              <ExampleAvatar size={50} />
            </span>
            <span className="relative font-serif text-[21px] leading-tight text-[#053D2E]">Cedar Coffee Co.</span>
            <span className="relative text-[11.5px] font-semibold text-[#1A3326]">{SITE_HOST}/cedarcoffee</span>
          </div>
          <div className="flex flex-col gap-1.5 p-2">
            {EXAMPLE.map(({ id, name, detail, Icon, copy }) => {
              const c = badgeColor(id);
              const Action = copy ? Copy : ArrowUpRight;
              return (
                <div key={id} className="flex items-center gap-1.5 rounded-[9px] border border-[#DCE5DF] bg-white px-2 py-1.5">
                  <span
                    className="flex h-5 w-5 flex-none items-center justify-center rounded-full"
                    style={{ backgroundColor: c.bg, color: c.fg }}
                  >
                    <Icon className="h-2.5 w-2.5" strokeWidth={2.4} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10.5px] font-bold leading-tight">{name}</span>
                    <span className="block truncate text-[9px] text-[#4B6358]">{detail}</span>
                  </span>
                  <Action className="h-2.5 w-2.5 flex-none text-[#064E3B]" />
                </div>
              );
            })}
            <div className="flex items-center gap-1.5 rounded-[10px] border border-[#CFE3D6] bg-[#E6F2EA] px-2 py-1.5 text-[#064E3B]">
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
                <span className="mt-0.5 block text-[14px] font-medium leading-snug text-[#0F2419]">{step.body}</span>
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
    <div className="relative min-h-screen overflow-x-clip bg-[#FAF5EA] text-[19px] leading-[1.6] text-[#0B1F18]">
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
                  className="inline-flex min-h-11 items-center rounded-full bg-[#0B6B50] px-5 text-[15px] font-semibold text-[#FBFBFB]"
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
            <div className="flex min-h-[calc(100svh-76px)] w-full flex-col items-center justify-center gap-6 lg:min-h-0 lg:items-start lg:justify-start">
            <h1 className="font-serif text-[clamp(46px,11vw,92px)] font-normal uppercase leading-[1.03] tracking-[0.01em] text-[#0B6B50] [-webkit-text-stroke:1.5px_#0B6B50] [text-wrap:balance]">
              All your payment methods.
              <br />
              <span className="text-[#D2343B] [-webkit-text-stroke:1.5px_#D2343B]">In one link.</span>
            </h1>
            <p className="max-w-[560px] text-[21px] leading-[1.65] font-medium text-[#0F2419] sm:text-[22px]">
              Make it easier and faster for your customers to pay you.
            </p>
            <div className="flex w-full flex-wrap justify-center gap-3 sm:w-auto lg:justify-start">
              <Cta variant="emerald" className="w-full shadow-[0_18px_40px_-18px_rgba(6,78,59,0.8)] sm:w-auto sm:min-w-[260px]">
                {trialCta}
              </Cta>
            </div>
            <p className="text-[16px] font-bold text-[#064E3B]">No credit card required.</p>
            </div>
            <div className="flex flex-col items-center gap-4 pt-2 lg:items-start lg:pt-0">
              <p className="inline-flex items-center gap-2 rounded-full bg-[#E3F0EA] px-4 py-2 text-[15px] font-semibold text-[#064E3B]">
                <ShieldCheck className="h-4 w-4 flex-none" aria-hidden="true" />
                We never touch your money. Customers pay you directly.
              </p>
            </div>
            <ul aria-label="Included" className="flex flex-wrap justify-center gap-2 lg:justify-start">
              {[
                { label: "Your link", Icon: Link2 },
                { label: "QR code", Icon: QrCode },
                { label: "Invoices", Icon: ReceiptText },
                { label: "& more inside", Icon: null },
              ].map(({ label, Icon }) => (
                <li key={label} className={`inline-flex min-h-9 items-center gap-1.5 px-3 text-[13px] font-semibold text-[#064E3B] sm:min-h-10 sm:px-4 sm:text-[15px] ${glass} rounded-full`}>
                  {Icon ? <Icon className="h-4 w-4 text-[#9A6E1A]" aria-hidden="true" /> : null}
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <div id="example" className="flex scroll-mt-24 flex-col items-center gap-5">
            <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-[#4B6358]">Example</p>
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
                      <p className="text-[16px] leading-snug font-medium text-[#0F2419]">{body}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section id="pricing" className="scroll-mt-24 px-5 pb-20 sm:px-6">
            <div className="mx-auto flex max-w-[1000px] flex-col items-center gap-8">
              <Reveal className="flex max-w-[640px] flex-col items-center gap-3 text-center">
                <span className="text-sm font-bold tracking-[0.14em] text-[#9A6E1A]">PRICING</span>
                <h2 className={headingClass}>Try everything free for {TRIAL_DAYS} days</h2>
                <p className="text-[21px] font-medium text-[#0F2419]">No card needed. One simple plan with every feature after that.</p>
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
              <p className="text-[21px] leading-[1.75] font-medium text-[#0F2419]">
                <em>&ldquo;Do you take Zelle, Venmo or Cash App?&rdquo;</em> PayTree answers it with one simple link.
                We built a calm, elegant page that brings all your payment methods together, so your customers can
                pay you in seconds, and you can focus on your work.
              </p>
              <p className="text-[21px] leading-[1.75] font-medium text-[#0F2419]">
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
                      <p className="pb-5 text-[19px] leading-[1.7] font-medium text-[#0F2419]">{a}</p>
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
                <p className="max-w-[520px] text-[21px] font-medium text-[#0F2419]">
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
          <div className={`mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-4 px-6 py-5 text-[15px] font-medium text-[#0F2419] ${glass}`}>
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
