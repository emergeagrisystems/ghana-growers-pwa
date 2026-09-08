import {notFound} from "next/navigation";
import {MarketplacePreviewFrame} from "@/components/marketplace-preview/MarketplacePreviewFrame";
export const dynamic="force-dynamic";
export const metadata={title:"Marketplace · Protected Preview",robots:{index:false,follow:false}};
import {MarketplacePreviewBrowse} from "@/components/marketplace-preview/MarketplacePreviewBrowse";
import {readMarketplace} from "@/lib/marketplace-preview";
import {getMarketplaceFixtures} from "./fixtures";
export default function Page({searchParams}:{searchParams:Record<string,string|string[]|undefined>}){if(process.env.VERCEL_ENV==="production")notFound();const items=getMarketplaceFixtures(),p=new URLSearchParams();for(const [k,v] of Object.entries(searchParams))if(typeof v==="string")p.set(k,v);return <MarketplacePreviewFrame><MarketplacePreviewBrowse items={items} initial={readMarketplace(p,items)}/></MarketplacePreviewFrame>;}
