// components/dashboard/invite-card.tsx
//
// The owner's referral link: share it, and see how many people joined
// PayTree through it. Every public page also carries this link in its
// "Get your own payment page" footer.

import { ShareLink } from "@/components/dashboard/share-link";

export function InviteCard({ link, name, joined }: { link: string; name: string; joined: number }) {
  return (
    <section className="rounded-2xl border border-[#DCE5DF] bg-white p-5 sm:p-6">
      <h1 className="font-serif text-[32px] leading-[1.05] text-[#064E3B]">Invite friends 🎁</h1>
      <p className="mt-2 text-[15px] text-[#3F574C]">
        This is your personal invite link. Share it with friends and businesses who get paid by Cash App, Zelle or
        Venmo. Your payment page already includes it at the bottom, in &ldquo;Get your own payment page&rdquo;.
      </p>
      <p className="mt-4 break-all rounded-xl bg-[#F4F8F6] px-4 py-3 font-semibold text-[#064E3B]">
        {link.replace(/^https?:\/\//, "")}
      </p>
      <div className="mt-3">
        <ShareLink url={link} name={name} />
      </div>
      <div className="mt-2 rounded-xl border border-[#DCE5DF] p-4">
        <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-[#4B6358]">Joined through your link</p>
        <p className="mt-1 font-serif text-[34px] leading-none text-[#064E3B]">{joined}</p>
      </div>
    </section>
  );
}
