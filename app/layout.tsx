// app/layout.tsx
//
// Root layout: loads the two brand fonts, sets the site-wide metadata and
// wraps every page. Page-level layouts (the legal pages, the public payment
// page) keep their own headers and footers.

import type { Metadata, Viewport } from "next";
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
  "Get paid your way. One link and one QR code for Cash App, Venmo, Zelle, PayPal, cards and more.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "PayTree · Get paid your way. One link. One QR code.",
    template: "%s · PayTree",
  },
  description: DESCRIPTION,
  applicationName: "PayTree",
  openGraph: {
    type: "website",
    siteName: "PayTree",
    title: "PayTree · Get paid your way. One link. One QR code.",
    description: DESCRIPTION,
    url: "/",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "PayTree · Get paid your way. One link. One QR code.",
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#064E3B",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body className="min-h-screen bg-[#FBFBFB] font-sans text-[#0B1F18] antialiased">
        {children}
      </body>
    </html>
  );
}
