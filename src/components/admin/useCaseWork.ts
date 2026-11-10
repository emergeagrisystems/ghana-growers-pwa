"use client";
import {useCallback,useEffect,useRef,useState} from "react";

export type Snapshot={
  id:string;version:number;owned:boolean;mine:boolean;note:string|null;next:string|null;due:string|null;
  first:{actor:string;time:string;channel:string}|null;link:string|null;
  timeline:{id:string;kind:string;first:boolean;actor:string;time:string;channel?:string;detail?:string}[];
  history:{reference:string;received:string;status:string;product?:string;quantity?:string;location?:string;sellers:string[]}[];
};
type Intent={id:string;operation:string;version:number;kind:string;input:Record<string,unknown>;priorReference?:string};
export function useCaseWork(id:string){
  const [current,setCurrent]=useState<Snapshot|null>(null),[busy,setBusy]=useState(false);
  const [message,setMessage]=useState(""),[conflict,setConflict]=useState(false),[unknown,setUnknown]=useState<Intent|null>(null);
  const pending=useRef(false);
  const load=useCallback(async()=>{
    const r=await fetch("/api/admin/case-work?id="+encodeURIComponent(id),{cache:"no-store"});
    if(!r.ok) throw Error();
    const data=await r.json();
    if(data.id!==id||!Number.isSafeInteger(data.version)) throw Error();
    return data as Snapshot;
  },[id]);
  useEffect(()=>{let active=true;load().then(data=>{if(active)setCurrent(data)}).catch(()=>{if(active)setMessage("Could not load the current case.")});return()=>{active=false}},[load]);
  async function review(){
    if(pending.current) return;
    pending.current=true;setBusy(true);
    try{setCurrent(await load());setConflict(false);setMessage("Latest case loaded. Review it alongside your draft before saving.");}
    catch{setMessage("Could not load the latest case. Your draft is retained.");}
    finally{pending.current=false;setBusy(false);}
  }
  async function save(kind:string,input:Intent["input"],priorReference?:string){
    if(!current||pending.current||conflict) return false;
    const intent=unknown??{id,operation:crypto.randomUUID(),version:current.version,kind,input,priorReference};
    pending.current=true;setBusy(true);
    try{
      const r=await fetch("/api/admin/case-work",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(intent)});
      const data=await r.json();
      if(r.status===409){setUnknown(null);setConflict(true);setMessage(data.error);return false;}
      if(!r.ok){if(r.status>=500)throw Error();setUnknown(null);setMessage(data.error||"Check the request before saving.");return false;}
      if(data.operation_id!==intent.operation)throw Error();
      setUnknown(null);setMessage("Saved.");
      try{setCurrent(await load());}catch{setCurrent(null);setMessage("Saved. Reload the latest case to continue.");}
      return true;
    }catch{setUnknown(intent);setMessage("Outcome unknown. Your draft is retained. Retry this same operation.");return false;}
    finally{pending.current=false;setBusy(false);}
  }
  return {current,busy,message,setMessage,conflict,unknown,review,save};
}
export type CaseWork=ReturnType<typeof useCaseWork>;
