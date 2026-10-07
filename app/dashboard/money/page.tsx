// app/dashboard/money/page.tsx
//
// Money moved: everything is on one page now (/dashboard/budget). This keeps
// old links and bookmarks working.

import { redirect } from "next/navigation";

export default function MoneyMoved() {
  redirect("/dashboard/budget");
}
