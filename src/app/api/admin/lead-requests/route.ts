import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/adminAuth";
import { getRecentLeadRequests, allowedStatuses } from "@/lib/leadRequests";

import { logAdminActivity } from "@/lib/adminActivity";
import { idPattern, isSameOriginWrite, stageOnly, staffClient, staffError, staffRpc } from "@/lib/staffRpc";

const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"private, no-store"}});
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const adminUser = await requireAdminUser(request);

  if (!adminUser) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  const id=new URL(request.url).searchParams.get("id");
  if(id!==null){
    if(!stageOnly()) return reply({error:"Shared case status is unavailable."},503);
    if(!idPattern.test(id)) return reply({error:"Invalid lead."},400);
    try{
      const row=await staffRpc(staffClient(),"staff_case_read",{p_actor:adminUser.id,p_request:id});
      if(row?.request_id!==id||!Number.isSafeInteger(row.version)||!row.lead_updated_at) return reply({error:"Could not load the saved versions."},503);
      return reply({id,status:row.status,version:row.version,updated_at:row.lead_updated_at});
    }catch(e){const err=staffError(e);return reply(err.body,err.status);}
  }
  const leads = await getRecentLeadRequests(250);

  if (leads.error) {
    console.error("[admin:lead-requests] Could not load lead requests", {
      status: leads.status,
      error: leads.error
    });
    return NextResponse.json({ error: "Could not load lead requests." }, { status: leads.status });
  }

  return NextResponse.json({ leads: leads.data ?? [] }, {
    headers: {
      "Cache-Control": "no-store, max-age=0"
    }
  });
}

export async function PATCH(request: Request) {
  if(!isSameOriginWrite(request)) return reply({error:"Use this staff site."},403);
  const adminUser = await requireAdminUser(request);

  if (!adminUser) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  if(!stageOnly()) return reply({error:"Version-checked status editing is unavailable."},503);
  const b=await request.json().catch(()=>null);
  if(!b||!idPattern.test(b.id)||!idPattern.test(b.operation)||!allowedStatuses.has(b.status)
    ||!Number.isSafeInteger(b.version)||b.version<0||typeof b.lead_updated_at!=="string"||!Number.isFinite(Date.parse(b.lead_updated_at)))
    return reply({error:"Choose a lead and status and load the original versions."},400);
  try{
    const receipt=await staffRpc(staffClient(),"staff_case_command",{
      p_actor:adminUser.id,p_request:b.id,p_operation:b.operation,p_expected_version:b.version,p_kind:"status",
      p_input:{status:b.status,lead_updated_at:b.lead_updated_at}
    });
    if(receipt?.operation_id!==b.operation || !idPattern.test(receipt.event_id)) throw Error("Unconfirmed receipt");
    // Replays reuse the CRM event's ID as the secondary activity log's primary key.
    await logAdminActivity({eventId:receipt.event_id,adminEmail:adminUser.email,entityType:"Lead Request",entityId:b.id,
      actionType:b.status==="Contacted"?"Contact":b.status==="Completed"?"Complete":b.status==="Lost"?"Close":"Edit",entityName:`lead marked ${b.status}`});
    return reply({ok:true,operation:receipt.operation_id,version:receipt.version});
  }catch(e){const err=staffError(e);return reply(err.body,err.status);}
}
