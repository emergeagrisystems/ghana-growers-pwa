import {notFound} from "next/navigation";
import {PreviewHeader,PreviewFooter} from "@/components/homepage/PreviewChrome";
import {foundationFont} from "@/components/homepage-foundation/font";
import {getHomepagePreviewMedia} from "@/app/dev-preview/amended-homepage/media";
import shared from "@/styles/amended-homepage.module.css";
import styles from "@/styles/suppliers-preview.module.css";
export function SupplierFrame({children}:{children:React.ReactNode}){
 if(process.env.VERCEL_ENV==="production")notFound();
 const {logo}=getHomepagePreviewMedia();
 return <div className={`${shared.page} ${foundationFont.variable} ${styles.page}`} data-suppliers-preview><a className={shared.skipLink} href="#supplier-content">Skip to page content</a><PreviewHeader logo={logo}/><aside className={shared.review}><strong>Suppliers &amp; Services · Protected Preview</strong><p>Synthetic providers, not real businesses or offers. Imagery placeholders establish no identity, stock or coverage. Nothing is sent, uploaded or published.</p></aside><div className={styles.content} id="supplier-content" tabIndex={-1}>{children}</div><PreviewFooter logo={logo}/></div>;
}
