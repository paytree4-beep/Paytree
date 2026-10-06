// lib/email.ts
//
// SERVER ONLY. Sends one email through Resend's API. Needs RESEND_API_KEY.

export async function sendEmail(to: string, subject: string, html: string, text: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "PayTree <noreply@paytree.to>", to: [to], subject, html, text }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
