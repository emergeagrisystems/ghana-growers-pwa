import {notFound} from "next/navigation";
import {SupplierFrame} from "@/components/suppliers-preview/SupplierFrame";
import {ProviderProfile} from "@/components/suppliers-preview/ProviderProfile";
import {safeSupplierReturn} from "@/lib/suppliers-preview";
import {getProviderFixtures} from "../fixtures";
export const dynamic="force-dynamic";export const metadata={title:"Suppliers & Services · Protected Preview",robots:{index:false,follow:false}};

export default function Page({params,searchParams}:{params:{id:string};searchParams:{from?:string;state?:string}}){if(process.env.VERCEL_ENV==="production")notFound();const items=getProviderFixtures(),p=items.find(x=>x.id===params.id);if(!p)notFound();return <SupplierFrame><ProviderProfile provider={p} back={safeSupplierReturn(searchParams.from,items)} state={["checked","under-review","unavailable","withdrawn","enquiry-unavailable"].includes(searchParams.state||"")?searchParams.state!:""}/></SupplierFrame>;}
