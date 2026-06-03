import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "var(--font-geist)", "Segoe UI", "system-ui", "sans-serif"],
        display: ["Inter", "var(--font-geist)", "Segoe UI", "system-ui", "sans-serif"],
      },
      colors: {
        kinetic: {
          bg: "#0c0a09",
          surface: "#171412",
          "surface-2": "#1f1a17",
          primary: "#dfb257",
          "primary-2": "#e59a3b",
          accent: "#a78bfa",
          danger: "#ff9aa5",
          text: "#eaf2ff",
          muted: "#a8b5d1",
        },
      },
      transitionTimingFunction: {
        kinetic: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      transitionDuration: {
        reveal: "600ms",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 2.5s ease-in-out infinite",
        "glow-pulse": "glow-pulse 4s ease-in-out infinite",
        gradient: "gradient-shift 6s ease infinite",
        marquee: "marquee 30s linear infinite",
        "spin-slow": "spin-slow 20s linear infinite",
        "scale-in": "scale-in 0.5s cubic-bezier(0.22,1,0.36,1) both",
        "slide-up": "slide-up 0.6s cubic-bezier(0.22,1,0.36,1) both",
        "border-glow": "border-glow 3s ease-in-out infinite",
      },
      backgroundImage: {
        "gradient-kinetic": "linear-gradient(135deg, #dfb257, #e59a3b, #a78bfa)",
        "gradient-primary": "linear-gradient(135deg, #dfb257, #e59a3b)",
      },
      backdropBlur: {
        xs: "2px",
        "3xl": "64px",
      },
    },
  },
  plugins: [],
};

export default config;
