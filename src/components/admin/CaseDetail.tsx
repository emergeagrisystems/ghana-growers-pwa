"use client";
import { useRef,useState } from "react";
import { contactNumber,contactHref,crmPersistenceNotice,firstReplyState } from "@/lib/adminCrm";
import type { IntakeRow } from "@/lib/adminReadModel";
import s from "./staff.module.css";
import {prepareHandover} from "@/lib/adminHandover";
import {CaseActivities} from "./CaseActivities";

type Contact={name:string;phone:string;whatsapp:string};
function ContactActions({recipient,contact,reference}:{recipient:"buyer"|"seller";contact:Contact;reference:string}) {
  const [checked,setChecked]=useState(false),[feedback,setFeedback]=useState("");
  const call=contactHref(contact.phone,checked,"phone");
  const wa=contactHref(contact.whatsapp,checked,"wa",recipient==="buyer"?"Hello, I’m following up on your Ghana Growers request "+reference+".":"Hello, I’m checking product availability for Ghana Growers.");
  const copy=checked&&(contactNumber(contact.phone)||contactNumber(contact.whatsapp));
  return <section><h3>{recipient==="buyer"?"Contact buyer":"Check seller availability"}</h3><p>{contact.name} · Phone {contact.phone||"unavailable"} · WhatsApp {contact.whatsapp||"unavailable"}</p>
    <label><input type="checkbox" checked={checked} onChange={e=>setChecked(e.target.checked)}/> I checked these numbers belong to the intended {recipient}.</label>
    <div className={s.actions}>{wa?<a href={wa} target="_blank" rel="noreferrer">Open WhatsApp</a>:<button disabled>Open WhatsApp</button>}{call?<a href={call}>Call {recipient}</a>:<button disabled>Call {recipient}</button>}
    <button disabled={!copy} onClick={async()=>{try{await navigator.clipboard.writeText(copy||"");setFeedback("Number copied.")}catch{setFeedback("Copy failed. Select the number above.")}}}>Copy number</button></div><small role="status">{feedback}</small></section>;
}

export function CaseDetail({row,back,sharedCaseEnabled}:{sharedCaseEnabled:boolean;row:IntakeRow;back:()=>void}) {
  const [seller,setSeller]=useState<Contact|null>(null),[sellerError,setSellerError]=useState(""),[loading,setLoading]=useState(false);
  const [note,setNote]=useState(""),[next,setNext]=useState(""),[due,setDue]=useState("");
  const handover=prepareHandover({note,nextAction:next,dueLocal:due});
  const history=useRef<HTMLDialogElement>(null);
  async function checkSeller(){setLoading(true);try{const r=await fetch("/api/admin/case-seller?case="+row.id,{cache:"no-store"});if(!r.ok)throw Error();setSeller(await r.json());setSellerError("")}catch{setSellerError("Could not load the linked seller. You can retry.")}finally{setLoading(false)}}
  const reply=firstReplyState(row.received,new Date(),undefined,null);
  const buyerActions=<ContactActions recipient="buyer" contact={row} reference={row.reference}/>;
  const sellerActions=<>{seller?<ContactActions recipient="seller" contact={seller} reference={row.reference}/>:row.sellerId?<button disabled={loading} onClick={checkSeller}>View linked seller contact</button>:<p>No seller profile is linked to this request.</p>}
    {sellerError&&<p role="alert">{sellerError}</p>}</>;
  return <><button className={s.back} onClick={()=>{if(!(note||next||due)||window.confirm("Discard this unsaved handover draft and return to the list?"))back()}}>← Back to results</button>
    <header className={s.title}><div><small>{row.reference} · {row.status}</small><h1>{row.name||"Buyer request"}</h1></div><button onClick={()=>history.current?.showModal()}>Buyer history</button></header>
    <section className={s.panel}><h2>Buyer request</h2><dl className={s.facts}>{Object.entries({"Product":row.product,"Quantity":row.quantity,"Delivery location":row.location,"Requested delivery":row.delivery,"Buyer’s message":row.message,"Contact person":row.contactName}).map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v||"Not supplied"}</dd></div>)}</dl></section>
    {sharedCaseEnabled?<CaseActivities id={row.id} received={row.received} historyDialog={history} buyerActions={buyerActions} sellerActions={sellerActions}
      note={note} next={next} due={due} setNote={setNote} setNext={setNext} setDue={setDue}/>:<>
    <section className={s.panel}>{buyerActions}<p>First reply · {reply==="unavailable"?"Evidence unavailable":reply}. Opening a contact action leaves the reply outstanding.</p>
      <button disabled>Record first reply</button> <button disabled>Record buyer contact</button></section>
    <section className={s.panel}><h2>Seller availability</h2>{sellerActions}<button disabled>Record seller contact</button></section>
    <section className={s.panel}><h2>Handover</h2><p>{crmPersistenceNotice}</p><p>Owner · Unavailable</p><button disabled>Claim case</button>
    <div className={s.fields}><label>Private note · unsaved draft<textarea maxLength={2000} value={note} onChange={e=>setNote(e.target.value)} /></label><label>Next action<input maxLength={300} value={next} onChange={e=>setNext(e.target.value)}/></label><label>Staff follow-up · GMT<input type="datetime-local" value={due} onChange={e=>setDue(e.target.value)}/></label></div><button disabled>Save handover</button>
    {(note||next||due)&&<p role="status">{"error" in handover?handover.error+" ":""}Unsaved. Keep this page open to retain the draft.</p>}</section>
    <section className={s.panel}><h2>Case timeline</h2><p>Request received {new Intl.DateTimeFormat("en-GB",{dateStyle:"medium",timeStyle:"short",timeZone:"Africa/Accra"}).format(new Date(row.received))} GMT.</p><p>Shared case events and outcomes are unavailable.</p></section>
    <dialog className={s.history} ref={history} aria-label="Buyer history"><button autoFocus onClick={()=>history.current?.close()}>Close history</button><h2>Buyer history</h2><p>Confirmed links are unavailable. Similar names and numbers cannot establish buyer identity.</p><button disabled>Confirm buyer link</button> <button disabled>Unlink buyer</button></dialog></>}</>;
}
