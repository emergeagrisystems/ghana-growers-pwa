"use client";
import {useCallback,useEffect,useState} from "react";
import {prepareHandover} from "@/lib/adminHandover";
import s from "./staff.module.css";

type Current={version:number;owned:boolean;mine:boolean;note:string|null;next:string|null;due:string|null};
type Intent={id:string;operation:string;version:number;kind:string;input:Record<string,unknown>};
type Props={id:string;note:string;next:string;due:string;setNote:(s:string)=>void;setNext:(s:string)=>void;setDue:(s:string)=>void};
export function CaseDraftEditor({id,note,next,due,setNote,setNext,setDue}:Props){
  const [current,setCurrent]=useState<Current|null>(null),[busy,setBusy]=useState(false);
  const [message,setMessage]=useState(""),[conflict,setConflict]=useState(false),[unknown,setUnknown]=useState<Intent|null>(null);
  const load=useCallback(async()=>{
    const r=await fetch("/api/admin/case-work?id="+encodeURIComponent(id),{cache:"no-store"});
    if(!r.ok)throw Error();
    const data=await r.json(); if(data.id!==id||!Number.isSafeInteger(data.version))throw Error();
    return data as Current;
  },[id]);
  useEffect(()=>{let active=true;load().then(x=>{if(active)setCurrent(x)}).catch(()=>{if(active)setMessage("Could not load the current case.")});return()=>{active=false};
  },[load]);
  async function review(){
    setBusy(true);
    try{setCurrent(await load());setConflict(false);setMessage("Latest case loaded. Review it alongside your draft before saving.");}
    catch{setMessage("Could not load the latest case. Your draft is retained.");}
    finally{setBusy(false);}
  }
  async function submit(claim=false){
    if(!current||busy||conflict)return;
    const draft=prepareHandover({note,nextAction:next,dueLocal:due});
    if(!claim&&!unknown&&("error" in draft || (next.trim()&&!draft.dueAt))){
      setMessage("error" in draft?draft.error!:"Enter the follow-up date and time.");return;
    }
    const intent=unknown??{id,operation:crypto.randomUUID(),version:current.version,kind:claim?"claim":next.trim()?"follow_up_set":"note",
      input:claim?{}:{...(note.trim()?{note:note.trim()}:{}),...(next.trim()?{next_action:next.trim(),due_at:draft.dueAt}:{})}};
    setBusy(true);
    try{
      const r=await fetch("/api/admin/case-work",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(intent)});
      const data=await r.json();
      if(r.status===409){setUnknown(null);setConflict(true);setMessage(data.error);return;}
      if(!r.ok){if(r.status>=500)throw Error();setUnknown(null);setMessage(data.error||"Check the request before saving.");return;}
      if(data.operation_id!==intent.operation)throw Error();
      setUnknown(null);setCurrent(null);
      if(intent.kind!=="claim"){setNote("");setNext("");setDue("");}
      setMessage("Saved.");try{setCurrent(await load());}catch{setMessage("Saved. Reload the latest case to continue.");}
    }catch{setUnknown(intent);setMessage("Outcome unknown. Your draft is retained. Retry this same operation.");}
    finally{setBusy(false);}
  }
  return <section className={s.panel}><h2>Handover</h2>
    {current&&<div><p>{current.mine?"Assigned to you":current.owned?"Assigned to another staff member":"Unclaimed"}</p>
      {current.note&&<p>Latest note · {current.note}</p>}{current.next&&<p>Next action · {current.next} {current.due&&new Date(current.due).toLocaleString("en-GB",{timeZone:"Africa/Accra"})} GMT</p>}</div>}
    {current&&!current.owned&&<button disabled={busy||conflict||!!unknown} onClick={()=>void submit(true)}>Claim case</button>}
    <fieldset disabled={busy||!!unknown} className={s.fields}><label>Private note<textarea value={note} maxLength={2000} onChange={e=>setNote(e.target.value)}/></label>
      <label>Next action<input value={next} maxLength={300} onChange={e=>setNext(e.target.value)}/></label>
      <label>Staff follow-up · GMT<input type="datetime-local" value={due} onChange={e=>setDue(e.target.value)}/></label></fieldset>
    {conflict||!current?<button disabled={busy} onClick={()=>void review()}>Review latest case</button>:
      <button disabled={busy||(!unknown&&!note.trim()&&!next.trim())} onClick={()=>void submit()}>{unknown?"Retry same save":"Save note or follow-up"}</button>}
    <p role="status">{message}</p></section>;
}
