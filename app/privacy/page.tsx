// app/privacy/page.tsx  ->  paytree.me/privacy
import type { Metadata } from "next";

import { LegalLayout } from "@/components/legal-layout";
import { PRIVACY } from "@/content/legal";

export const metadata: Metadata = {
  title: "Privacy Policy · PayTree",
  description: "What PayTree collects, why, and the choices you have.",
};

export default function PrivacyPage() {
  return <LegalLayout doc={PRIVACY} active="privacy" />;
}
