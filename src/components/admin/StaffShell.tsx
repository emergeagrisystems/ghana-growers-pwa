"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { LayoutDashboard, Search, PanelsTopLeft, Users, Sprout, Store, Package, MessagesSquare, Menu, X, LogOut } from "lucide-react";
import s from "./staff.module.css";

import {queueLabels} from "@/lib/adminQueueLabels";

const places = [
  {id:"today", name:"Today’s work", Icon:LayoutDashboard}, {id:"find",name:"Find a record",Icon:Search},
  {id:"profiles",name:"Profiles",Icon:Users},{id:"tools",name:"All admin tools",Icon:PanelsTopLeft},
  {id:"farmer", name:queueLabels.farmer, Icon:Sprout},{id:"supplier",name:queueLabels.supplier,Icon:Store},
  {id:"listing",name:queueLabels.listing,Icon:Package},{id:"buyer",name:queueLabels.buyer,Icon:MessagesSquare}
];
function Nav({view,close}:{view:string;close?:()=>void}) {
  return <nav aria-label="Staff workspace">{places.map(({id,name,Icon},i)=><div key={id}>{i===4&&<h2>Intake queues</h2>}<Link href={id==="today"?"/admin":"/admin?view="+id} aria-current={view===id?"page":undefined} onClick={close}><Icon size={18} aria-hidden/>{name}</Link></div>)}</nav>;
}
export function StaffShell({view,children}:{view:string;children:ReactNode}) {
  const drawer=useRef<HTMLDialogElement>(null);
  const [logoutError,setLogoutError]=useState(false);
  useEffect(()=>{drawer.current?.close()},[view]);
  async function signOut(){try{const r=await fetch("/api/admin/auth/logout",{method:"POST"});if(!r.ok)throw Error();window.location.assign("/admin/login")}catch{setLogoutError(true)}}
  const exit=<button type="button" onClick={signOut}><LogOut size={16}/> Sign out</button>;
  return <div className={s.shell}><a className={s.skip} href="#staff-main">Skip to work</a>
    <aside className={s.rail}><strong>Ghana Growers</strong><small>Staff workspace</small><Nav view={view}/>{exit}</aside>
    <header className={s.mobile}><button onClick={()=>drawer.current?.showModal()}><Menu size={18}/> Menu</button><b>Ghana Growers</b><Link href="/admin?view=find"><Search size={18}/> Search</Link></header>
    <dialog className={s.drawer} ref={drawer} aria-label="Admin menu"><button onClick={()=>drawer.current?.close()}><X size={18}/> Close menu</button><Nav view={view} close={()=>drawer.current?.close()}/>{exit}</dialog>
    <div id="staff-main" className={s.work} tabIndex={-1}>{logoutError&&<p role="alert">Sign-out failed. Please retry.</p>}{children}</div></div>;
}
