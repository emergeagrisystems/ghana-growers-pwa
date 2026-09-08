import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FarmerPreviewFrame } from "@/components/farmer-preview/FarmerPreviewFrame";
import { FarmerPreviewEntry } from "@/components/farmer-preview/FarmerPreviewEntry";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"List Your Farm · Protected Preview",robots:{index:false,follow:false},description:"Farmer entry validation demonstration. Nothing is submitted."};
export default function Page(){if(process.env.VERCEL_ENV==="production")notFound();return <FarmerPreviewFrame><FarmerPreviewEntry/></FarmerPreviewFrame>;}
