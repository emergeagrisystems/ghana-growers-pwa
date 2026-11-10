"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import type {LeadRequestStatus} from "@/lib/leadRequests";

type Snapshot={id:string;status:string;updated_at:string;version:number};
type Intent={id:string;status:LeadRequestStatus;lead_updated_at:string;version:number;operation:string};
export type StatusSelection={id:string;name:string;status:string;updated_at:string;requested:LeadRequestStatus};

export function LeadStatusEditor({lead,close,onSaved}:{lead:StatusSelection;close:()=>void;onSaved:(status:LeadRequestStatus)=>Promise<boolean>}){
  const dialog=useRef<HTMLDialogElement>(null), pending=useRef(false);
  const [base,setBase]=useState<Snapshot|null>(null),[desired,setDesired]=useState(lead.requested);
  const [state,setState]=useState<"loading"|"ready"|"saving"|"conflict"|"unknown"|"unavailable"|"saved">("loading");
  const [message,setMessage]=useState(""),[retry,setRetry]=useState<Intent|null>(null);
  const read=useCallback(async():Promise<Snapshot>=>{
    const res=await fetch("/api/admin/lead-requests?id="+encodeURIComponent(lead.id),{cache:"no-store"});
    if(!res.ok)throw Error();
    const data=await res.json();
    if(data.id!==lead.id || !Number.isSafeInteger(data.version) || !data.updated_at)throw Error();
    return data;
  },[lead.id]);
  useEffect(()=>{
    dialog.current?.showModal();
    let active=true;
    read().then(latest=>{
      if(!active)return;
      // The queue supplied the original lead timestamp. Only explicit reconciliation may replace it.
      setBase({...latest,updated_at:lead.updated_at,status:lead.status});setState("ready");
    }).catch(()=>{if(active){setState("unavailable");setMessage("Could not load the case. Your selected status is retained.");}});
    return ()=>{active=false;};
  },[read,lead.updated_at,lead.status]);
  async function review(){
    if(pending.current)return;
    pending.current=true;setState("loading");
    try{setBase(await read());setState("ready");setMessage("Latest status loaded. Check your choice before saving.");}
    catch{setState("unavailable");setMessage("Could not load the latest lead. Your selected status is retained.");}
    finally{pending.current=false;}
  }
  async function refresh(status:LeadRequestStatus){
    if(await onSaved(status)){close();return;}
    setState("saved");setMessage("Status saved. Refresh the queue to see the latest record.");
  }
  async function save(){
    if(pending.current||!base||!(state==="ready"||state==="unknown"))return;
    const intent=retry??{id:lead.id,status:desired,lead_updated_at:base.updated_at,version:base.version,operation:crypto.randomUUID()};
    pending.current=true;setState("saving");
    try{
      const r=await fetch("/api/admin/lead-requests",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(intent)});
      const data=await r.json();
      if(r.status===409){setRetry(null);setState("conflict");setMessage("This lead changed. Your selected status is retained. Review the latest lead before saving again.");return;}
      if(!r.ok&&r.status<500){setRetry(null);setState("unavailable");setMessage(data.error||"Could not save this status.");return;}
      if(!r.ok||data.operation!==intent.operation)throw Error();
    }catch{setRetry(intent);setState("unknown");setMessage("Save not confirmed. Retry the same status change.");return;}
    finally{pending.current=false;}
    setRetry(null);setState("saved");await refresh(intent.status);
  }
  const locked=state==="saving"||state==="unknown"||state==="saved";
  return <dialog ref={dialog} aria-labelledby="lead-status-title" className="m-auto w-[min(94vw,28rem)] rounded-xl border bg-white p-5 shadow-lg"
    onCancel={event=>{event.preventDefault();if(!locked)close();}}>
    <h2 id="lead-status-title" className="text-xl font-bold">Change lead status</h2>
    <p className="my-3">{lead.name} · Current status: {base?.status??lead.status}</p>
    <label className="grid gap-1 font-semibold">Selected status<select className="admin-input" disabled={locked} value={desired}
      onChange={e=>setDesired(e.target.value as LeadRequestStatus)}>{["New","Contacted","Negotiating","Completed","Lost"].map(v=><option key={v}>{v}</option>)}</select></label>
    <p role="status" className="my-3">{message}</p>
    <div className="flex flex-wrap gap-2">
      {state==="conflict"||state==="unavailable"?<button className="admin-action-secondary" onClick={()=>void review()}>Review latest lead</button>:
        state==="saved"?<button className="admin-action-secondary" onClick={()=>void refresh(desired)}>Refresh queue</button>:
        <button className="admin-action-primary" disabled={state!=="ready"&&state!=="unknown"} onClick={()=>void save()}>{state==="unknown"?"Retry same status change":"Save status"}</button>}
      <button className="admin-action-secondary" disabled={locked} onClick={close}>Cancel</button>
    </div>
  </dialog>;
}
