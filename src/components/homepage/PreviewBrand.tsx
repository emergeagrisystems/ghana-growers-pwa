"use client";
import { useState } from "react";
import Image from "next/image";
import styles from "@/styles/amended-homepage.module.css";
// TEMPORARY LEGACY ASSET, not final/cleared/evidence. Exact registered raster,
// displayed through a fixed CSS crop only; geometry and original bytes unchanged.
// Both reviewed shell call sites use this single replacement point.
export function PreviewBrand({logo}: {logo?: string}) {
 const [failed,setFailed]=useState(false);
 return <a className={styles.previewBrand} href="/dev-preview/amended-homepage" aria-label="Ghana Growers home">{logo&&!failed&&<span className={styles.legacyLogoCrop} aria-hidden="true"><Image unoptimized src={logo} alt="" width={1536} height={1212} onError={()=>setFailed(true)}/></span>}<span>Ghana Growers</span></a>;
}
