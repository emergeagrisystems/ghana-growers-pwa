import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FarmerPreviewFrame } from "@/components/farmer-preview/FarmerPreviewFrame";
import { FarmerPreviewDirectory } from "@/components/farmer-preview/FarmerPreviewDirectory";
import { readDirectory } from "@/lib/farmer-preview";
import { getFarmerFixtures } from "./fixtures";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Find farmers · Protected Preview",robots:{index:false,follow:false},description:"Synthetic farmer discovery for protected review."};
export default function Page({searchParams}:{searchParams:Record<string,string|string[]|undefined>}){
 if(process.env.VERCEL_ENV==="production")notFound();
 const items=getFarmerFixtures(),params=new URLSearchParams();for(const [key,value] of Object.entries(searchParams))if(typeof value==="string")params.set(key,value);
 return <FarmerPreviewFrame><FarmerPreviewDirectory items={items} initial={readDirectory(params,items)}/></FarmerPreviewFrame>;
}
