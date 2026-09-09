import {notFound} from "next/navigation";
import {MarketplacePreviewFrame} from "@/components/marketplace-preview/MarketplacePreviewFrame";
export const dynamic="force-dynamic";
export const metadata={title:"Marketplace · Protected Preview",robots:{index:false,follow:false}};
import {MarketplacePreviewDetail} from "@/components/marketplace-preview/MarketplacePreviewDetail";
import {safeMarketplaceReturn} from "@/lib/marketplace-preview";
import {getMarketplaceFixtures} from "../fixtures";
export default function Page({params,searchParams}:{params:{id:string};searchParams:{from?:string;state?:string}}){if(process.env.VERCEL_ENV==="production")notFound();const items=getMarketplaceFixtures(),item=items.find(i=>i.id===params.id);if(!item)notFound();return <MarketplacePreviewFrame><MarketplacePreviewDetail item={item} related={items.filter(other=>other.id!==item.id&&other.category===item.category).slice(0,3)} back={safeMarketplaceReturn(typeof searchParams.from==="string"?searchParams.from:undefined,items)} scenario={typeof searchParams.state==="string"?searchParams.state:""}/></MarketplacePreviewFrame>;}
