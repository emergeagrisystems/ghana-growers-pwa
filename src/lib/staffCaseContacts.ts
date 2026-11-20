import "server-only";
import { leadReference } from "./adminCrm";
import { loadAdminProfile } from "./adminProfileEditor";
import { idPattern, staffClient, StaffRequestError, staffRpc } from "./staffRpc";

type Client = ReturnType<typeof staffClient>;
type SellerType = "farmer" | "supplier";
type SellerEvidence = {seller_type: SellerType; seller_id: string; contact_count: number};
type Prior = {request_id:string; received_at:string; status:string; sellers_contacted:SellerEvidence[]};
type Event = {id:string; actor_id:string; kind:string; occurred_at:string; channel?:string; first_buyer_reply:boolean;
  farmer_id?:string; supplier_id?:string; input:{note?:string; reason?:string; next_action?:string}};
type CaseData = {request_id:string; version:number; owner_id:string|null; next_action:string|null; due_at:string|null;
  first_reply:{actor_id:string; occurred_at:string; channel:string}|null; latest_note:{text:string}|null;
  link_id:string|null; timeline:Event[]; confirmed_history:Prior[]};
const sellerTables = {farmer: ["farmers","farm_name"], supplier: ["suppliers","company_name"]} as const;
const bad = (message:string) => new StaffRequestError(400,message);

export async function findSellers(client:Client, type:string, query:string) {
  if ((type!=="farmer" && type!=="supplier") || query.trim().length<2 || query.length>90) throw bad("Enter at least two letters of a seller name.");
  const [table,column]=sellerTables[type];
  const pattern=query.trim().replace(/[\\%_]/g,"\\$&");
  const {data,error}=await client.from(table).select(`id,name:${column},region,district`).ilike(column,"%"+pattern+"%").order(column).limit(15);
  if(error) throw Error();
  return {sellers:data};
}

export async function findPrior(client:Client,actor:string,current:string,reference:string) {
  const ref=reference.trim().toUpperCase();
  if(!/^BR-[0-9A-F]{10}$/.test(ref)) throw bad("Enter the complete BR reference.");
  const hex=ref.slice(3).toLowerCase();
  const bound=(digit:string)=>hex.slice(0,8)+"-"+hex.slice(8)+digit.repeat(2)+"-"+digit.repeat(4)+"-"+digit.repeat(4)+"-"+digit.repeat(12);
  const {data,error}=await client.from("lead_requests").select("id,company_name,requester_name,created_at")
    .gte("id",bound("0")).lte("id",bound("f")).limit(2);
  if(error) throw Error();
  if(data?.length!==1 || leadReference(data[0].id)!==ref || data[0].id===current) throw bad("Choose the exact reference of one different request.");
  const prior=await staffRpc(client,"staff_case_read",{p_actor:actor,p_request:data[0].id});
  if(prior?.request_id!==data[0].id || !idPattern.test(prior.buyer_id)) throw bad("First establish the confirmed buyer identity on that earlier request.");
  return {reference:ref,name:data[0].company_name||data[0].requester_name,received:data[0].created_at,buyer:prior.buyer_id};
}

export async function caseSummary(client:Client,actor:string,row:CaseData) {
  const history=row.confirmed_history??[], timeline=row.timeline??[];
  const sellerNames=new Map<string,string>();
  for(const type of ["farmer","supplier"] as const) {
    const eventIds=timeline.map(e=>type==="farmer"?e.farmer_id:e.supplier_id);
    const ids=Array.from(new Set([...eventIds,...history.flatMap(h=>h.sellers_contacted.filter(s=>s.seller_type===type).map(s=>s.seller_id))].filter((v):v is string=>!!v)));
    if(!ids.length) continue;
    const [table,column]=sellerTables[type];
    const {data,error}=await client.from(table).select(`id,name:${column}`).in("id",ids);
    if(error) throw Error();
    for(const seller of data??[]) sellerNames.set(type+seller.id,seller.name);
  }
  const details=new Map<string,{product_interest:string;quantity_needed:string;delivery_location:string}>();
  if(history.length) {
    const {data,error}=await client.from("lead_requests").select("id,product_interest,quantity_needed,delivery_location").in("id",history.map(h=>h.request_id));
    if(error) throw Error();
    for(const lead of data??[]) details.set(lead.id,lead);
  }
  const who=(id:string)=>id===actor?"You":"Staff "+id.slice(0,8);
  return {id:row.request_id,version:row.version,owned:!!row.owner_id,mine:row.owner_id===actor,note:row.latest_note?.text??null,next:row.next_action,due:row.due_at,
    first:row.first_reply?{actor:who(row.first_reply.actor_id),time:row.first_reply.occurred_at,channel:row.first_reply.channel}:null,
    link:row.link_id??null,history:history.map(h=>({reference:leadReference(h.request_id),received:h.received_at,status:h.status,
      product:details.get(h.request_id)?.product_interest,quantity:details.get(h.request_id)?.quantity_needed,location:details.get(h.request_id)?.delivery_location,
      sellers:h.sellers_contacted.map(s=>sellerNames.get(s.seller_type+s.seller_id)??s.seller_type)})),
    timeline:timeline.map(e=>({id:e.id,kind:e.kind,first:e.first_buyer_reply,actor:who(e.actor_id),time:e.occurred_at,channel:e.channel,
      detail:e.farmer_id?sellerNames.get("farmer"+e.farmer_id):e.supplier_id?sellerNames.get("supplier"+e.supplier_id):e.input.reason||e.input.next_action||e.input.note}))};
}

export async function checkContactTarget(client:Client,actor:string,id:string,kind:string,input:Record<string,unknown>,priorReference:unknown) {
  if(kind==="seller_contact") {
    const type=input.seller_type, target=input.seller_id;
    if((type!=="farmer"&&type!=="supplier") || typeof target!=="string" || !idPattern.test(target)) throw bad("Choose a farmer or supplier.");
    const profile=await loadAdminProfile(type,target);
    if(profile.status!==200 || profile.record?.id!==target) throw new StaffRequestError(profile.status>=500?503:404,"That seller could not be verified.");
  }
  if(kind==="link" && !Object.hasOwn(input,"create_identity")) {
    if(typeof priorReference!=="string") throw bad("Verify an earlier request by its BR reference.");
    const prior=await findPrior(client,actor,id,priorReference);
    if(prior.buyer!==input.buyer_id) throw new StaffRequestError(409,"The earlier buyer link changed. Check the reference again.",true);
  }
}
