import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/adminAuth";
import { saveSupplierPhoto, staffError, staffCrmAvailable, isSameOriginWrite } from "@/lib/staffRpc";
export const dynamic="force-dynamic";
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"private, no-store"}});
export async function POST(request:Request) {
  if(!isSameOriginWrite(request)) return reply({error:"Staff access must use this site."},403);
  if(!staffCrmAvailable()) return reply({error:"Unavailable."},404);
  const staff=await requireAdminUser(request);
  if(!staff?.id) return reply({error:"Staff sign-in required."},401);
  if(Number(request.headers.get("content-length"))>6*1024*1024)return reply({error:"Choose an image up to 5 MB."},413);
  try {
    const form=await request.formData();
    return reply(await saveSupplierPhoto(staff.id,form));
  } catch(e) { const err=staffError(e);return reply(err.body,err.status); }
}
