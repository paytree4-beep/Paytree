// next.config.ts
//
// Production-safe defaults. A full Content-Security-Policy is planned for the
// security phase, because it has to be tested against the real pages and the
// auth and analytics requests that arrive in later phases.

import type { NextConfig } from "next";

const securityHeaders = [
  // Stop browsers from guessing file types.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // PayTree pages are never meant to be shown inside someone else's frame.
  { key: "X-Frame-Options", value: "DENY" },
  // Send only the site address, not the full path, to other websites.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The site uses none of these browser features.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // Browsers ignore this header over plain http, so it is safe in development.
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Do not advertise the framework in every response.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
