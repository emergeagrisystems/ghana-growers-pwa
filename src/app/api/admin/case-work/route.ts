import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/adminAuth";
import { caseSummary, checkContactTarget, findPrior, findSellers } from "@/lib/staffCaseContacts";
import { idPattern, staffClient, staffError, staffRpc, stageOnly, isSameOriginWrite } from "@/lib/staffRpc";
export const dynamic="force-dynamic";
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"private, no-store"}});
export async function GET(request:Request) {
  if(!stageOnly()) return reply({error:"Unavailable."},404);
  const staff=await requireAdminUser(request);
  if(!staff?.id) return reply({error:"Staff sign-in required."},401);
  const params=new URL(request.url).searchParams,id=params.get("id")||"";
  if(!idPattern.test(id))return reply({error:"Invalid request."},400);
  try{
    const client=staffClient();
    const row=await staffRpc(client,"staff_case_read",{p_actor:staff.id,p_request:id});
    if(!row || row.request_id!==id)return reply({error:"Case unavailable."},404);
    if(params.has("sellerType")) return reply(await findSellers(client,params.get("sellerType")!,params.get("q")||""));
    if(params.has("reference")) return reply(await findPrior(client,staff.id,id,params.get("reference")!));
    return reply(await caseSummary(client,staff.id,row));
  }catch(e){const err=staffError(e);return reply(err.body,err.status);}
}
export async function POST(request:Request) {
  if(!isSameOriginWrite(request)) return reply({error:"Staff access must use this site."},403);
  if(!stageOnly())return reply({error:"Unavailable."},404);
  const staff=await requireAdminUser(request);
  if(!staff?.id)return reply({error:"Staff sign-in required."},401);
  const b=await request.json().catch(()=>null);
  if(!b || !idPattern.test(b.id) || !idPattern.test(b.operation) || !Number.isSafeInteger(b.version) || b.version<0
    || !b.input || typeof b.input!=="object" || Array.isArray(b.input)
    || !["claim","note","follow_up_set","buyer_contact","seller_contact","link","unlink"].includes(b.kind))return reply({error:"Invalid case command."},400);
  try{
    const client=staffClient();
    await checkContactTarget(client,staff.id,b.id,b.kind,b.input,b.priorReference);
    return reply(await staffRpc(client,"staff_case_command",{p_actor:staff.id,p_request:b.id,
      p_operation:b.operation,p_expected_version:b.version,p_kind:b.kind,p_input:b.input}));
  }catch(e){const err=staffError(e);return reply(err.body,err.status);}
}
