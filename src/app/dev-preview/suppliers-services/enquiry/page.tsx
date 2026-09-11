import {notFound} from "next/navigation";
import {SupplierFrame} from "@/components/suppliers-preview/SupplierFrame";
import {SupplierFlow} from "@/components/suppliers-preview/SupplierFlow";
import {providerUrl,safeSupplierReturn} from "@/lib/suppliers-preview";
import {getProviderFixtures} from "../fixtures";
export const dynamic="force-dynamic";export const metadata={title:"Suppliers & Services · Protected Preview",robots:{index:false,follow:false}};

export default function Page({searchParams}:{searchParams:{provider?:string;from?:string}}){if(process.env.VERCEL_ENV==="production")notFound();const items=getProviderFixtures(),p=items.find(x=>x.id===searchParams.provider);if(!p)notFound();return <SupplierFrame><SupplierFlow mode="enquiry" providerName={p.name} back={providerUrl(p.id,safeSupplierReturn(searchParams.from,items))}/></SupplierFrame>;}
