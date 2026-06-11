import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { FloatingWhatsAppButton } from "@/components/FloatingWhatsAppButton";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PwaRegister } from "@/components/PwaRegister";
import { siteConfig } from "@/data/site";

const PREVIEW_COOKIE = "ghana_growers_dev_preview";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} | Farmers, Buyers and Suppliers in Ghana`,
    template: `%s | ${siteConfig.name}`
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  manifest: "/manifest.json",
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    images: ["/images/marketplace/ghana-market-1.jpg"],
    locale: "en_GH",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: ["/images/marketplace/ghana-market-1.jpg"]
  }
};

export const viewport: Viewport = {
  themeColor: "#477d22",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const prelaunchEnabled = process.env.SITE_PRELAUNCH !== "false";
  const previewEnabled = cookies().get(PREVIEW_COOKIE)?.value === "enabled";
  const showPublicShell = !prelaunchEnabled || previewEnabled;

  return (
    <html lang="en-GH">
      <body className="min-h-screen antialiased">
        <PwaRegister />
        {showPublicShell ? <Header /> : null}
        <main>{children}</main>
        {showPublicShell ? <Footer /> : null}
        {showPublicShell ? <FloatingWhatsAppButton /> : null}
      </body>
    </html>
  );
}
