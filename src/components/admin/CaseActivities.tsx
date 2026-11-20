"use client";
import {useRef,useState,type ReactNode,type RefObject} from "react";
import {CaseDraftEditor,type HandoverFields} from "./CaseDraftEditor";
import {useCaseWork} from "./useCaseWork";
import s from "./staff.module.css";

type Form="first"|"buyer"|"seller"|"newBuyer"|"link"|"unlink";
type Seller={id:string;name:string;district:string;region:string};
type Prior={reference:string;buyer:string;name:string;received:string};
const titles:Record<Form,string>={first:"Record first reply",buyer:"Record buyer contact",seller:"Record seller contact",newBuyer:"Establish buyer identity",link:"Link an earlier request",unlink:"Unlink buyer"};
const events:Record<string,string>={claim:"Case claimed",note:"Private note",follow_up_set:"Follow-up set",follow_up_completed:"Follow-up completed",handover:"Case handed over",status:"Status changed",buyer_contact:"Buyer contact",seller_contact:"Seller contacted",link:"Buyer link confirmed",unlink:"Buyer unlinked"};
const channels:Record<string,string>={whatsapp:"WhatsApp",phone:"Phone",email:"Email",other:"Other"};
const date=(value:string)=>new Intl.DateTimeFormat("en-GB",{dateStyle:"medium",timeStyle:"short",timeZone:"Africa/Accra"}).format(new Date(value))+" GMT";

export function CaseActivities({id,received,historyDialog,buyerActions,sellerActions,...handover}:HandoverFields & {
  id:string;received:string;historyDialog:RefObject<HTMLDialogElement>;buyerActions:ReactNode;sellerActions:ReactNode;
}){
  const work=useCaseWork(id), {current}=work;
  const dialog=useRef<HTMLDialogElement>(null);
  const [form,setForm]=useState<Form>("first"),[channel,setChannel]=useState("whatsapp"),[time,setTime]=useState("");
  const [confirmed,setConfirmed]=useState(false),[reason,setReason]=useState(""),[buyerReply,setBuyerReply]=useState(false);
  const [type,setType]=useState("farmer"),[query,setQuery]=useState(""),[results,setResults]=useState<Seller[]|null>(null);
  const [seller,setSeller]=useState<Seller|null>(null),[prior,setPrior]=useState<Prior|null>(null);
  const [lookupBusy,setLookupBusy]=useState(false),[lookupError,setLookupError]=useState("");
  const [editing,setEditing]=useState(false);
  const [reviewed,setReviewed]=useState(false),[openingLink,setOpeningLink]=useState<string|null>(null);
  const contact=form==="first"||form==="buyer"||form==="seller";
  const canOpen=!!current&&!work.busy&&!work.conflict&&!work.unknown&&!handover.note&&!handover.next&&!handover.due;
  function open(kind:Form){
    setForm(kind);setConfirmed(false);setReason("");setTime(new Date().toISOString().slice(0,19));setChannel("whatsapp");setBuyerReply(false);
    setType("farmer");setQuery("");setResults(null);setSeller(null);setPrior(null);setLookupError("");setReviewed(false);setOpeningLink(current?.link??null);work.setMessage("");setEditing(true);
    dialog.current?.showModal();
  }
  async function lookup(){
    setLookupBusy(true);setLookupError("");setConfirmed(false);
    const params=new URLSearchParams({id});
    if(form==="seller"){params.set("q",query);params.set("sellerType",type);setResults(null);setSeller(null);}
    else {params.set("reference",query);setPrior(null);}
    try{
      const r=await fetch("/api/admin/case-work?"+params,{cache:"no-store"});const data=await r.json();
      if(!r.ok){setLookupError(data.error||"Could not check the record.");return;}
      if(form==="seller")setResults(data.sellers);else setPrior(data);
    }catch{setLookupError("Could not check the record. Try again.");}
    finally{setLookupBusy(false);}
  }
  const validTarget=form==="seller"?!!seller:form==="link"?!!prior&&!current?.link:form==="newBuyer"?!current?.link:form==="unlink"?!!openingLink&&openingLink===current?.link:true;
  async function submit(){
    if(!current||!confirmed||!validTarget)return;
    let input:Record<string,unknown>,kind:string;
    if(contact){
      const instant=Date.parse(time+"Z");
      if(!Number.isFinite(instant)||instant<Date.parse(received)||instant>Date.now()){work.setMessage("Enter the actual contact time between receipt and now, in Ghana time.");return;}
      kind=form==="seller"?"seller_contact":"buyer_contact";
      input={confirmed:true,channel,occurred_at:new Date(instant).toISOString(),...(form==="seller"?{seller_type:type,seller_id:seller!.id}:{reply:form==="first"||buyerReply})};
    }else{
      kind=form==="unlink"?"unlink":"link";
      input={confirmed:true,reason:reason.trim(),...(form==="newBuyer"?{create_identity:true}:form==="link"?{buyer_id:prior!.buyer}:{link_id:current.link})};
    }
    if(await work.save(kind,input,prior?.reference))dialog.current?.close();
  }
  const frozen=work.busy||!!work.unknown||lookupBusy;
  const buttons=(kind:Form)=><button type="button" disabled={!canOpen} onClick={()=>open(kind)}>{titles[kind]}</button>;
  return <>
    <section className={s.panel}>{buyerActions}
      <p>{!current?"Loading reply status…":current.first?`First reply · ${current.first.actor} · ${channels[current.first.channel]} · ${date(current.first.time)}`:"First reply outstanding. Record it after you have replied."}</p>
      <div className={s.actions}>{!current?.first&&buttons("first")}{buttons("buyer")}</div></section>
    <section className={s.panel}><h2>Seller availability</h2>{sellerActions}{buttons("seller")}</section>
    {(handover.note||handover.next||handover.due)&&<p>Save or clear your handover draft before recording another action.</p>}
    <CaseDraftEditor {...handover} work={work}/>
    <section className={s.panel}><h2>Case timeline</h2>
      <ul>{current?.timeline.map(e=><li className={s.caseEvent} key={e.id}><strong>{e.first?"First buyer reply":events[e.kind]||"Case updated"}</strong> · {e.actor}
        <small>{date(e.time)}{e.channel&&" · "+channels[e.channel]}</small>{e.detail&&<span>{e.detail}</span>}</li>)}
        <li className={s.caseEvent}>Request received <small>{date(received)}</small></li></ul></section>
    <dialog className={s.history} ref={historyDialog} aria-label="Buyer history"><button autoFocus onClick={()=>historyDialog.current?.close()}>Close history</button><h2>Buyer history</h2>
      {!current?<p>Buyer history unavailable. Reload the current case.</p>:<>
        <p>{current.history.length?"Confirmed requests for this buyer.":current.link?"Buyer identity confirmed. No other requests are linked.":"No confirmed buyer history. Similar names or phone numbers do not link requests."}</p>
        {current.history.map(h=><section className={s.panel} key={h.reference}><strong>{h.reference} · {h.status}</strong><p>{date(h.received)}</p>
          <p>{[h.product,h.quantity,h.location].filter(Boolean).join(" · ")}</p><small>Sellers contacted · {h.sellers.join(", ")||"None recorded"}</small></section>)}
        <div className={s.actions}>{current.link?buttons("unlink"):<>{buttons("link")}{buttons("newBuyer")}</>}</div>
        {!editing&&<p role="status">{work.message}</p>}
      </>}</dialog>
    <dialog ref={dialog} className={s.history} aria-labelledby="case-action-title"
      onCancel={e=>{if(frozen)e.preventDefault()}} onClose={()=>setEditing(false)}>
      <h2 id="case-action-title">{titles[form]}</h2>
      <form onSubmit={e=>{e.preventDefault();void submit()}}>
        <fieldset disabled={frozen} className={s.fields}>
          {form==="seller"&&<label>Seller type<select value={type} onChange={e=>{setType(e.target.value);setSeller(null);setResults(null);setConfirmed(false)}}><option value="farmer">Farmer</option><option value="supplier">Supplier / service</option></select></label>}
          {(form==="seller"||form==="link")&&<>
            <label>{form==="seller"?"Seller business name":"Earlier BR reference"}<input value={query} maxLength={90} onChange={e=>{setQuery(e.target.value);setSeller(null);setResults(null);setPrior(null);setConfirmed(false);setLookupError("")}}/></label>
            <button type="button" disabled={!query.trim()} onClick={()=>void lookup()}>{form==="seller"?"Find sellers":"Check reference"}</button>
            {lookupError&&<p role="alert">{lookupError}</p>}
            {results&&<label>Matching sellers<select value={seller?.id||""} onChange={e=>{setSeller(results.find(r=>r.id===e.target.value)??null);setConfirmed(false)}}>
              <option value="">{results.length?"Choose a seller":"No matching sellers"}</option>{results.map(r=><option key={r.id} value={r.id}>{r.name} · {[r.district,r.region].filter(Boolean).join(", ")} · {r.id.slice(0,8)}</option>)}</select></label>}
            {prior&&<p>{prior.reference} · {prior.name} · {date(prior.received)}</p>}
          </>}
          {contact?<><label>Contact channel<select value={channel} onChange={e=>{setChannel(e.target.value);setConfirmed(false)}}>{Object.entries(channels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
            <label>Actual contact time · GMT<input type="datetime-local" step="1" required value={time} onChange={e=>{setTime(e.target.value);setConfirmed(false)}}/></label>
            {form==="buyer"&&!current?.first&&<label className={s.confirm}><input type="checkbox" checked={buyerReply} onChange={e=>{setBuyerReply(e.target.checked);setConfirmed(false)}}/> This contact was a reply to the request.</label>}
          </>:<label>Reason for {form==="unlink"?"unlinking":"confirming this identity"}<textarea maxLength={300} required value={reason} onChange={e=>{setReason(e.target.value);setConfirmed(false)}}/></label>}
          <label className={s.confirm}><input type="checkbox" checked={confirmed} disabled={!validTarget} onChange={e=>setConfirmed(e.target.checked)}/>
            {form==="seller"?"I contacted the selected seller.":form==="first"?"I actually replied to this buyer.":form==="buyer"?"I contacted this buyer.":form==="unlink"?"I confirm this request should be unlinked.":"I verified the buyer’s identity."}</label>
        </fieldset>
        {work.conflict&&<><p>Review the latest case and confirm your entry again.</p><button type="button" disabled={frozen} onClick={async()=>{await work.review();setReviewed(true);setConfirmed(false);if(form==="link")setPrior(null);}}>Review latest case</button></>}
        {reviewed&&!work.conflict&&current&&<section aria-label="Latest saved case"><h3>Latest saved case</h3>
          <p>{current.first?"First reply recorded · "+date(current.first.time):"First reply outstanding"}</p>
          <p>{current.link?"Buyer identity confirmed":"No confirmed buyer identity"}</p>
          {current.timeline.slice(0,3).map(e=><p key={e.id}>{events[e.kind]} · {e.actor} · {date(e.time)} {e.detail}</p>)}</section>}
        <div className={s.actions}><button disabled={work.busy||lookupBusy||work.conflict||!confirmed||!validTarget||(!contact&&!reason.trim())||(form==="first"&&!!current?.first&&!work.unknown)||(form==="unlink"&&!current?.link)}>{work.unknown?"Retry same save":"Confirm and save"}</button>
          <button type="button" disabled={frozen} onClick={()=>dialog.current?.close()}>Cancel</button></div>
        <p role="status">{work.message}</p>{work.conflict&&current?.first&&<p>First reply already recorded · {date(current.first.time)}</p>}
      </form></dialog>
  </>;
}
