import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
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
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-48x48.png", sizes: "48x48", type: "image/png" }
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  },
  openGraph: {
    title: `${siteConfig.name} | Trusted Agriculture Platform for Ghana`,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    images: [
      {
        url: defaultOgImage,
        width: 1200,
        height: 630,
        alt: "Ghana Growers: Buy. Sell. Grow."
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
        {previewEnabled ? (
          <div className="bg-earth-500 px-4 py-2 text-center text-sm font-black text-leaf-900">
            Admin preview mode
            <a href="/dev-preview?exit=1" className="focus-ring ml-3 rounded-md underline underline-offset-4">
              Exit preview
            </a>
          </div>
        ) : null}
        <Header showFullNavigation={showPublicShell} />
        <main>{children}</main>
        {showPublicShell ? <Footer /> : null}
        {showPublicShell ? <FloatingWhatsAppButton /> : null}
      </body>
    </html>
  );
}
