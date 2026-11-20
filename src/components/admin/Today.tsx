import Link from "next/link";
import { CalendarClock, Inbox, MessageCircle } from "lucide-react";
import { queueLabels } from "@/lib/adminQueueLabels";
import type { IntakeRow, StaffQueue, ReadResult } from "@/lib/adminReadModel";
import { leadReference } from "@/lib/adminCrm";
import s from "./staff.module.css";

export type Queues = Record<StaffQueue,ReadResult<IntakeRow>>;
export type DueFollowUp = {id:string;action:string;due:string};
export function gmt(value:string){return value && Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short",year:"numeric",timeZone:"Africa/Accra"}).format(new Date(value)):"Date unavailable"}
export function waiting(row:IntakeRow){return ["New","Pending","Pending Review","Under Review","In Review"].includes(row.status)}
export function Today({queues,now,followUps}:{queues:Queues;now:string;followUps:DueFollowUp[]|null}) {
  const ids=Object.keys(queues) as StaffQueue[];
  const complete=ids.every(k=>queues[k].available);
  const rows=ids.flatMap(k=>queues[k].rows);
  const days=Array.from({length:7},(_,i)=>new Date(Date.parse(now)-(6-i)*86400000).toISOString().slice(0,10));
  const values=days.map(d=>rows.filter(r=>r.received.startsWith(d)).length);
  const requests=queues.buyer.rows, products=new Map<string,number>();
  for(const r of requests){const p=r.product.trim();if(p)products.set(p,(products.get(p)||0)+1)}
  const productCounts=Array.from(products).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,3);
  return <><header className={s.title}><div><small>Staff dashboard</small><h1>Today’s work</h1><p>{gmt(now)} · Ghana time</p></div><Link href="/admin?view=find">Find a record</Link></header>
    <section className={s.attention}><MessageCircle size={22}/><div><h2>Buyer first replies</h2><p>Overdue replies cannot be verified yet. Open the buyer queue to check a request.</p></div><Link href="/admin?view=buyer">View requests</Link></section>
    <section className={s.panel}><h2><CalendarClock size={20}/> My follow-ups</h2>
      {followUps===null?<p>Follow-ups are unavailable. Refresh to try again.</p>:
        !followUps.length?<p>No follow-ups due today or overdue.</p>:
        <ul>{followUps.map(item=>{
          const lead=requests.find(r=>r.id===item.id);
          const reference=lead?.reference||leadReference(item.id);
          const time=new Intl.DateTimeFormat("en-GB",{dateStyle:"medium",timeStyle:"short",timeZone:"Africa/Accra"}).format(new Date(item.due));
          return <li key={item.id} className={s.caseEvent}>
            <strong>{Date.parse(item.due)<Date.parse(now)?"Overdue":"Due today"}</strong> · <time dateTime={item.due}>{time} GMT</time>
            <p>{item.action}</p><Link prefetch={false} href={"/admin?view=buyer&record="+item.id}>{lead?.name||"Buyer request"} · {reference}</Link>
          </li>;
        })}</ul>}
    </section>
    <h2>Intake queues</h2><div className={s.tiles}>{ids.map(k=>{const q=queues[k];const pending=q.rows.filter(waiting);return <Link className={s.tile} key={k} href={"/admin?view="+k}><span className={s.tag} data-type={k}><Inbox size={15}/>{queueLabels[k]}</span><strong>{q.available?pending.length:"—"} <small>waiting</small></strong><span>{!q.available?"Queue unavailable":pending[0]?"Oldest · "+gmt(pending[0].received)+" · "+pending[0].reference:"No waiting records"}</span></Link>})}</div>
    <h2>At a glance</h2><div className={s.charts}><section className={s.panel}><h3>Workload by queue</h3>{ids.map(k=><div className={s.metric} key={k}><span>{queueLabels[k]}</span><b>{queues[k].available?queues[k].rows.length:"—"}</b></div>)}</section>
    <section className={s.panel}><h3>Buyer request status</h3>{["New","Contacted","Negotiating","Completed","Lost"].map(k=><div className={s.metric} key={k}><span>{k}</span><b>{queues.buyer.available?requests.filter(r=>r.status===k).length:"—"}</b></div>)}</section>
    <section className={s.panel}><h3>Intake over seven days</h3>{complete?<><svg aria-hidden="true" viewBox="0 0 200 40" className={s.trend}><polyline fill="none" stroke="currentColor" strokeWidth="2" points={values.map((v,i)=>(3+32*i)+","+(37-v/Math.max(1,...values)*34)).join(" ")}/></svg><ul className={s.week}>{days.map((d,i)=><li key={d}>{d.slice(8)} <b>{values[i]}</b></li>)}</ul></>:<p>Some queues are unavailable.</p>}</section>
    <section className={s.panel}><h3>Most requested products</h3>{!queues.buyer.available?<p>Buyer queue unavailable.</p>:productCounts.length?productCounts.map(([p,n])=><div key={p} className={s.metric}><span>{p}</span><b>{n}</b></div>):<p>No product requests yet.</p>}</section></div></>;
}
