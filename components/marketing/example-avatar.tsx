// components/marketing/example-avatar.tsx
//
// Logo for the homepage example: an invented coffee shop, drawn in
// PayTree's colors. Not a real business.

export function ExampleAvatar({ size = 56 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      className="rounded-full ring-[3px] ring-[#D9B873]/60"
    >
      <circle cx="32" cy="32" r="32" fill="#FBF6EA" />
      <circle cx="32" cy="32" r="27" fill="none" stroke="#D9B873" strokeWidth="1" />
      {/* steam */}
      <path
        d="M26 17c-2 2 2 4 0 6 M32 15c-2 2 2 4 0 6 M38 17c-2 2 2 4 0 6"
        fill="none"
        stroke="#D9B873"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* cup */}
      <path d="M19 27h24v7a12 12 0 0 1-12 12h0a12 12 0 0 1-12-12z" fill="#064E3B" />
      <path d="M43 29.5h2.5a4.5 4.5 0 0 1 0 9H42" fill="none" stroke="#064E3B" strokeWidth="2.6" />
      {/* saucer */}
      <path d="M16 49h31" stroke="#064E3B" strokeWidth="2.6" strokeLinecap="round" />
      {/* leaf mark on the cup */}
      <path d="M31 31c4 0 6 3 6 6-4 0-6-3-6-6z M31 31l5 5" fill="#D9B873" stroke="#D9B873" strokeWidth="0.8" />
    </svg>
  );
}
