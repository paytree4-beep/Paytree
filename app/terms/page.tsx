// app/terms/page.tsx  ->  paytree.me/terms
import type { Metadata } from "next";

import { LegalLayout } from "@/components/legal-layout";
import { TERMS } from "@/content/legal";

export const metadata: Metadata = {
  title: "Terms of Service · PayTree.me",
  description: "The rules for using PayTree.me.",
};

export default function TermsPage() {
  return <LegalLayout doc={TERMS} active="terms" />;
}
