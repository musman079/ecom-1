import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      transitionTimingFunction: {
        kinetic: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      transitionDuration: {
        reveal: "600ms",
      },
    },
  },
  plugins: [],
};

export default config;
