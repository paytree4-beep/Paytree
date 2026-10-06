// components/legal-layout.tsx
//
// Shared layout for /terms and /privacy: branded header, tabs to switch
// between the two documents, a template notice, a table of contents and the
// document itself. A Server Component, no JavaScript needed in the browser.

import Link from "next/link";

import { LogoMark } from "@/components/brand/logo";

import { LEGAL_TEMPLATE_NOTICE } from "@/content/legal";
import type { LegalDocument } from "@/content/legal";

type ActiveDoc = "terms" | "privacy";

const TABS: { id: ActiveDoc; label: string; href: string }[] = [
  { id: "terms", label: "Terms of Service", href: "/terms" },
  { id: "privacy", label: "Privacy Policy", href: "/privacy" },
];

export function LegalLayout({ doc, active }: { doc: LegalDocument; active: ActiveDoc }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#FBFBFB] font-sans text-[#0B1F18]">
      <header className="bg-[#064E3B] px-5 pb-10 pt-6 text-[#FBFBFB]">
        <div className="mx-auto max-w-[1100px]">
          <Link href="/" className="inline-flex min-h-11 items-center gap-2.5 font-bold">
            <LogoMark size={34} onDark />
            <span className="text-xl">
              PayTree
            </span>
          </Link>

          <h1 className="mt-8 font-serif text-5xl font-normal leading-[1.05] tracking-tight">
            {doc.title}
          </h1>
          <p className="mt-2 text-[#FBFBFB]/80">Last updated: {doc.lastUpdated}</p>

          <nav aria-label="Legal documents" className="mt-6 inline-flex gap-1 rounded-full bg-[#FBFBFB]/10 p-1">
            {TABS.map((tab) => (
              <Link
                key={tab.id}
                href={tab.href}
                aria-current={tab.id === active ? "page" : undefined}
                className={`inline-flex min-h-11 items-center rounded-full px-5 text-sm font-semibold ${
                  tab.id === active
                    ? "bg-[#FBFBFB] text-[#064E3B]"
                    : "text-[#FBFBFB]/85 hover:bg-[#FBFBFB]/10"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1100px] flex-1 px-5 py-10">
        <p
          role="note"
          className="mb-10 rounded-2xl border border-[#D9B873] bg-[#D9B873]/15 px-5 py-4 text-sm font-medium"
        >
          {LEGAL_TEMPLATE_NOTICE}
        </p>

        <div className="flex flex-wrap gap-12">
          <nav aria-label="On this page" className="min-w-0 flex-[1_1_240px] lg:max-w-[260px]">
            <h2 className="mb-3 text-[13px] font-bold tracking-[0.12em] text-[#064E3B]">ON THIS PAGE</h2>
            <ol className="flex flex-col gap-1">
              {doc.sections.map((section, index) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="flex min-h-9 items-start gap-2 text-sm text-[#3F574C] hover:text-[#064E3B] hover:underline"
                  >
                    <span className="w-6 flex-none tabular-nums text-[#4B6358]">{index + 1}.</span>
                    <span>{section.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <article className="min-w-0 max-w-[720px] flex-[3_1_480px]">
            <p className="mb-10 text-lg leading-relaxed text-[#2F4A3F]">{doc.intro}</p>

            {doc.sections.map((section, index) => (
              <section key={section.id} id={section.id} className="mb-10 scroll-mt-6">
                <h2 className="mb-3 font-serif text-3xl font-normal leading-tight tracking-tight text-[#064E3B]">
                  {index + 1}. {section.title}
                </h2>
                {section.intro?.map((text) => (
                  <p key={text} className="mb-3 leading-relaxed text-[#2F4A3F]">
                    {text}
                  </p>
                ))}
                {section.bullets ? (
                  <ul className="mb-3 list-disc space-y-2 pl-6 leading-relaxed text-[#2F4A3F] marker:text-[#064E3B]">
                    {section.bullets.map((text) => (
                      <li key={text}>{text}</li>
                    ))}
                  </ul>
                ) : null}
                {section.closing?.map((text) => (
                  <p key={text} className="mb-3 leading-relaxed text-[#2F4A3F]">
                    {text}
                  </p>
                ))}
              </section>
            ))}
          </article>
        </div>
      </main>

      <footer className="bg-[#032F24] px-5 py-8 text-sm text-[#FBFBFB]/75">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-4">
          <span>© 2026 PayTree. All rights reserved.</span>
          <Link href="/" className="hover:underline">
            Back to PayTree
          </Link>
        </div>
      </footer>
    </div>
  );
}
