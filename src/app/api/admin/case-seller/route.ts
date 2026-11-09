import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/adminAuth";
import { selectSupabaseRecords } from "@/lib/supabase/admin";

export const dynamic="force-dynamic";
const reply=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{"Cache-Control":"private, no-store"}});
export async function GET(request:Request) {
  if(!await requireAdminUser(request))return reply({error:"Staff sign-in required."},401);
  const id=new URL(request.url).searchParams.get("case");
  if(!id||!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id))return reply({error:"Invalid case."},400);
  const lead=await selectSupabaseRecords<{farmer_profile_id:string|null;supplier_profile_id:string|null}>("lead_requests","select=farmer_profile_id,supplier_profile_id&id=eq."+id+"&limit=1");
  if(lead.error)return reply({error:"Case unavailable."},503);
  const row=lead.data?.[0];
  if(!row)return reply({error:"Case not found."},404);
  if(Boolean(row.farmer_profile_id)===Boolean(row.supplier_profile_id))return reply({error:"No single linked seller."},409);
  const farmer=!!row.farmer_profile_id;
  const sellerId=encodeURIComponent((row.farmer_profile_id||row.supplier_profile_id)!);
  const fields=farmer?"name:farm_name,phone:phone_number,whatsapp:whatsapp_number":"name:company_name,phone,whatsapp:whatsapp_number";
  const seller=await selectSupabaseRecords<{name:string;phone:string;whatsapp:string}>(farmer?"farmers":"suppliers","select="+fields+"&id=eq."+sellerId+"&limit=1");
  if(seller.error||!seller.data?.[0])return reply({error:"Seller contact unavailable."},seller.error?503:404);
  return reply(seller.data[0]);
}
