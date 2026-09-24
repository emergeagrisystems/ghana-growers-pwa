import {getMarketplaceFixtures} from "../../marketplace/fixtures";
import {safeMarketplaceReturn,listingUrl} from "@/lib/marketplace-preview";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FarmerPreviewFrame } from "@/components/farmer-preview/FarmerPreviewFrame";
import { FarmerPreviewProfile } from "@/components/farmer-preview/FarmerPreviewProfile";
import { safeDirectoryReturn } from "@/lib/farmer-preview";
import { getFarmerFixtures } from "../fixtures";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Farmer profile · Protected Preview",robots:{index:false,follow:false},description:"Synthetic farmer profile for protected review."};
export default function Page({params,searchParams}:{params:{slug:string};searchParams:{from?:string;state?:string;listing?:string;marketFrom?:string}}){
 if(process.env.VERCEL_ENV==="production")notFound();
 const items=getFarmerFixtures(),farmer=items.find(i=>i.id===params.slug);if(!farmer)notFound();
 const listings=getMarketplaceFixtures(),linked=listings.find(i=>i.id===searchParams.listing&&i.farmerId===farmer.id);
 return <FarmerPreviewFrame><FarmerPreviewProfile farmer={farmer} listingBack={linked?listingUrl(linked.id,safeMarketplaceReturn(typeof searchParams.marketFrom==="string"?searchParams.marketFrom:undefined,listings)):undefined} back={safeDirectoryReturn(typeof searchParams.from==="string"?searchParams.from:undefined,items)} scenario={typeof searchParams.state==="string"?searchParams.state:""}/></FarmerPreviewFrame>;
}
