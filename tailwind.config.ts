// tailwind.config.ts
//
// The existing pages style themselves with arbitrary values such as
// text-[#064E3B], so nothing here is required for them to look right. This file
// supplies the two font families they rely on (font-sans, font-serif) and gives
// the brand colors names for new code to use.

import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      colors: {
        brand: {
          DEFAULT: "#064E3B", // emerald
          deep: "#032F24",
          mist: "#E3F0EA",
          sage: "#E9F1ED",
          ink: "#0B1F18",
          muted: "#4B6358",
          line: "#DCE5DF",
          gold: "#D9B873",
          paper: "#FBFBFB", // luxury off-white
        },
      },
    },
  },
  plugins: [],
};

export default config;
