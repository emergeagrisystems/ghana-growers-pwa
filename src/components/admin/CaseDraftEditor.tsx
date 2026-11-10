"use client";
import type {CaseWork} from "./useCaseWork";
import {prepareHandover} from "@/lib/adminHandover";
import s from "./staff.module.css";

export type HandoverFields={note:string;next:string;due:string;setNote:(s:string)=>void;setNext:(s:string)=>void;setDue:(s:string)=>void};
export function CaseDraftEditor({work,note,next,due,setNote,setNext,setDue}:HandoverFields & {work:CaseWork}){
  const {current,busy,conflict,unknown,message,review}=work;
  async function submit(claim=false){
    const draft=prepareHandover({note,nextAction:next,dueLocal:due});
    if(!claim&&!unknown&&("error" in draft || (next.trim()&&!draft.dueAt))){
      work.setMessage("error" in draft?draft.error!:"Enter the follow-up date and time.");return;
    }
    const kind=claim?"claim":next.trim()?"follow_up_set":"note";
    const input=claim?{}:{...(note.trim()?{note:note.trim()}:{}),...(next.trim()?{next_action:next.trim(),due_at:draft.dueAt}:{})};
    if(await work.save(kind,input) && (unknown?.kind??kind)!=="claim"){setNote("");setNext("");setDue("");}
  }
  return <section className={s.panel}><h2>Handover</h2>
    {current&&<div><p>{current.mine?"Assigned to you":current.owned?"Assigned to another staff member":"Unclaimed"}</p>
      {current.note&&<p>Latest note · {current.note}</p>}{current.next&&<p>Next action · {current.next} {current.due&&new Date(current.due).toLocaleString("en-GB",{timeZone:"Africa/Accra"})} GMT</p>}</div>}
    {current?.next&&current.due&&<div>
      <button disabled={busy||conflict||!!unknown||!!(note||next||due)} onClick={()=>void work.save("follow_up_completed",{})}>Complete follow-up</button>
      {(note||next||due)&&<p>Save or clear your draft before completing the saved follow-up.</p>}
    </div>}
    {current&&!current.owned&&<button disabled={busy||conflict||!!unknown} onClick={()=>void submit(true)}>Claim case</button>}
    <fieldset disabled={busy||!!unknown} className={s.fields}><label>Private note<textarea value={note} maxLength={2000} onChange={e=>setNote(e.target.value)}/></label>
      <label>Next action<input value={next} maxLength={300} onChange={e=>setNext(e.target.value)}/></label>
      <label>Staff follow-up · GMT<input type="datetime-local" value={due} onChange={e=>setDue(e.target.value)}/></label></fieldset>
    {conflict||!current?<button disabled={busy} onClick={()=>void review()}>Review latest case</button>:
      <button disabled={busy||(!unknown&&!note.trim()&&!next.trim())} onClick={()=>void submit()}>{unknown?"Retry same save":"Save note or follow-up"}</button>}
    <p role="status">{message}</p></section>;
}
