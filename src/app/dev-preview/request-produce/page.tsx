import {safeDirectoryReturn} from "@/lib/farmer-preview";
import {notFound} from "next/navigation";
import {MarketplacePreviewFrame} from "@/components/marketplace-preview/MarketplacePreviewFrame";
export const dynamic="force-dynamic";
export const metadata={title:"Marketplace · Protected Preview",robots:{index:false,follow:false}};
import {MarketplacePreviewForm} from "@/components/marketplace-preview/MarketplacePreviewForm";
import {getMarketplaceFixtures} from "../marketplace/fixtures";
import {getFarmerFixtures} from "../farmers/fixtures";
import {safeMarketplaceReturn,listingUrl} from "@/lib/marketplace-preview";
export default function Page({searchParams}:{searchParams:{listing?:string;farmer?:string;from?:string;profileReturn?:string}}){if(process.env.VERCEL_ENV==="production")notFound();const items=getMarketplaceFixtures(),item=items.find(i=>i.id===searchParams.listing),farmer=getFarmerFixtures().find(f=>f.id===searchParams.farmer);if((searchParams.listing&&!item)||(searchParams.farmer&&!farmer)||(item&&farmer))notFound();let farmerBack=farmer?"/dev-preview/farmers/"+farmer.id:"";
 if(farmer&&typeof searchParams.profileReturn==="string"){try{const u=new URL(searchParams.profileReturn,"https://preview.invalid");if(u.origin==="https://preview.invalid"&&u.pathname===farmerBack){const p=new URLSearchParams({from:safeDirectoryReturn(u.searchParams.get("from")||undefined,getFarmerFixtures())});const linked=items.find(i=>i.id===u.searchParams.get("listing")&&i.farmerId===farmer.id);if(linked){p.set("listing",linked.id);p.set("marketFrom",safeMarketplaceReturn(u.searchParams.get("marketFrom")||undefined,items));}farmerBack+="?"+p;}}catch{}}
 const back=item?listingUrl(item.id,safeMarketplaceReturn(typeof searchParams.from==="string"?searchParams.from:undefined,items)):farmer?farmerBack:"/dev-preview/marketplace";return <MarketplacePreviewFrame><MarketplacePreviewForm mode="request" context={item?item.title+" / "+item.product:farmer?.name} product={item?.product} back={back}/></MarketplacePreviewFrame>;}
