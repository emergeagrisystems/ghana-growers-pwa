import {notFound} from "next/navigation";
import {MarketplacePreviewFrame} from "@/components/marketplace-preview/MarketplacePreviewFrame";
export const dynamic="force-dynamic";
export const metadata={title:"Marketplace · Protected Preview",robots:{index:false,follow:false}};
import {MarketplacePreviewForm} from "@/components/marketplace-preview/MarketplacePreviewForm";
export default function Page(){if(process.env.VERCEL_ENV==="production")notFound();return <MarketplacePreviewFrame><MarketplacePreviewForm mode="listing" back="/dev-preview/list-a-product"/></MarketplacePreviewFrame>;}
