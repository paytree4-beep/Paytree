// lib/daily-summary.ts
//
// The daily money email (sent at 12 noon New York time): what came in and
// what went out yesterday, and how the month is going. Pure helpers only.

import { categoryOf, treeState } from "./budget";
import { formatMoney } from "./payment-log";
import { SITE_URL } from "./site";
import type { ReminderEmail } from "./trial-reminders";

export const SUMMARY_TIME_ZONE = "America/New_York";

/** "2026-10-06" -> "2026-10-05". */
export function previousDay(day: string): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export interface OwnerDay {
  /** PayTree payments confirmed yesterday (page, invoices, split bills). */
  payTreeIn: number;
  /** Other income the owner added for yesterday. */
  otherIn: number;
  spent: number;
  /** Spending per category id, yesterday. */
  byCategory: Record<string, number>;
  monthIn: number;
  monthOut: number;
}

export function emptyDay(): OwnerDay {
  return { payTreeIn: 0, otherIn: 0, spent: 0, byCategory: {}, monthIn: 0, monthOut: 0 };
}

export function hasActivity(d: OwnerDay): boolean {
  return d.payTreeIn + d.otherIn + d.spent > 0;
}

const HTML_ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = (t: string) => t.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c] ?? c);

export function dailySummaryEmail(name: string, day: string, d: OwnerDay): ReminderEmail {
  const who = esc(name.trim() || "there");
  const dayLabel = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" }).format(
    new Date(`${day}T12:00:00Z`),
  );
  const cameIn = d.payTreeIn + d.otherIn;
  const left = d.monthIn - d.monthOut;
  const tree = treeState(d.monthIn, d.monthOut);
  const top = Object.entries(d.byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, cents]) => {
      const c = categoryOf(id);
      return `${c.icon} ${c.label} ${formatMoney(cents)}`;
    });
  const subject = `Yesterday: +${formatMoney(cameIn)} in, −${formatMoney(d.spent)} out`;
  const link = `${SITE_URL}/dashboard/tree`;

  const row = (label: string, value: string, color: string) =>
    `<tr><td style="padding:10px 0;font-size:16px;color:#3F574C;border-bottom:1px solid #EEF3F0;">${label}</td><td align="right" style="padding:10px 0;font-size:18px;font-weight:bold;color:${color};border-bottom:1px solid #EEF3F0;">${value}</td></tr>`;

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background-color:#FAF5EA;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FAF5EA;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">
<tr><td align="center" style="padding:0 0 20px 0;"><a href="${SITE_URL}" style="text-decoration:none;"><img src="${SITE_URL}/email-logo.png" width="170" height="43" alt="PayTree" style="display:block;border:0;width:170px;height:auto;font-family:Helvetica,Arial,sans-serif;font-size:24px;font-weight:bold;color:#064E3B;"></a></td></tr>
<tr><td style="background-color:#FFFFFF;border:1px solid #E7DCC2;border-radius:24px;padding:32px 28px;font-family:Helvetica,Arial,sans-serif;color:#0B1F18;">
<p style="margin:0 0 4px 0;font-size:13px;font-weight:bold;letter-spacing:1px;color:#9A6E1A;">YOUR DAY · ${esc(dayLabel.toUpperCase())}</p>
<h1 style="margin:0 0 18px 0;font-family:Georgia,'Times New Roman',serif;font-weight:normal;font-size:28px;line-height:1.2;color:#064E3B;">Hi ${who}, here is your money yesterday</h1>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${row("Came in", `+${formatMoney(cameIn)}`, "#16A34A")}
${d.payTreeIn > 0 && d.otherIn > 0 ? row("&nbsp;&nbsp;from PayTree", formatMoney(d.payTreeIn), "#3F574C") : ""}
${row("Spent", `−${formatMoney(d.spent)}`, "#B42318")}
</table>
${top.length ? `<p style="margin:14px 0 0 0;font-size:14px;line-height:1.6;color:#3F574C;">Where it went: ${esc(top.join(" · "))}</p>` : ""}
<p style="margin:22px 0 6px 0;font-size:13px;font-weight:bold;letter-spacing:1px;color:#4B6358;">THIS MONTH SO FAR</p>
<p style="margin:0 0 22px 0;font-size:15px;line-height:1.6;color:#3F574C;">In ${formatMoney(d.monthIn)} · Out ${formatMoney(d.monthOut)} · Left <strong style="color:${left < 0 ? "#B42318" : "#064E3B"};">${left < 0 ? "−" : ""}${formatMoney(Math.abs(left))}</strong><br>Your money tree: <strong>${esc(tree.label)}</strong> 🌳</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td align="center" bgcolor="#064E3B" style="border-radius:999px;">
<a href="${link}" style="display:block;padding:15px 24px;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:bold;color:#FFFFFF;text-decoration:none;border-radius:999px;">See my money tree</a>
</td></tr></table>
</td></tr>
<tr><td align="center" style="padding:22px 8px 0 8px;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#6B7F75;">You get this email on days with money in or out. Turn it off any time in <a href="${SITE_URL}/dashboard/budget#daily" style="color:#6B7F75;">My budget</a>.<br>PayTree &middot; <a href="${SITE_URL}" style="color:#6B7F75;">paytree.to</a></td></tr>
</table></td></tr></table></body></html>`;

  const text = [
    `Your day, ${dayLabel}`,
    ``,
    `Came in: +${formatMoney(cameIn)}`,
    `Spent: -${formatMoney(d.spent)}`,
    top.length ? `Where it went: ${top.join(" · ")}` : "",
    ``,
    `This month so far: in ${formatMoney(d.monthIn)}, out ${formatMoney(d.monthOut)}, left ${left < 0 ? "-" : ""}${formatMoney(Math.abs(left))}`,
    `Your money tree: ${tree.label}`,
    ``,
    `See it: ${link}`,
    `Turn this email off in My budget: ${SITE_URL}/dashboard/budget`,
  ]
    .filter((l, i, all) => l !== "" || all[i - 1] !== "")
    .join("\n");

  return { subject, html, text };
}
