import {notFound} from "next/navigation";
import {SupplierFrame} from "@/components/suppliers-preview/SupplierFrame";
import {SupplierFlow} from "@/components/suppliers-preview/SupplierFlow";
export const dynamic="force-dynamic";export const metadata={title:"Suppliers & Services · Protected Preview",robots:{index:false,follow:false}};

export default function Page(){if(process.env.VERCEL_ENV==="production")notFound();return <SupplierFrame><SupplierFlow mode="entry" back="/dev-preview/list-a-product"/></SupplierFrame>;}
