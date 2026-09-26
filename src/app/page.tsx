/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { PublicCardRail } from "@/components/homepage/PublicCardRail";
import { ApprovedMamaGPhone } from "@/components/homepage/ApprovedMamaGPhone";
import { foundationFont } from "@/components/homepage-foundation/font";
import { FarmerProfileImage } from "@/components/FarmerProfileImage";
import { getFarmersData, getSuppliersData } from "@/lib/supabase/publicData";
import { cleanFarmerLocation, farmerCardProducts } from "@/lib/farmerDirectory";
import { getPreviewMamaPalette } from "@/lib/previewMamaPalette";
import { createPageMetadata } from "@/lib/seo";
import s from "./HomePage.module.css";

export const metadata = createPageMetadata({title:"Ghana Growers | Buy. Sell. Connect. Grow smarter.",description:"Find farms, produce, agricultural supplies and practical farming guidance in Ghana.",path:"/"});
const platforms = [
  ["Marketplace","Find farm-fresh produce, farm supplies and tools — all in one place.","/marketplace","3e969"],
  ["Ask Mama G","Ask farming questions. Check crop concerns. Get practical guidance.","/farmer-hub","a1315"],
  ["Farms & Suppliers","Find farms, suppliers and agricultural services by location.","/directory","ff1e6"],
  ["Learn","Farming know-how, made simple.","/learn","e0873"]
];
const categories = [
  ["Fruits and Vegetables","fresh-produce"], ["Livestock & Dairy","livestock"],
  ["Tubers & Plantain","fresh-produce"], ["Farm Equipment","farm-tools"],
  ["Seeds and Planting Material","farm-inputs"]
];
export default async function HomePage({searchParams}: {searchParams: {mamaPalette?: string | string[]}}){
  const mamaPalette = getPreviewMamaPalette(searchParams.mamaPalette);
  const mamaHref = mamaPalette ? `/farmer-hub?mamaPalette=${mamaPalette}` : "/farmer-hub";
  const [farmers,suppliers] = await Promise.all([getFarmersData(),getSuppliersData()]);
  const profiles = farmers.status === "ready" ? farmers.data : [];
  return <div className={`${s.homepage} ${foundationFont.className}`} data-mama-palette={mamaPalette ?? undefined}>
    <section className={s.hero} aria-labelledby="hero-title">
      <img className={s.heroMotif} src="/rc1/8f445.svg" alt="" />
      <div className={s.heroCopy}>
        <p className={s.eyebrow}>Fresh produce · Farm inputs · Smart farming</p>
        <h1 id="hero-title">Buy. <span>Sell.</span> Connect<br/>Grow smarter.</h1>

        <div className={s.actions}><Link className={s.wineButton} href={mamaHref}>Ask Mama G</Link><Link className={s.outlineButton} href="/marketplace">Browse Market</Link></div>
      </div>
      <form action="/marketplace" className={s.search} role="search"><label className="sr-only" htmlFor="home-search">Search produce, inputs or tools</label><input id="home-search" name="search" placeholder="Search produce, inputs or tools"/><button className={s.greenButton}>Search</button></form>
      <nav className={s.categories} aria-label="Popular searches">{["Vegetables","Fruits","Livestock","Farm Inputs","Farm Tools"].map(x=><Link key={x} href={`/marketplace?search=${encodeURIComponent(x)}`}>{x}</Link>)}<span aria-disabled="true" title="All Crops is not available yet">All Crops · Coming soon</span></nav>
    </section>
    <section className={s.platform}><h2>One platform, everything you need</h2><div className={s.platformGrid}>{platforms.map(([title,copy,href,icon])=><Link href={href} key={title} className={s.platformCard}><img src={`/rc1/${icon}.svg`} alt="" width="56" height="56"/><h3>{title}</h3><p>{copy}</p></Link>)}</div></section>
    <section className={s.mama}><div className={s.mamaPanel}/><div className={s.mamaCopy}><h2>Got a farming question?</h2><p>Ask Mama G about crop concerns, planting, timing and everyday farm decisions.</p><Link className={s.wineButton} href={mamaHref}>Ask Mama G</Link><p className={s.small}>AI guidance, not a confirmed diagnosis. Check important decisions with qualified local advice.</p></div><div className={s.phone}><ApprovedMamaGPhone/></div></section>
    <section className={s.market}><h2>Marketplace</h2><p>Browse produce and sourcing options.</p><PublicCardRail className={s.marketGrid} label="Market categories">{categories.map(([label,category])=><Link href={`/marketplace?category=${category}`} className={s.marketCard} key={label}><div className={s.marketImage}><img src="/rc1/a87f7.svg" alt="" width="28" height="28"/></div><div><h3>{label}</h3><p>Browse category</p></div></Link>)}</PublicCardRail><div className={s.actions}><Link className={s.amberButton} href="/marketplace">Browse Market</Link><button disabled className={s.outlineButton}>Request Produce · Unavailable</button></div><p className={s.small}>Category illustrations do not show available stock. Payments, delivery and availability must be agreed directly; Ghana Growers does not provide checkout or shipping.</p></section>
    <section className={s.registration}><div className={s.registrationImage}><img src="/rc1/8b7b9.svg" alt="" width="40" height="40"/></div><div><h2>Are you a farmer or supplier?</h2><p>Registration is not available yet.</p><button disabled className={s.greenButton}>Join Ghana Growers · Unavailable</button></div></section>
    <section className={s.farmers}><h2>Find Farms &amp; Agro-Suppliers</h2><p>Explore published profiles across Ghana.</p><nav className={s.directoryTabs} aria-label="Directories"><Link href="/farmer-directory">Farmers</Link><Link href="/supplier-directory">Suppliers</Link></nav>
      {farmers.status === "unavailable" ? <p className={s.empty} role="status">Farmer profiles are temporarily unavailable. Please try again later.</p> : !profiles.length ? <p className={s.empty}>No farmer profiles are published yet. Check back as the directory grows.</p> : <div className={s.farmerGrid}>{profiles.slice(0,4).map(f=><article key={f.slug}><div className={s.farmerImage}>{f.hasRealPhoto && f.mainImage ? <FarmerProfileImage src={f.mainImage} alt={`${f.farmName} farm photo`} variant="card" fallbackKind="farmer" sizes="(min-width:1024px) 25vw, 80vw"/> : <span>Photo unavailable</span>}</div><h3>{f.farmName}</h3><p>{cleanFarmerLocation(f)}</p><p>{farmerCardProducts(f).slice(0,3).join(" · ")}</p><Link href={`/farmer-directory/${f.slug}`}>View profile</Link></article>)}</div>}
      <Link className={s.outlineButton} href="/directory">Browse Farms & Suppliers</Link>
    </section>
    <section className={s.process} id="how-it-works"><h2>Simple as 1, 2, 3</h2><ol>{[["Search","Browse farms, produce and agricultural supplies."],["Connect","Connection requests are not available yet."],["Trade","Check details and agree terms directly before any trade."]].map(([title,copy],i)=><li key={title}><span>{i+1}</span><h3>{title}</h3><p>{copy}</p></li>)}</ol></section>
    <section className={s.metrics} aria-label="Current directory status"><div><strong>{farmers.status === "ready" ? profiles.length : "—"}</strong><span>Published farmers</span></div><div><strong>{suppliers.status === "ready" ? suppliers.data.length : "—"}</strong><span>Published suppliers</span></div><div><strong>Pilot</strong><span>Ask Mama G</span></div></section>
    <section className={s.learn}><h2>Farming know-how, made simple</h2><p>Practical guides and tips to farm smarter.</p><PublicCardRail className={s.learnGrid} label="Learn resources">{[["Weekly Crop Field Check","weekly-crop-field-check","a2167"],["Make Your Own Compost for Healthy Soil","make-your-own-compost-for-healthy-soil","16d12"],["How to Mulch Your Farm and Save Water","how-to-mulch-your-farm-and-save-water","005d2"]].map(([title,slug,icon])=><Link href={`/learn/${slug}`} key={slug}><div className={s.learnImage}><img src={`/rc1/${icon}.svg`} alt="" width="56" height="56"/></div><div><p>GUIDE</p><h3>{title}</h3></div></Link>)}</PublicCardRail><Link className={s.outlineButton} href="/learn">Browse Learn</Link></section>
  </div>;
}
