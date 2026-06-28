import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/data/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        leaf: {
          50: "#EEF3E8",
          100: "#DDE8D2",
          500: "#4E7A3D",
          600: "#143A1F",
          700: "#143A1F",
          900: "#143A1F"
        },
        earth: {
          50: "#F7F6EF",
          100: "#F2E6C2",
          500: "#DFAE4A",
          700: "#9A6D1F"
        },
        cocoa: {
          50: "#F3ECE4",
          500: "#6B4A2F",
          700: "#553922"
        },
        mist: "#EEF3E8",
        tomato: "#d94b35",
        ink: "#162016"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(20, 58, 31, 0.12)",
        card: "0 14px 40px rgba(20, 58, 31, 0.08)"
      },
      borderRadius: {
        md: "12px",
        lg: "16px",
        xl: "20px"
      },
      transitionDuration: {
        DEFAULT: "200ms"
      }
    }
  },
  plugins: []
};

export default config;
