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
          50: "#f3f6ee",
          100: "#dde8d2",
          500: "#4E7A3D",
          600: "#143A1F",
          700: "#143A1F",
          900: "#143A1F"
        },
        earth: {
          50: "#ECE7D1",
          100: "#f4dfaa",
          500: "#DFAE4A",
          700: "#9A6D1F"
        },
        tomato: "#d94b35",
        ink: "#162016"
      },
      boxShadow: {
        soft: "0 18px 48px rgba(20, 58, 31, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
