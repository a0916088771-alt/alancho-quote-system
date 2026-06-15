import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#181716",
        mist: "#f6f4f1",
        paper: "#fbfaf8",
        line: "#ded9d2",
        warm: "#a39a8d"
      },
      fontFamily: {
        sans: [
          "Inter",
          "Noto Sans TC",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif"
        ],
        serif: ["Georgia", "serif"]
      },
      boxShadow: {
        soft: "0 24px 80px rgba(24, 23, 22, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
