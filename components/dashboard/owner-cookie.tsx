"use client";
// components/dashboard/owner-cookie.tsx
//
// Marks this browser as the page owner's, so the owner's own visits to their
// page are not counted in the statistics. Holds only the link name.

import { useEffect } from "react";

export function OwnerCookie({ username }: { username: string }) {
  useEffect(() => {
    document.cookie = `pt_owner=${encodeURIComponent(username)}; path=/; max-age=31536000; samesite=lax; secure`;
  }, [username]);
  return null;
}
