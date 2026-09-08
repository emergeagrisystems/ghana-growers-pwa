import { notFound } from "next/navigation";
import { PreviewHeader,PreviewFooter } from "@/components/homepage/PreviewChrome";
import { foundationFont } from "@/components/homepage-foundation/font";
import { getHomepagePreviewMedia } from "@/app/dev-preview/amended-homepage/media";
import shared from "@/styles/amended-homepage.module.css";
import styles from "@/styles/marketplace-preview.module.css";
export function MarketplacePreviewFrame({children}:{children:React.ReactNode}) {
 if(process.env.VERCEL_ENV==="production")notFound();
 const {logo}=getHomepagePreviewMedia();
 return <div className={`${shared.page} ${foundationFont.variable} ${styles.page}`} data-marketplace-preview><a className={shared.skipLink} href="#marketplace-content">Skip to page content</a><PreviewHeader logo={logo}/><aside className={shared.review}><strong>Marketplace · Protected Preview</strong><p>Synthetic listings only, not real offers or stock. Illustrations do not establish seller identity, quality or availability. No request, application or payment is sent.</p></aside><div className={styles.content} id="marketplace-content" tabIndex={-1}>{children}</div><PreviewFooter logo={logo}/></div>;
}
