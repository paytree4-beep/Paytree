// components/auth/tabs.tsx
//
// "Create account / Log in" switch shown above the two forms.

import Link from "next/link";

export function AuthTabs({ active }: { active: "signup" | "login" }) {
  const tab = (key: "signup" | "login", href: string, label: string) => {
    const on = key === active;
    return (
      <Link
        href={href}
        aria-current={on ? "page" : undefined}
        className={`flex min-h-11 flex-1 items-center justify-center rounded-full text-[15px] font-semibold ${
          on ? "bg-[#064E3B] text-[#FBFBFB]" : "text-[#0B1F18]"
        }`}
      >
        {label}
      </Link>
    );
  };
  return (
    <nav aria-label="Account" className="mb-7 flex rounded-full border border-[#DCE5DF] bg-white p-1">
      {tab("signup", "/signup", "Sign up")}
      {tab("login", "/login", "Log in")}
    </nav>
  );
}
