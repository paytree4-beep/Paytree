// app/terms/page.tsx  ->  paytree.to/terms
import type { Metadata } from "next";

import { LegalLayout } from "@/components/legal-layout";
import { TERMS } from "@/content/legal";

export const metadata: Metadata = {
  title: "Terms of Service · PayTree",
  description: "The rules for using PayTree.",
};

export default function TermsPage() {
  return <LegalLayout doc={TERMS} active="terms" />;
}
