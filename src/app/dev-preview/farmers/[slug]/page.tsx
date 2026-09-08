import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FarmerPreviewFrame } from "@/components/farmer-preview/FarmerPreviewFrame";
import { FarmerPreviewProfile } from "@/components/farmer-preview/FarmerPreviewProfile";
import { safeDirectoryReturn } from "@/lib/farmer-preview";
import { getFarmerFixtures } from "../fixtures";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Farmer profile · Protected Preview",robots:{index:false,follow:false},description:"Synthetic farmer profile for protected review."};
export default function Page({params,searchParams}:{params:{slug:string};searchParams:{from?:string;state?:string}}){
 if(process.env.VERCEL_ENV==="production")notFound();
 const items=getFarmerFixtures(),farmer=items.find(i=>i.id===params.slug);if(!farmer)notFound();
 return <FarmerPreviewFrame><FarmerPreviewProfile farmer={farmer} back={safeDirectoryReturn(typeof searchParams.from==="string"?searchParams.from:undefined,items)} scenario={typeof searchParams.state==="string"?searchParams.state:""}/></FarmerPreviewFrame>;
}
