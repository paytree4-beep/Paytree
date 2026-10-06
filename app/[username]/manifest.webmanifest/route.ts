// app/[username]/manifest.webmanifest/route.ts
//
// A small manifest for each public payment page, so a customer who adds
// "Cedar Coffee Co." to their Home Screen opens that payment page directly.

import { getProfileByUsername } from "@/lib/profiles";

export async function GET(_request: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) return new Response("Not found", { status: 404 });

  const body = {
    name: `Pay ${profile.displayName}`,
    short_name: profile.displayName.slice(0, 12),
    id: `/${profile.username}`,
    start_url: `/${profile.username}`,
    scope: `/${profile.username}`,
    display: "standalone",
    background_color: "#FAF5EA",
    theme_color: "#FAF5EA",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/manifest+json", "cache-control": "public, max-age=300" },
  });
}
