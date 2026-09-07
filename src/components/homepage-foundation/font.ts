import localFont from "next/font/local";

export const foundationFont = localFont({
  src: "../../../public/fonts/dm-sans/dm-sans-roman.woff2",
  style: "normal",
  weight: "100 1000",
  display: "swap",
  variable: "--gg-hf-font",
  fallback: ["system-ui", "Segoe UI", "Arial", "sans-serif"],
  adjustFontFallback: false
});
