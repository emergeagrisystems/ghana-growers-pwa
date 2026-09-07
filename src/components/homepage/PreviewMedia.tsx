"use client";
import { useState } from "react";
import Image from "next/image";
import styles from "@/styles/amended-homepage.module.css";
export type ProduceIllustration = {crop: string; src: string};
export type HomepageMedia = {logo: string; produce: Record<string, ProduceIllustration>};
export function ProduceMedia({image,category}: {image?: ProduceIllustration; category: string}) {
 const [failed,setFailed]=useState(false);
 if(!image || failed) return <div className={styles.cropPlaceholder}><span aria-hidden="true">{category}</span><p>Neutral image placeholder · not evidence of this listing</p></div>;
 return <figure className={styles.produceMedia}><Image unoptimized src={image.src} alt={`Illustrative bulk ${image.crop}; not evidence of this synthetic listing.`} width={600} height={400} onError={()=>setFailed(true)}/><figcaption>Illustrative {image.crop} · not this listing</figcaption></figure>;
}
export function listingIllustration(category: string,index: number,media: HomepageMedia) {
 const crops=category==='Vegetables'?['tomatoes','peppers','onions','garden eggs']:category==='Fruits'?['pineapple','mango','plantain','pineapple']:[];
 return media.produce[crops[index]];
}
