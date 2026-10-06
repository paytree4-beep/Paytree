// app/manifest.ts
//
// Makes PayTree installable: "Add to Home Screen" gives an app icon that opens
// the dashboard full screen, without the browser bar.

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PayTree",
    short_name: "PayTree",
    description: "All your payment methods. One simple link.",
    id: "/dashboard",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#FAF5EA",
    theme_color: "#FAF5EA",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
