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
        brand: {
          forest: "rgb(var(--gg-forest-trust) / <alpha-value>)",
          ivory: "rgb(var(--gg-morning-ivory) / <alpha-value>)",
          cream: "rgb(var(--gg-soft-cream) / <alpha-value>)",
          gold: "rgb(var(--gg-harvest-gold) / <alpha-value>)",
          ink: "rgb(var(--gg-forest-ink) / <alpha-value>)",
          grower: "rgb(var(--gg-grower-green) / <alpha-value>)",
          sage: "rgb(var(--gg-leaf-sage) / <alpha-value>)",
          mist: "rgb(var(--gg-morning-mist) / <alpha-value>)",
          cocoa: "rgb(var(--gg-cocoa-earth) / <alpha-value>)",
          border: "rgb(var(--gg-border-mist) / <alpha-value>)",
          danger: "rgb(var(--gg-signal-red) / <alpha-value>)",
          surface: "rgb(var(--gg-functional-white) / <alpha-value>)"
        },
        leaf: {
          50: "rgb(var(--gg-morning-mist) / <alpha-value>)",
          100: "rgb(var(--gg-border-mist) / <alpha-value>)",
          300: "rgb(var(--gg-leaf-sage) / <alpha-value>)",
          500: "rgb(var(--gg-grower-green) / <alpha-value>)",
          600: "rgb(var(--gg-forest-trust) / <alpha-value>)",
          700: "rgb(var(--gg-forest-trust) / <alpha-value>)",
          800: "rgb(var(--gg-forest-trust) / <alpha-value>)",
          900: "rgb(var(--gg-forest-trust) / <alpha-value>)"
        },
        earth: {
          50: "rgb(var(--gg-morning-ivory) / <alpha-value>)",
          100: "rgb(var(--gg-soft-cream) / <alpha-value>)",
          300: "rgb(var(--gg-soft-cream) / <alpha-value>)",
          400: "rgb(var(--gg-harvest-gold) / <alpha-value>)",
          500: "rgb(var(--gg-harvest-gold) / <alpha-value>)",
          600: "rgb(var(--gg-harvest-gold) / <alpha-value>)",
          700: "rgb(var(--gg-cocoa-earth) / <alpha-value>)",
          800: "rgb(var(--gg-cocoa-earth) / <alpha-value>)"
        },
        cocoa: {
          50: "rgb(var(--gg-morning-ivory) / <alpha-value>)",
          500: "rgb(var(--gg-cocoa-earth) / <alpha-value>)",
          700: "rgb(var(--gg-cocoa-earth) / <alpha-value>)"
        },
        mist: "rgb(var(--gg-morning-mist) / <alpha-value>)",
        tomato: "rgb(var(--gg-signal-red) / <alpha-value>)",
        ink: "rgb(var(--gg-forest-ink) / <alpha-value>)"
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
