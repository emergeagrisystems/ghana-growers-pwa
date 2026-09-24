/* eslint-disable @next/next/no-img-element */
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { foundationFont } from "@/components/homepage-foundation/font";
import s from "./PublicShell.module.css";
const links = [["Ask Mama G","/farmer-hub","5fdbb"],["Farms & Suppliers","/directory","67d20"],["Market","/marketplace","eed34"],["Learn","/learn","273b2"]];
export function PublicHeader(){
  const [open,setOpen]=useState(false);
  const trigger=useRef<HTMLButtonElement>(null);
  const pathname=usePathname();
  useEffect(()=>{setOpen(false)},[pathname]);
  useEffect(()=>{if(!open)return;const close=(e:KeyboardEvent)=>{if(e.key==="Escape"){setOpen(false);trigger.current?.focus()}};document.addEventListener("keydown",close);return()=>document.removeEventListener("keydown",close)},[open]);
  return <header className={`${s.header} ${foundationFont.className}`}>
    <div className={s.contact}><span><img src="/rc1/e1aee.svg" alt="" width="20" height="20"/>Human support is not available yet</span></div>
    <nav className={s.navigation} aria-label="Main navigation"><Link href="/" className={s.brand}>GHANA GROWERS</Link><div className={s.desktopLinks}>{links.map(([label,href,icon])=><Link href={href} key={href} aria-current={pathname.startsWith(href)?"page":undefined}><img src={`/rc1/${icon}.svg`} alt="" width="20" height="20"/>{label}</Link>)}</div><div className={s.navActions}><button disabled className={s.post} title="Listing submissions are unavailable">Post a Listing</button><button disabled className={s.join} title="Registration is unavailable"><img src="/rc1/a7cc6.svg" alt="" width="20" height="20"/>Join</button><button ref={trigger} className={s.menuButton} onClick={()=>setOpen(!open)} aria-expanded={open} aria-controls="rc1-mobile-menu">{open?"Close":"Menu"}<span aria-hidden="true">{open?"×":"☰"}</span></button></div></nav>
    {open && <nav id="rc1-mobile-menu" className={s.mobileMenu} aria-label="Mobile navigation">{links.map(([label,href])=><Link href={href} key={href} aria-current={pathname.startsWith(href)?"page":undefined} onClick={()=>{setOpen(false);trigger.current?.focus()}}>{label}</Link>)}<p>Registration, listing submissions and human support are not available yet.</p></nav>}
  </header>;
}
const groups=[{title:"PLATFORM",links:links.map(([label,href])=>[label,href])},{title:"COMPANY",links:[["About Us","/about"],["How it works","/#how-it-works"],["Careers","/about/careers"],["Contact","/contact"]]},{title:"INFORMATION",links:[["How information is checked","/verification-process"],["Privacy policy","/privacy-policy"],["Terms of use","/terms-of-use"]]}];
export function PublicFooter(){return <footer className={`${s.footer} ${foundationFont.className}`}><div className={s.columns}><div className={s.footerBrand}><Link href="/">GHANA GROWERS</Link><strong>Direct Connections. Smart Innovations</strong><p>Connect with farms and agricultural providers across Ghana. Find produce, farm supplies and tools.</p></div><div className={s.destinations}>{groups.map(group=><nav aria-label={group.title} key={group.title}><h2>{group.title}</h2>{group.links.map(([label,href])=><Link key={label} href={href} className={s.footerLink}>{label}</Link>)}</nav>)}</div></div><div className={s.footerBottom}><div className={s.socials}>{[["YouTube","bb023"],["Instagram","61009"],["Facebook","e4c93"]].map(([name,icon])=><button key={name} disabled aria-label={`${name} unavailable: public destination pending`} title={`${name} destination pending`}><img src={`/rc1/${icon}.svg`} width="24" height="24" alt=""/></button>)}</div><p>Powered by Emerge Agri Systems (E.A.Sy.)</p></div></footer>}
