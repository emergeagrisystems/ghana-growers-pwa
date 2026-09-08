import { notFound } from "next/navigation";
import { PreviewHeader, PreviewFooter } from "@/components/homepage/PreviewChrome";
import { foundationFont } from "@/components/homepage-foundation/font";
import { getHomepagePreviewMedia } from "@/app/dev-preview/amended-homepage/media";
import shared from "@/styles/amended-homepage.module.css";
import styles from "@/styles/farmer-preview.module.css";
export function FarmerPreviewFrame({children}:{children:React.ReactNode}) {
 if(process.env.VERCEL_ENV==="production")notFound();
 const {logo}=getHomepagePreviewMedia();
 return <div className={`${shared.page} ${foundationFont.variable} ${styles.page}`} data-farmer-preview>
  <a className={shared.skipLink} href="#farmer-content">Skip to page content</a><PreviewHeader logo={logo}/>
  <aside className={shared.review}><strong>Farmer discovery · Protected Preview</strong><p>Synthetic records only, not real farmers or offers. Search covers these fixtures only. No real checks, application submissions or sourcing requests take place here.</p></aside>
  <div id="farmer-content" tabIndex={-1} className={styles.content}>{children}</div><PreviewFooter logo={logo}/>
 </div>;
}
