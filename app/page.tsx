// app/page.tsx  ->  paytree.to
//
// Marketing homepage. A faithful port of the approved landing-page design,
// with the copy kept to what PayTree actually does (it displays payment
// methods; it never receives or moves a visitor's money).

import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { Cta } from "@/components/marketing/cta";
import { Pricing } from "@/components/marketing/pricing";
import { PRICING, SIGNUPS_OPEN, SITE_HOST } from "@/lib/site";

const FEATURES: { title: string; body: string; icon: string }[] = [
  {
    title: "One link, every method",
    body: "Bring Cash App, Venmo, Zelle, cards, bank transfer and more together behind a single PayTree address.",
    icon: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1 M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  },
  {
    title: "Every popular way to pay",
    body: "Cash App, Venmo, Zelle, PayPal, Apple Cash, Chime, cards, checks and USDT. Add only the ones you use.",
    icon: "M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M3 10h18 M7 15h4",
  },
  {
    title: "Your order, your page",
    body: "Arrange methods the way you like and hide any of them without losing the details.",
    icon: "M4 7h10 M18 7h2 M4 17h2 M10 17h10 M14 5v4 M6 15v4",
  },
  {
    title: "Your own QR code",
    body: "Every page comes with a QR code. Print it for your table, booth, shop window or business card, and get paid in person with one scan.",
    icon: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h3v3h-3z M20 14v.01 M14 20h.01 M17.5 20.5H21v-3",
  },
  {
    title: "Clear, private insights",
    body: "See which methods draw attention and which get used, without tracking the people who visit.",
    icon: "M3 20h18 M6 20v-7 M12 20V5 M18 20v-10",
  },
  {
    title: "Designed for trust",
    body: "PayTree never touches your money. Payments go straight to the accounts you add.",
    icon: "M12 3l7 3v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6z M9 12l2 2 4-4",
  },
];

const STEPS: { n: string; title: string; body: string }[] = [
  {
    n: "1",
    title: "Create your account",
    body: "Sign up and reserve your personal PayTree address.",
  },
  {
    n: "2",
    title: "Add your payment methods",
    body: "Enter the accounts you already use. Each one is checked for you.",
  },
  {
    n: "3",
    title: "Share your page",
    body: "Add your link or QR code to your profiles, invoices and messages.",
  },
];

const SAMPLE_METHODS: { name: string; detail: string; action: string }[] = [
  { name: "Cash App", detail: "$hartwell", action: "Open" },
  { name: "Venmo", detail: "@hartwell-studio", action: "Open" },
  { name: "Zelle", detail: "Email", action: "Copy" },
  { name: "Apple Cash", detail: "Phone number", action: "Copy" },
];

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
          <div className="flex min-w-0 flex-[1_1_460px] flex-col items-start gap-7">
            <span className="inline-block rounded-full border border-[#D9B873]/60 px-3.5 py-1.5 text-sm font-semibold text-[#D9B873]">
              One link · One QR code
            </span>
            <h1 className="font-serif text-[clamp(46px,6.2vw,84px)] font-normal leading-[1.04] tracking-[-0.02em] [text-wrap:balance]">
              Get paid your way. <span className="text-[#D9B873]">One link. One QR code.</span>
            </h1>
            <p className="max-w-[520px] text-lg leading-[1.75] text-[#FBFBFB]/85">
              Cash App, Venmo, Zelle, PayPal and more on one elegant page. Share your link online, or
              print your QR code for your table, shop window or business card. Clients scan, pick
              their app and pay you directly.
            </p>
            <div className="flex flex-wrap gap-3.5">
              <Cta variant="gold" className="min-w-[200px]">
                Claim your page
              </Cta>
              <a
                href="#pricing"
                className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-[#FBFBFB]/50 px-[30px] font-semibold text-[#FBFBFB]"
              >
                View pricing
              </a>
            </div>
            <p className="text-sm text-[#FBFBFB]/70">The sample on the right uses demo details.</p>
          </div>

          {/* Sample page */}
          <div className="mx-auto min-w-0 max-w-[420px] flex-[1_1_340px]">
            <div
              role="img"
              aria-label="Sample PayTree page for Hartwell Studio showing Cash App, Venmo, Zelle, Apple Cash and a scan-to-pay QR code"
              className="flex flex-col gap-[18px] rounded-[36px] bg-[#FBFBFB] p-[26px] text-[#0B1F18] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.55)]"
            >
              <span className="self-start rounded-full bg-[#E3F0EA] px-3 py-1 text-[13px] font-semibold text-[#064E3B]">
                Sample page
              </span>
              <div className="flex items-center gap-3.5">
                <span
                  aria-hidden="true"
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-[#064E3B] font-serif text-[28px] leading-none text-[#D9B873]"
                >
                  H
                </span>
                <div className="min-w-0">
                  <div className="text-lg font-bold">Hartwell Studio</div>
                  <div className="text-sm text-[#4B6358]">{SITE_HOST}/hartwell</div>
                </div>
              </div>
              <p className="text-sm text-[#4B6358]">Brand strategy and advisory sessions</p>
              <div className="flex flex-col gap-2.5">
                {SAMPLE_METHODS.map((m) => (
                  <div
                    key={m.name}
                    className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border-[1.5px] border-[#DCE5DF] bg-white px-[18px] py-3"
                  >
                    <span className="min-w-0">
                      <span className="block font-semibold">{m.name}</span>
                      <span className="block text-[13px] text-[#4B6358]">{m.detail}</span>
                    </span>
                    <span className="rounded-full bg-[#E3F0EA] px-3 py-1 text-[13px] font-semibold text-[#064E3B]">
                      {m.action}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3.5 rounded-2xl bg-[#064E3B] px-[18px] py-3.5 text-[#FBFBFB]">
                <svg
                  width="44"
                  height="44"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#D9B873"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="flex-none"
                >
                  <path d="M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h3v3h-3z M20 14v.01 M14 20h.01 M17.5 20.5H21v-3 M6 6h1 M17 6h1 M6 17h1" />
                </svg>
                <span className="min-w-0">
                  <span className="block font-semibold">Scan to pay</span>
                  <span className="block text-[13px] text-[#FBFBFB]/75">Print it. Clients scan and pay.</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Features */}
        <section id="features" className="pb-24 pt-[104px]">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-14 px-6">
            <div className="flex max-w-[640px] flex-col gap-3.5">
              <span className="text-sm font-bold tracking-[0.12em] text-[#064E3B]">FEATURES</span>
              <h2 className={headingClass}>Everything you need to get paid</h2>
              <p className="text-lg text-[#4B6358]">
                Considered tools that make every payment feel effortless, for you and for your clients.
              </p>
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

        {/* How it works */}
        <section id="how" className="bg-[#E9F1ED] py-24">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-14 px-6">
            <h2 className={`max-w-[640px] ${headingClass}`}>Live in three steps</h2>
            <ol className="flex flex-wrap gap-10">
              {STEPS.map((s) => (
                <li
                  key={s.n}
                  className="flex min-w-0 flex-[1_1_260px] flex-col gap-3.5 border-t-2 border-[#064E3B] pt-[22px]"
                >
                  <span aria-hidden="true" className="font-serif text-[56px] leading-none text-[#064E3B]">
                    {s.n}
                  </span>
                  <h3 className="text-xl font-bold">{s.title}</h3>
                  <p className="text-[#3F574C]">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-[104px]">
          <div className="mx-auto flex max-w-[1000px] flex-col items-center gap-10 px-6">
            <div className="flex max-w-[620px] flex-col items-center gap-3.5 text-center">
              <span className="text-sm font-bold tracking-[0.12em] text-[#064E3B]">PRICING</span>
              <h2 className={headingClass}>Simple, transparent pricing</h2>
              <p className="text-lg text-[#4B6358]">
                One membership with every feature included. Choose the billing cycle that suits you.
              </p>
            </div>
            <Pricing />
            <p className="max-w-[560px] text-center text-sm text-[#4B6358]">
              Prices are in US dollars, plus any applicable taxes. Your membership pays for PayTree
              only. PayTree never receives or moves the money your clients send you.
            </p>
          </div>
        </section>

        {/* Final call to action */}
        <section id="signup" className="bg-[#064E3B] py-24 text-[#FBFBFB]">
          <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-10 px-6">
            <div className="flex min-w-0 max-w-[560px] flex-col gap-5">
              <h2 className="font-serif text-[clamp(38px,4.8vw,62px)] font-normal leading-[1.06] tracking-[-0.02em] [text-wrap:balance]">
                Reserve your PayTree page
              </h2>
              <p className="text-lg text-[#FBFBFB]/85">
                Choose your link name and create your account. Your page will be ready to share.
              </p>
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
