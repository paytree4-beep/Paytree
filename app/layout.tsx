// app/layout.tsx
//
// Root layout: loads the two brand fonts, sets the site-wide metadata and
// wraps every page. Page-level layouts (the legal pages, the public payment
// page) keep their own headers and footers.

import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Instrument_Serif, Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";

import { SITE_URL } from "@/lib/site";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif",
  display: "swap",
});

const DESCRIPTION =
  "All your payment methods. One simple link. Make it easier and faster for your customers to pay you, with your own link and QR code.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "PayTree · All your payment methods. One simple link.",
    template: "%s · PayTree",
  },
  description: DESCRIPTION,
  applicationName: "PayTree",
  appleWebApp: { capable: true, title: "PayTree", statusBarStyle: "default" },
  openGraph: {
    type: "website",
    siteName: "PayTree",
    title: "PayTree · All your payment methods. One simple link.",
    description: DESCRIPTION,
    url: "/",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "PayTree · All your payment methods. One simple link.",
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FAF5EA",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body className="min-h-screen bg-[#FBFBFB] font-sans text-[#0B1F18] antialiased">
        {children}
        {/* Vercel Analytics: counts visitors and page views. No package needed. */}
        <Script id="vercel-analytics-init" strategy="afterInteractive">
          {`window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };`}
        </Script>
        <Script src="/_vercel/insights/script.js" strategy="afterInteractive" defer />
      </body>
    </html>
  );
}
