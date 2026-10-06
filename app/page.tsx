// app/page.tsx  ->  paytree.to
//
// Marketing homepage. A faithful port of the approved landing-page design,
// with the copy kept to what PayTree actually does (it displays payment
// methods; it never receives or moves a visitor's money).

import Link from "next/link";

import { ArrowUpRight, Copy, DollarSign, Mail, Smartphone, Wallet } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { ExampleAvatar } from "@/components/marketing/example-avatar";
import { ExampleQr } from "@/components/marketing/example-qr";
import { Cta } from "@/components/marketing/cta";
import { Pricing } from "@/components/marketing/pricing";
import { badgeColor } from "@/lib/payment-colors";
import { FREE_METHOD_LIMIT, PRICING, SIGNUPS_OPEN, SITE_HOST, SITE_URL } from "@/lib/site";

const FEATURES: { title: string; body: string; icon: string }[] = [
  {
    title: "Every app, one link",
    body: "Cash App, Venmo, Zelle, PayPal, Apple Cash and more.",
    icon: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1 M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  },
  {
    title: "Scan to pay",
    body: "Print your QR code. Clients scan and pay in seconds.",
    icon: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h3v3h-3z M20 14v.01 M14 20h.01 M17.5 20.5H21v-3",
  },
  {
    title: "Paid directly to you",
    body: "Money goes straight to your accounts. We never touch it.",
    icon: "M12 3l7 3v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6z M9 12l2 2 4-4",
  },
];

const STEPS: { n: string; title: string; body: string }[] = [
  { n: "1", title: "Sign up", body: "Pick your link name." },
  { n: "2", title: "Add your apps", body: "Cash App, Venmo, Zelle and more." },
  { n: "3", title: "Share", body: "Send your link or show your QR code." },
];

const EXAMPLE = [
  { id: "cashapp", name: "Cash App", detail: "$cedarcoffee", Icon: DollarSign, copy: false },
  { id: "venmo", name: "Venmo", detail: "@cedar-coffee-co", Icon: Wallet, copy: false },
  { id: "zelle", name: "Zelle", detail: "pay@cedarcoffee.co", Icon: Mail, copy: true },
  { id: "applecash", name: "Apple Cash", detail: "(555) 010-0142", Icon: Smartphone, copy: true },
] as const;

/** Where the example's QR code leads. Change to a real example page when there is one. */
const EXAMPLE_URL = SITE_URL;

const headingClass =
  "font-serif text-[clamp(36px,4.4vw,56px)] font-normal leading-[1.08] tracking-[-0.02em] text-[#064E3B] [text-wrap:balance]";

export default function HomePage() {
  return (
    <div className="bg-[#FBFBFB] text-base leading-[1.6] text-[#0B1F18]">
      {/* Hero and navigation */}
      <header className="bg-[#064E3B] text-[#FBFBFB]">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-6 pt-[22px]">
          <Logo />
          <nav aria-label="Main navigation" className="hidden items-center gap-7 md:flex">
            <a href="#features" className="text-[#FBFBFB]/85 hover:text-[#FBFBFB]">
              Features
            </a>
            <a href="#how" className="text-[#FBFBFB]/85 hover:text-[#FBFBFB]">
              How it works
            </a>
            <a href="#pricing" className="text-[#FBFBFB]/85 hover:text-[#FBFBFB]">
              Pricing
            </a>
          </nav>
          {SIGNUPS_OPEN ? (
            <div className="flex items-center gap-[18px]">
              <Link href="/login" className="inline-flex min-h-11 items-center font-semibold text-[#FBFBFB]/90">
                Log in
              </Link>
              <Link
                href="/signup"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#FBFBFB] px-6 font-semibold text-[#064E3B]"
              >
                Sign up
              </Link>
            </div>
          ) : null}
        </div>

        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-14 px-6 pb-[104px] pt-16">
          <div className="flex min-w-0 max-w-[720px] flex-col items-start gap-7">
            <h1 className="font-serif text-[clamp(38px,5.4vw,72px)] font-normal uppercase leading-[1.06] tracking-[-0.01em] [text-wrap:balance]">
              All your payment methods.
              <br />
              <span className="text-[#D9B873]">One simple link.</span>
            </h1>
            <p className="max-w-[520px] text-lg leading-[1.75] text-[#FBFBFB]/85">
              Make it easier and faster for your customers to pay you.
            </p>
            <ul aria-label="Included" className="flex flex-wrap gap-2.5">
              <li className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#D9B873]/60 px-4 text-[15px] font-semibold text-[#FBFBFB]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D9B873" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1 M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
                </svg>
                Link
              </li>
              <li className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#D9B873]/60 px-4 text-[15px] font-semibold text-[#FBFBFB]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D9B873" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h3v3h-3z M20 14v.01 M14 20h.01 M17.5 20.5H21v-3" />
                </svg>
                QR code
              </li>
            </ul>
            <div className="flex flex-wrap gap-3.5">
              <Cta variant="gold" className="min-w-[200px]">
                Create your payment page
              </Cta>
              <a
                href="#pricing"
                className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-[#FBFBFB]/50 px-[30px] font-semibold text-[#FBFBFB]"
              >
                View pricing
              </a>
            </div>
            <a
              href="#example"
              className="inline-flex min-h-11 items-center gap-2 text-[15px] font-semibold text-[#D9B873] underline-offset-4 hover:underline"
            >
              See an example
              <span aria-hidden="true">↓</span>
            </a>
          </div>

        </div>
      </header>

      <main>
        {/* Example page, shown in a phone */}
        <section id="example" className="scroll-mt-4 pt-20">
          <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-8 px-6">
            <h2 className={`text-center ${headingClass}`}>What your clients see</h2>
            <div
              role="img"
              aria-label="Example PayTree page for Cedar Coffee Co. on a phone, with Cash App, Venmo, Zelle, Apple Cash and a QR code"
              className="w-full max-w-[320px] overflow-hidden rounded-[44px] border-[10px] border-[#0B1F18] bg-[#FBFBFB] shadow-[0_40px_80px_-40px_rgba(6,78,59,0.55)]"
            >
              <div className="flex flex-col items-center gap-1 bg-[#064E3B] px-4 pb-4 pt-6 text-center text-[#FBFBFB]">
                <span className="mb-1">
                  <ExampleAvatar size={56} />
                </span>
                <span className="font-serif text-[22px] leading-tight">Cedar Coffee Co.</span>
                <span className="text-[11px] text-[#FBFBFB]/75">{SITE_HOST}/cedarcoffee</span>
                <span className="mt-1 text-[12px] text-[#FBFBFB]/90">Specialty coffee and fresh pastries.</span>
              </div>
              <div className="flex flex-col gap-2 p-3.5">
                {EXAMPLE.map(({ id, name, detail, Icon, copy }) => {
                  const color = badgeColor(id);
                  const Action = copy ? Copy : ArrowUpRight;
                  return (
                    <div
                      key={id}
                      className="flex items-center gap-2.5 rounded-[14px] border border-[#DCE5DF] bg-white px-3 py-2.5"
                    >
                      <span
                        className="flex h-8 w-8 flex-none items-center justify-center rounded-full"
                        style={{ backgroundColor: color.bg, color: color.fg }}
                      >
                        <Icon className="h-4 w-4" strokeWidth={2} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-bold leading-tight">{name}</span>
                        <span className="block truncate text-[11px] text-[#4B6358]">{detail}</span>
                      </span>
                      <Action className="h-4 w-4 flex-none text-[#064E3B]" />
                    </div>
                  );
                })}
                <div className="mt-1 flex items-center gap-3 rounded-[14px] bg-[#064E3B] px-3 py-2.5 text-[#FBFBFB]">
                  <ExampleQr url={EXAMPLE_URL} />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold">Scan to pay</span>
                    <span className="block text-[11px] text-[#FBFBFB]/75">Point your camera here</span>
                  </span>
                </div>
              </div>
            </div>
            <p className="text-sm text-[#4B6358]">Example page with demo details.</p>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="pb-24 pt-[104px]">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-14 px-6">
            <div className="flex max-w-[640px] flex-col gap-3.5">
              <h2 className={headingClass}>Why PayTree</h2>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-5">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="flex flex-col gap-4 rounded-[20px] border border-[#DCE5DF] bg-white p-[30px]"
                >
                  <span className="flex h-[50px] w-[50px] items-center justify-center rounded-[14px] bg-[#E3F0EA]">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#064E3B"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d={f.icon} />
                    </svg>
                  </span>
                  <h3 className="text-[19px] font-bold">{f.title}</h3>
                  <p className="text-[#4B6358]">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works: three compact steps side by side, also on phones */}
        <section id="how" className="bg-[#E9F1ED] py-12 sm:py-16">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-7 px-5 sm:px-6">
            <h2 className={headingClass}>Ready in 3 steps</h2>
            <ol className="grid grid-cols-3 gap-3 sm:gap-8">
              {STEPS.map((s) => (
                <li key={s.n} className="flex min-w-0 flex-col gap-1.5 border-t-2 border-[#064E3B] pt-3">
                  <span aria-hidden="true" className="font-serif text-[32px] leading-none text-[#064E3B] sm:text-[44px]">
                    {s.n}
                  </span>
                  <h3 className="text-[15px] font-bold leading-tight sm:text-lg">{s.title}</h3>
                  <p className="text-[13px] leading-snug text-[#3F574C] sm:text-[15px]">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-[104px]">
          <div className="mx-auto flex max-w-[1000px] flex-col items-center gap-10 px-6">
            <div className="flex max-w-[620px] flex-col items-center gap-3.5 text-center">
              <h2 className={headingClass}>Start free</h2>
              <p className="text-lg text-[#4B6358]">
                Free with up to {FREE_METHOD_LIMIT} payment methods. Upgrade any time for unlimited.
              </p>
            </div>
            <Pricing />
          </div>
        </section>

        {/* Final call to action */}
        <section id="signup" className="bg-[#064E3B] py-24 text-[#FBFBFB]">
          <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-10 px-6">
            <div className="flex min-w-0 max-w-[560px] flex-col gap-5">
              <h2 className="font-serif text-[clamp(38px,4.8vw,62px)] font-normal leading-[1.06] tracking-[-0.02em] [text-wrap:balance]">
                Ready to get paid?
              </h2>
              <span className="self-start rounded-full border border-[#D9B873]/60 px-4 py-2 text-[15px] font-semibold text-[#D9B873]">
                {PRICING.annual.price} per year, or {PRICING.monthly.price} per month
              </span>
            </div>
            <Cta variant="gold" className="min-w-[240px]">
              Create my page
            </Cta>
          </div>
        </section>
      </main>

      <footer className="bg-[#032F24] text-[#FBFBFB]/75">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-6 py-9 text-sm">
          <span>&copy; {new Date().getFullYear()} PayTree. All rights reserved.</span>
          <nav aria-label="Legal" className="flex flex-wrap gap-6">
            <Link href="/terms" className="inline-flex min-h-11 items-center hover:text-[#FBFBFB]">
              Terms
            </Link>
            <Link href="/privacy" className="inline-flex min-h-11 items-center hover:text-[#FBFBFB]">
              Privacy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
