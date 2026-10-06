// content/legal.ts
//
// Terms of Service and Privacy Policy for PayTree (United States).
//
// THIS IS A TEMPLATE, NOT LEGAL ADVICE. Every [BRACKETED] item must be
// replaced, and a licensed attorney should review both documents before
// launch. The text assumes the facts listed in README-LEGAL below; if any of
// them is wrong for your product, change the document, not the product claim.
//
// README-LEGAL: facts these documents assume
//  - PayTree never receives, holds or moves customer money.
//  - Billing is handled by a third-party processor.
//  - Visitor analytics store no IP address and set no cookies.
//  - Visitors who send Global Privacy Control or Do Not Track are not recorded.
//  - Account holders can cancel, export and delete from account settings.
//  - Personal information is not sold or shared for advertising.

export interface LegalSection {
  id: string;
  title: string;
  /** Paragraphs shown before the bullets. */
  intro?: string[];
  bullets?: string[];
  /** Paragraphs shown after the bullets. */
  closing?: string[];
}

export interface LegalDocument {
  title: string;
  summary: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
}

export const LEGAL_TEMPLATE_NOTICE = "";

export const TERMS: LegalDocument = {
  title: "Terms of Service",
  summary: "The rules for using PayTree.",
  lastUpdated: "October 6, 2026",
  intro:
    "These Terms of Service (the “Terms”) govern your use of PayTree (the “Service”), operated by ABUHIDAR LLC (“PayTree,” “we,” “us”). By creating an account or using the Service, you agree to these Terms.",
  sections: [
    {
      id: "eligibility",
      title: "Who can use PayTree",
      intro: [
        "You must be at least 18 years old and able to form a binding contract. The Service is intended for use in the United States.",
        "If you use the Service for a business, you confirm that you have authority to bind that business to these Terms.",
      ],
    },
    {
      id: "service",
      title: "What PayTree does",
      intro: [
        "PayTree lets you build a public page that lists the ways people can pay you, such as Cash App, Venmo, PayPal, Zelle, Apple Cash, Chime, ACH bank transfer, wire transfer, check by mail, Stripe, Square, Wise, cryptocurrency and links to other payment pages, and share that page with a single link.",
      ],
    },
    {
      id: "no-payments",
      title: "We do not handle your money",
      intro: [
        "PayTree is not a bank, payment processor or money transmitter. We do not receive, hold, transmit, convert or refund funds. When someone pays you, the payment happens directly between them and the third-party service or network they choose, under that provider’s terms.",
        "We are not a party to any transaction between you and the people who pay you. We are not responsible for disputes, chargebacks, failed payments or payments sent to the wrong place.",
      ],
    },
    {
      id: "account",
      title: "Your account",
      intro: ["When you create an account, you agree to:"],
      bullets: [
        "give accurate information and keep it up to date;",
        "keep your sign-in details secure and tell us right away about unauthorized use;",
        "choose a username that does not impersonate anyone or infringe anyone’s rights;",
        "accept responsibility for everything that happens under your account.",
      ],
      closing: [
        "Some usernames are reserved for the Service. We may reclaim a username that is reserved, that impersonates someone else, or whose account has been deleted or closed.",
      ],
    },
    {
      id: "payment-details",
      title: "The payment details you publish",
      intro: [
        "You decide which payment details appear on your page. Anything you add can be seen by anyone who has your link, and the copy buttons give visitors the full value, including a complete bank account number if you add one.",
        "You are responsible for entering correct details. We are not liable for payments sent to an account that is wrong, outdated or closed. Publish only details you are comfortable sharing publicly, and consider using accounts set up for receiving payments.",
      ],
    },
    {
      id: "billing",
      title: "Subscriptions and billing",
      intro: [
        "New accounts get a 7-day free trial with every feature; no card is needed to start. After the trial, PayTree is a paid membership: $4.99 per month or $39.99 per year, plus any applicable taxes. If you do not subscribe, your page is paused (not deleted) until you do. Payments are processed by Stripe; we never see or store your full card number.",
        "Your subscription renews automatically at the end of each billing period until you cancel. You can cancel at any time from your dashboard (Manage billing). Cancellation takes effect at the end of the current period, and you keep access until then.",
        "We will tell you before a price change takes effect. Refunds: payments are non-refundable. You can cancel any time, and your page stays live until the end of the period you paid for.",
      ],
    },
    {
      id: "acceptable-use",
      title: "Acceptable use",
      intro: ["You agree not to use the Service to:"],
      bullets: [
        "collect money through fraud, deception or false pretenses;",
        "impersonate a person, business or charity;",
        "sell or promote illegal goods or services, or anything the payment providers you list prohibit;",
        "harass, threaten or infringe the rights of others, or publish someone else’s payment details without permission;",
        "probe, scrape, overload or bypass the limits of the Service.",
      ],
      closing: [
        "We may remove content or suspend pages that violate this section. Report abuse to paytree4@gmail.com.",
      ],
    },
    {
      id: "risks",
      title: "Payment risks",
      intro: [
        "Payments made with some methods, including Zelle, Apple Cash, ACH, wire transfers, checks and cryptocurrency, can be difficult or impossible to reverse. Verify the recipient before you send money.",
        "Cryptocurrency must be sent on the network shown on the page. Funds sent on a different network can be lost permanently. Links to other websites are added by the page owner, are not reviewed by PayTree, and open sites we do not control.",
      ],
    },
    {
      id: "content",
      title: "Your content and our property",
      intro: [
        "You keep ownership of what you add to your page. You give us a limited, worldwide license to host, display and process it only to run the Service.",
        "PayTree, its design and its software belong to us and our licensors. These Terms give you no rights to them except to use the Service.",
      ],
    },
    {
      id: "analytics",
      title: "Analytics on your page",
      intro: [
        "The Service shows you aggregated statistics about visits and taps on your page. Our Privacy Policy explains what we collect from visitors. You agree not to use the Service to identify individual visitors.",
      ],
    },
    {
      id: "termination",
      title: "Suspension and termination",
      intro: [
        "You may delete your account at any time. We may suspend or end your access if you break these Terms, create risk or legal exposure for us or others, or, after reasonable notice, for any other reason. Sections that by their nature should continue after termination will continue.",
      ],
    },
    {
      id: "disclaimers",
      title: "Disclaimers",
      intro: [
        "The Service is provided “as is” and “as available.” To the fullest extent permitted by law, we disclaim all warranties, express or implied, including merchantability, fitness for a particular purpose and non-infringement. We do not promise that the Service will be uninterrupted or error-free.",
      ],
    },
    {
      id: "liability",
      title: "Limitation of liability",
      intro: [
        "To the fullest extent permitted by law, PayTree and its owners, employees and suppliers are not liable for indirect, incidental, special, consequential or punitive damages, or for lost profits, revenue, data or funds.",
        "Our total liability for any claim is limited to the greater of the amount you paid us in the 12 months before the claim or $100. Some states do not allow certain limits, so parts of this section may not apply to you.",
      ],
    },
    {
      id: "indemnity",
      title: "Indemnification",
      intro: [
        "You agree to defend and indemnify us against claims, losses and expenses, including reasonable attorneys’ fees, that arise from your content, your use of the Service, or your violation of these Terms or of anyone’s rights.",
      ],
    },
    {
      id: "disputes",
      title: "Disputes and governing law",
      intro: [
        "These Terms are governed by the laws of Wyoming, without regard to conflict-of-law rules.",
        "Before filing a claim, you agree to contact us at paytree4@gmail.com and try to resolve the issue informally for 30 days. A claim that is not resolved will be brought in the state or federal courts located in Sheridan County, Wyoming.",
      ],
    },
    {
      id: "changes",
      title: "Changes to these Terms",
      intro: [
        "We may update these Terms. If a change is material, we will notify you by email or in your dashboard before it takes effect. Using the Service after that means you accept the updated Terms.",
      ],
    },
    {
      id: "contact",
      title: "Contact us",
      intro: ["ABUHIDAR LLC, Sheridan, WY 82801, USA. Email: paytree4@gmail.com."],
    },
  ],
};

export const PRIVACY: LegalDocument = {
  title: "Privacy Policy",
  summary: "What we collect, why, and the choices you have.",
  lastUpdated: "October 6, 2026",
  intro:
    "This Privacy Policy explains what ABUHIDAR LLC (“PayTree,” “we,” “us”) collects when you use PayTree, and how we use and protect it. It covers two groups of people: account holders who build pages, and visitors who view those pages.",
  sections: [
    {
      id: "collect-account",
      title: "Information from account holders",
      intro: ["When you create and manage a page, we collect:"],
      bullets: [
        "Account details: your email address, username, display name, bio and photo.",
        "Payment details you choose to publish: handles, a Zelle email or phone number, bank routing and account numbers, a card checkout link, a Wise link and wallet addresses.",
        "Subscription details: your plan, billing status, and the brand and last four digits of your card. Full card numbers are handled by Stripe and are never stored by us.",
        "Messages you send to our support team.",
      ],
    },
    {
      id: "collect-visitors",
      title: "Information from visitors",
      intro: ["When someone views a PayTree page, we record:"],
      bullets: [
        "that the page was viewed;",
        "which payment button was tapped, and whether it opened an app or copied details;",
        "the time of the action;",
        "the website the visitor came from (the domain only), the type of device (mobile, tablet or desktop) and an approximate country.",
      ],
      closing: [
        "We do not collect visitors’ names, email addresses or payment information, and we do not store visitor IP addresses or set cookies for analytics.",
      ],
    },
    {
      id: "collect-logs",
      title: "Security logs",
      intro: [
        "Our servers keep standard logs, which include IP addresses, for up to 30 days. We use them to detect abuse and keep the Service running.",
      ],
    },
    {
      id: "use",
      title: "How we use information",
      bullets: [
        "To provide, host and secure the Service and your page.",
        "To show you statistics about views and taps.",
        "To process subscriptions and send receipts and service messages.",
        "To prevent fraud, abuse and violations of our Terms.",
        "To comply with the law.",
        "To improve the Service, using aggregated information that does not identify anyone.",
      ],
    },
    {
      id: "public",
      title: "Your public page",
      intro: [
        "Everything you add to your page is public to anyone who has your link. The copy buttons give visitors the full value, including your complete bank account number if you add one. Think carefully about what you publish.",
      ],
    },
    {
      id: "share",
      title: "How we share information",
      intro: [
        "We do not sell your personal information, and we do not share it for cross-context behavioral advertising.",
        "We share information with service providers who help us run the Service under contract: Vercel (hosting), Supabase (database and sign-in), Resend (email) and Stripe (payments).",
        "We may disclose information to comply with the law or legal process, to protect rights, safety and security, or in a merger or sale of the business, with notice where required.",
      ],
    },
    {
      id: "cookies",
      title: "Cookies and similar technologies",
      intro: [
        "We use cookies that are necessary to keep you signed in and to secure your account. We do not use advertising or cross-site tracking cookies, and visitor analytics do not use cookies.",
        "We honor Global Privacy Control and Do Not Track signals by not recording analytics for visitors who send them.",
      ],
    },
    {
      id: "retention",
      title: "How long we keep information",
      bullets: [
        "Account data: until you delete your account, then removed within 30 days unless the law requires us to keep it.",
        "Analytics events: kept for 13 months, then deleted.",
        "Billing records: as long as tax and accounting law require.",
      ],
    },
    {
      id: "rights",
      title: "Your choices and rights",
      intro: [
        "You can update or delete your page details, and export or delete your data, from your account settings or by emailing paytree4@gmail.com.",
        "Residents of California and other states with privacy laws may have the right to know, access, correct, delete and obtain a copy of their personal information, and to opt out of the sale of personal information or targeted advertising, neither of which we do.",
        "To make a request, email paytree4@gmail.com. We respond within 45 days, and we will not treat you differently for exercising your rights. If we decline a request, you may appeal by replying to our response.",
      ],
    },
    {
      id: "security",
      title: "Security",
      intro: [
        "We use reasonable administrative, technical and physical safeguards, including encryption in transit. No method of transmission or storage is completely secure, so we cannot promise absolute security. Protect your password and tell us right away if you suspect unauthorized access.",
      ],
    },
    {
      id: "children",
      title: "Children",
      intro: [
        "PayTree is not directed to anyone under 18, and we do not knowingly collect personal information from them. If you believe a child has given us information, contact us and we will delete it.",
      ],
    },
    {
      id: "location",
      title: "Where information is processed",
      intro: [
        "The Service is operated in the United States and is intended for people in the United States. Information is processed and stored in the United States.",
      ],
    },
    {
      id: "changes-privacy",
      title: "Changes to this policy",
      intro: [
        "We may update this policy. We will post the new version here with a new date and, for material changes, notify account holders by email or in the dashboard.",
      ],
    },
    {
      id: "contact-privacy",
      title: "Contact us",
      intro: ["ABUHIDAR LLC, Sheridan, WY 82801, USA. Privacy requests: paytree4@gmail.com."],
    },
  ],
};
