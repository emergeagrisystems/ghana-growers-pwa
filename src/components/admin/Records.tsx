"use client";
import Link from "next/link";
import { useEffect,useRef,useState } from "react";
import type { IntakeRow,ProfileRow,StaffQueue } from "@/lib/adminReadModel";
import { queueLabels } from "@/lib/adminQueueLabels";
import { contactNumber } from "@/lib/adminCrm";
import { CaseDetail } from "./CaseDetail";
import s from "./staff.module.css";

const size=20;
function matches(query:string,fields:string[],phones:string[]){
  const q=query.trim().toLowerCase();
  if(!q||fields.some(f=>f.toLowerCase().includes(q)))return true;
  const digits=q.replace(/\D/g,"");
  return digits.length>=3&&/^[+()\d\s-]+$/.test(q)&&phones.some(p=>p.replace(/\D/g,"").includes(digits)||contactNumber(p)?.includes((contactNumber(q)||digits).replace("+","")));
}
function Pager({page,count,change}:{page:number;count:number;change:(n:number)=>void}){return count>size?<div className={s.actions}><button disabled={page===0} onClick={()=>change(page-1)}>Previous</button><span>Page {page+1} of {Math.ceil(count/size)}</span><button disabled={(page+1)*size>=count} onClick={()=>change(page+1)}>Next</button></div>:null}
const manage={farmer:"/admin?tool=network-farmer-applications",supplier:"/admin?tool=network-supplier-applications",buyer:"/admin?section=lead-queue",listing:"/admin/listing-submissions"};
function RecordRows({rows,open}:{rows:IntakeRow[];open:(r:IntakeRow)=>void}){
  return <ul className={s.rows}>{rows.map(r=><li key={r.queue+r.id}><div><small>{queueLabels[r.queue]} · {r.reference}</small><strong>{r.name||r.product||"Unnamed record"}</strong></div><span>{r.status||"Status unavailable"}</span><time>{r.received.slice(0,10)}</time><button onClick={()=>open(r)}>Open<span className="sr-only"> {r.reference}</span></button></li>)}</ul>;
}
export function Records({rows,unavailable,queue}:{rows:IntakeRow[];unavailable:StaffQueue[];queue?:StaffQueue}){
  const [q,setQ]=useState(""),[filter,setFilter]=useState(""),[status,setStatus]=useState(""),[page,setPage]=useState(0),[selected,setSelected]=useState<IntakeRow|null>(null);
  const origin=useRef({scroll:0,id:""});
  useEffect(()=>{function sync(){const id=new URL(location.href).searchParams.get("record");setSelected(rows.find(r=>r.id===id)||null);
    if(!id && origin.current.id)requestAnimationFrame(()=>{const buttons=document.querySelectorAll<HTMLButtonElement>("main li button");Array.from(buttons).find(b=>b.textContent?.includes(origin.current.id))?.focus({preventScroll:true});window.scrollTo(0,origin.current.scroll)})}
    sync();window.addEventListener("popstate",sync);return()=>window.removeEventListener("popstate",sync)},[rows]);
  function open(r:IntakeRow){origin.current={scroll:window.scrollY,id:r.reference};const url=new URL(location.href);url.searchParams.set("record",r.id);window.history.pushState({...window.history.state,staffCase:true},"",url);setSelected(r);window.scrollTo(0,0);requestAnimationFrame(()=>document.getElementById("staff-main")?.focus())}
  function back(){if(window.history.state?.staffCase)window.history.back();else{const u=new URL(location.href);u.searchParams.delete("record");window.history.replaceState(window.history.state,"",u);setSelected(null)}}
  if(selected?.queue==="buyer")return <CaseDetail key={selected.id} row={selected} back={back}/>;
  if(selected)return <><button onClick={back}>← Back to results</button><div className={s.panel}><small>{selected.reference}</small><h1>{selected.name||"Intake record"}</h1><p>{queueLabels[selected.queue]} · {selected.status} · {selected.received.slice(0,10)}</p><p>{selected.location}</p>{selected.profileId&&<Link href={"/admin/profiles/"+selected.queue+"/"+selected.profileId}>Open linked profile</Link>} <Link href={manage[selected.queue]}>Open existing review queue</Link></div></>;
  const filtered=rows.filter(r=>(!filter||r.queue===filter)&&(!status||r.status===status)&&matches(q,[r.name,r.contactName,r.reference,r.id,r.location,r.product],[r.phone,r.whatsapp])).sort((a,b)=>b.received.localeCompare(a.received));
  return <><header className={s.title}><div><small>Staff workspace</small><h1>{queue?queueLabels[queue]:"Find a record"}</h1></div>{queue&&<Link href={manage[queue]}>Existing review tools</Link>}</header><section className={s.panel}><div className={s.filters}>
    <label>Find by reference, name or phone<input type="search" autoComplete="off" value={q} onChange={e=>{setQ(e.target.value);setPage(0)}}/></label>
    {!queue&&<label>Record type<select value={filter} onChange={e=>{setFilter(e.target.value);setStatus("");setPage(0)}}><option value="">All types</option>{Object.entries(queueLabels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>}
    <label>Status<select value={status} onChange={e=>{setStatus(e.target.value);setPage(0)}}><option value="">All statuses</option>{Array.from(new Set(rows.filter(r=>!filter||r.queue===filter).map(r=>r.status).filter(Boolean))).sort().map(v=><option key={v}>{v}</option>)}</select></label></div>
    {unavailable.length>0&&<p role="status">Could not load {unavailable.map(k=>queueLabels[k]).join(", ")}. Refresh to retry.</p>}
    <p role="status">{filtered.length} matching records{unavailable.length?" in available queues":""}</p><RecordRows rows={filtered.slice(page*size,(page+1)*size)} open={open}/><Pager page={page} count={filtered.length} change={setPage}/></section></>;
}
export function Profiles({rows,unavailable}:{rows:ProfileRow[];unavailable:string[]}){
  const [q,setQ]=useState(""),[type,setType]=useState(""),[publication,setPublication]=useState(""),[page,setPage]=useState(0);
  const filtered=rows.filter(r=>(!type||r.type===type)&&(!publication||(publication==="Public")===r.eligible)&&matches(q,[r.name,r.id,r.location,...r.offerings],[r.phone,r.whatsapp])).sort((a,b)=>b.updated.localeCompare(a.updated));
  return <><header className={s.title}><div><small>Network</small><h1>Profiles</h1></div><Link href="/admin?view=tools">All admin tools</Link></header>
  <section className={s.panel}><div className={s.filters}><label>Search profiles<input type="search" value={q} onChange={e=>{setQ(e.target.value);setPage(0)}}/></label>
  <label>Type<select value={type} onChange={e=>{setType(e.target.value);setPage(0)}}><option value="">All profiles</option>{["Farm","Supplier","Service provider","Supplier / service"].map(t=><option key={t}>{t}</option>)}</select></label>
  <label>Publication<select value={publication} onChange={e=>{setPublication(e.target.value);setPage(0)}}><option value="">Any visibility</option><option>Public</option><option>Private</option></select></label></div>
  {unavailable.length>0&&<p role="status">Could not load {unavailable.join(", ")} profiles. Refresh to retry.</p>}<p role="status">{filtered.length} matching profiles</p><ul className={s.rows}>{filtered.slice(page*size,(page+1)*size).map(r=>{const href="/admin/profiles/"+r.kind+"/"+r.id;return <li key={r.kind+r.id}><div><small>{r.type} · {r.location}</small><strong>{r.name}</strong><small>{r.offerings.join(", ")}</small></div><span>{r.eligible?"Public":"Private"}</span><div><small>Joined {r.created.slice(0,10)||"unknown"}</small><small>Updated {r.updated.slice(0,10)||"unknown"}</small></div><div><Link href={href}>Open / edit</Link><Link href={href+"?tab=preview"}>Preview</Link>{r.eligible&&<Link href={"/"+r.kind+"-directory/"+encodeURIComponent(r.slug)}>View public profile</Link>}</div></li>})}</ul><Pager page={page} count={filtered.length} change={setPage}/></section></>;
}
