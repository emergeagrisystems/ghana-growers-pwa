import type { Metadata, Viewport } from "next";
import { cookies, headers } from "next/headers";
import "./globals.css";
import { FloatingWhatsAppButton } from "@/components/FloatingWhatsAppButton";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PwaRegister } from "@/components/PwaRegister";
import { siteConfig } from "@/data/site";
import { previewAccessCookie, verifyPreviewAccessToken } from "@/lib/previewAccess";
import { defaultOgImage, organizationJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} | Farmers, Buyers and Suppliers in Ghana`,
    template: `%s | ${siteConfig.name}`
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg"
  },
  openGraph: {
    title: `${siteConfig.name} | Trusted Agriculture Platform for Ghana`,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    images: [
      {
        url: defaultOgImage,
        width: 1778,
        height: 885,
        alt: "Ghana Growers agricultural marketplace platform"
      }
    ],
    locale: "en_GH",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} | Trusted Agriculture Platform for Ghana`,
    description: siteConfig.description,
    images: [defaultOgImage]
  }
};

export const viewport: Viewport = {
  themeColor: "#143A1F",
  width: "device-width",
  initialScale: 1
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const isBrandLab = headers().get("x-ghana-growers-brand-lab") === "1";
  const prelaunchEnabled = process.env.SITE_PRELAUNCH !== "false";
  const previewEnabled = prelaunchEnabled
    ? await verifyPreviewAccessToken(
        cookies().get(previewAccessCookie)?.value,
        process.env.PREVIEW_ACCESS_SECRET
      )
    : false;
  const showPublicShell = !prelaunchEnabled || previewEnabled;

  return (
    <html lang="en-GH">
      <body className="min-h-screen antialiased">
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
        />
        <PwaRegister />
        {previewEnabled && !isBrandLab ? (
          <div className="bg-earth-500 px-4 py-2 text-center text-sm font-black text-leaf-900">
            Admin preview mode
            <a href="/dev-preview?exit=1" className="focus-ring ml-3 rounded-md underline underline-offset-4">
              Exit preview
            </a>
          </div>
        ) : null}
        {isBrandLab ? null : <Header showFullNavigation={showPublicShell} />}
        <main>{children}</main>
        {showPublicShell && !isBrandLab ? <Footer /> : null}
        {showPublicShell && !isBrandLab ? <FloatingWhatsAppButton /> : null}
      </body>
    </html>
  );
}
