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
          bg: "#070d17",
          surface: "#0f1726",
          "surface-2": "#131f33",
          primary: "#65f3de",
          "primary-2": "#4f8cff",
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
        "gradient-kinetic": "linear-gradient(135deg, #65f3de, #4f8cff, #a78bfa)",
        "gradient-primary": "linear-gradient(135deg, #65f3de, #4f8cff)",
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
