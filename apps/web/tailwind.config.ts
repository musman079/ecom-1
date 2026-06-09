import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
        display: ["var(--font-cormorant)", "Cormorant Garamond", "serif"],
        heading: ["var(--font-playfair)", "Playfair Display", "serif"],
      },
      colors: {
        primary: {
          DEFAULT: "#080808", // Primary Background
        },
        secondary: {
          DEFAULT: "#111111", // Secondary Background
        },
        surface: {
          DEFAULT: "#1A1A1A", // Surface
        },
        gold: {
          DEFAULT: "#C8A96E", // Accent Gold
          light: "#E2C98A",   // Accent Gold Light
        },
        text: {
          primary: "#F0EDE8",
          secondary: "#8A8580",
          tertiary: "#4A4845",
        },
        status: {
          success: "#4CAF7D",
          error: "#E05C5C",
        },
      },
      borderRadius: {
        card: "2px",
        pill: "100px",
      },
      transitionTimingFunction: {
        "luxury-ease": "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      },
    },
  },
  plugins: [],
};

export default config;
