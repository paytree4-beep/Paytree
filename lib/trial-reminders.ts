// lib/trial-reminders.ts
//
// Friendly emails before the free trial ends: one 2 days before, one on the
// last day. Pure helpers (timing and email content), so they can be tested.

import { PRICING, SITE_URL, TRIAL_DAYS } from "./site";

export type ReminderKind = "two_days" | "last_day";

const HOUR = 3_600_000;

/** Which reminder is due now, if any. The cron runs once a day. */
export function reminderDue(createdAt: string, now: number): ReminderKind | null {
  const start = new Date(createdAt).getTime();
  if (Number.isNaN(start)) return null;
  const left = start + TRIAL_DAYS * 24 * HOUR - now;
  if (left <= 0) return null;
  if (left <= 24 * HOUR) return "last_day";
  if (left <= 48 * HOUR) return "two_days";
  return null;
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
}

export interface ReminderEmail {
  subject: string;
  html: string;
  text: string;
}

export function reminderEmail(kind: ReminderKind, name: string, trialEnd: Date): ReminderEmail {
  const who = escapeHtml(name.trim() || "there");
  const date = trialEnd.toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "America/New_York" });
  const link = `${SITE_URL}/dashboard#billing`;
  const prices = `${PRICING.monthly.price} a month or ${PRICING.annual.price} a year. Cancel any time.`;

  const copy =
    kind === "two_days"
      ? {
          subject: "Your PayTree trial ends in 2 days",
          title: "2 days left in your free trial",
          body: `Hi ${who}, your free trial ends on ${date}. Subscribe to keep your payment page live for your customers. Everything you added stays saved.`,
        }
      : {
          subject: "Your PayTree trial ends today",
          title: "Your free trial ends today",
          body: `Hi ${who}, today is the last day of your free trial. Subscribe to keep your payment page live. If you don&rsquo;t, your page is paused, not deleted, and comes back the moment you subscribe.`,
        };

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><title>${copy.subject}</title></head>
<body style="margin:0;padding:0;background-color:#FAF5EA;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FAF5EA;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">
<tr><td align="center" style="padding:0 0 20px 0;"><a href="${SITE_URL}" style="text-decoration:none;"><img src="${SITE_URL}/email-logo.png" width="170" height="43" alt="PayTree" style="display:block;border:0;width:170px;height:auto;font-family:Helvetica,Arial,sans-serif;font-size:24px;font-weight:bold;color:#064E3B;"></a></td></tr>
<tr><td style="background-color:#FFFFFF;border:1px solid #E7DCC2;border-radius:24px;padding:36px 32px;font-family:Helvetica,Arial,sans-serif;color:#0B1F18;">
<h1 style="margin:0 0 14px 0;font-family:Georgia,'Times New Roman',serif;font-weight:normal;font-size:30px;line-height:1.15;color:#064E3B;">${copy.title}</h1>
<p style="margin:0 0 26px 0;font-size:16px;line-height:1.6;color:#3F574C;">${copy.body}</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td align="center" bgcolor="#064E3B" style="border-radius:999px;">
<a href="${link}" style="display:block;padding:16px 24px;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:bold;color:#FFFFFF;text-decoration:none;border-radius:999px;">Keep my page live</a>
</td></tr></table>
<p style="margin:24px 0 0 0;font-size:14px;line-height:1.6;color:#4B6358;">${prices}</p>
</td></tr>
<tr><td align="center" style="padding:22px 8px 0 8px;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#6B7F75;">You received this email because you started a PayTree free trial.<br>PayTree &middot; <a href="${SITE_URL}" style="color:#6B7F75;">paytree.to</a></td></tr>
</table></td></tr></table></body></html>`;

  const text = `${copy.title}\n\n${copy.body.replace(/&rsquo;/g, "'").replace(/&amp;/g, "&")}\n\nKeep my page live: ${link}\n\n${prices}`;
  return { subject: copy.subject, html, text };
}
