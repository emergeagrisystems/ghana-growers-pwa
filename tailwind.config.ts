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
          50: "#f1f8ea",
          100: "#dff0cf",
          500: "#5f9f2f",
          600: "#477d22",
          700: "#35601b",
          900: "#19330e"
        },
        earth: {
          50: "#fff8ed",
          100: "#f7e8bd",
          500: "#DFAE4A",
          700: "#8a641c"
        },
        tomato: "#d94b35",
        ink: "#132013"
      },
      boxShadow: {
        soft: "0 16px 45px rgba(19, 32, 19, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
