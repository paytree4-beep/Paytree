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
            <h1 className="font-serif text-[clamp(46px,6.2vw,84px)] font-normal leading-[1.04] tracking-[-0.02em] [text-wrap:balance]">
              Get paid your way. <span className="text-[#D9B873]">One link. One QR code.</span>
            </h1>
            <p className="max-w-[520px] text-lg leading-[1.75] text-[#FBFBFB]/85">
              All your payment apps on one page. Share the link, or let clients scan your QR code.
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
          </div>

        </div>
      </header>

      <main>
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

        {/* How it works */}
        <section id="how" className="bg-[#E9F1ED] py-24">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-14 px-6">
            <h2 className={`max-w-[640px] ${headingClass}`}>Ready in 3 steps</h2>
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
              <h2 className={headingClass}>One simple price</h2>
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
