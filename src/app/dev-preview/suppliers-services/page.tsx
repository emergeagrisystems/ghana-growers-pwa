import {notFound} from "next/navigation";
import {SupplierFrame} from "@/components/suppliers-preview/SupplierFrame";
import {SupplierBrowse} from "@/components/suppliers-preview/SupplierBrowse";
import {readSuppliers} from "@/lib/suppliers-preview";
import {getProviderFixtures} from "./fixtures";
export const dynamic="force-dynamic";export const metadata={title:"Suppliers & Services · Protected Preview",robots:{index:false,follow:false}};

export default function Page({searchParams}:{searchParams:Record<string,string|string[]|undefined>}){if(process.env.VERCEL_ENV==="production")notFound();const items=getProviderFixtures(),q=new URLSearchParams();for(const[k,v]of Object.entries(searchParams))if(typeof v==="string")q.set(k,v);return <SupplierFrame><SupplierBrowse items={items} initial={readSuppliers(q,items)}/></SupplierFrame>;}
