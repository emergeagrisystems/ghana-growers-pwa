import "server-only";
import { supplierPhotoPatch } from "@/lib/adminProfileEditor";
import { createHash, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { isolatedSupabaseUrl, RC1_STAGING_REF } from "@/lib/supabase/isolation";

export const idPattern = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const origin = `https://${RC1_STAGING_REF}.supabase.co`;
export const stageOnly = () => process.env.VERCEL_ENV !== "production" && isolatedSupabaseUrl() === origin;
export function isSameOriginWrite(request: Request) {
  const originHeader = request.headers.get("origin");
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  if (originHeader === null) return true;
  try {
    const browserOrigin = new URL(originHeader);
    const host = request.headers.get("host") ?? new URL(request.url).host;
    const local = ["127.0.0.1", "localhost", "[::1]"].includes(browserOrigin.hostname);
    return browserOrigin.origin === originHeader && browserOrigin.host === host
      && (browserOrigin.protocol === "https:" || (local && browserOrigin.protocol === "http:"));
  } catch { return false; }
}

export function staffClient() {
  if (!stageOnly() || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Staging unavailable");
  return createClient(origin, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    db: { retry: false }
  });
}
export const conflictCopy = {
  staff_case_command: "This case has changed. Review the latest case before saving again.",
  staff_supplier_media_save: "This profile was updated by someone else. Review the latest version before saving again.",
  staff_supplier_media_finish: "This photo job has changed. Check its current state before continuing."
} as const;
export class StaffRequestError extends Error {
  constructor(readonly status: number, message: string, readonly reconcile = false) { super(message); }
}
export async function staffRpc(client: ReturnType<typeof staffClient>, name: string, args: Record<string,unknown>) {
  const {data,error,status} = await client.rpc(name,args).abortSignal(AbortSignal.timeout(10000));
  if (!error) return data;
  if (status === 409 && error.code === "PT409" && Object.hasOwn(conflictCopy,name))
    throw new StaffRequestError(409, conflictCopy[name as keyof typeof conflictCopy], true);
  if (status === 409) throw new StaffRequestError(409,"This operation conflicts with an existing record. Review the record before saving again.",true);
  if (status >= 400 && status < 500 && status !== 408 && status !== 429)
    throw new StaffRequestError(status,"The requested change could not be accepted. Check the record and your entries.");
  throw new Error("Outcome unknown");
}
export function staffError(error:unknown) {
  return error instanceof StaffRequestError
    ? {status:error.status,body:{error:error.message,reconcile:error.reconcile}}
    : {status:503,body:{error:"The outcome could not be confirmed. Keep your draft and retry the same save.",uncertain:true}};
}

const formats: Record<string,string> = {"image/jpeg":"jpg","image/png":"png","image/webp":"webp"};
function digest(bytes:Buffer) { return createHash("sha256").update(bytes).digest("hex"); }
export async function saveSupplierPhoto(actor:string, form:FormData) {
  const id=String(form.get("id")), field=String(form.get("field")), version=String(form.get("version"));
  const operation=String(form.get("operation")), lease=String(form.get("lease")), file=form.get("file");
  if (![id,operation,lease].every(x=>idPattern.test(x)) || !["logo_url","profile_image_url"].includes(field)
      || !Number.isFinite(Date.parse(version)) || !(file instanceof File) || !Object.hasOwn(formats,file.type)
      || file.size<1 || file.size>5*1024*1024) throw new StaffRequestError(400,"Choose a JPG, PNG or WEBP image up to 5 MB.");
  const bytes=Buffer.from(await file.arrayBuffer()), ext=formats[file.type], hash=digest(bytes);
  const valid=ext==="png"?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):
    ext==="jpg"?bytes.subarray(0,3).equals(Buffer.from([255,216,255])):
    bytes.toString("ascii",0,4)==="RIFF" && bytes.toString("ascii",8,12)==="WEBP";
  if(!valid) throw new StaffRequestError(400,"The image contents do not match the file type.");
  let patch:Record<string,unknown>;
  try {
    const input=JSON.parse(String(form.get("changes")||"{}"));
    if(!input || typeof input!=="object" || Array.isArray(input))throw Error();
    patch=supplierPhotoPatch(input);
  } catch { throw new StaffRequestError(400,"Check the profile fields before saving."); }
  const client=staffClient();
  const staged=`editor-staging/${id}/${operation}.${ext}`, target=`editor-uploads/${id}/${field}/${operation}.${ext}`;
  const publicUrl=origin+"/storage/v1/object/public/suppliers/"+target;
  async function profile() {
    const {data,error}=await client.from("suppliers").select("id,updated_at,logo_url,profile_image_url").eq("id",id).single();
    if(error || !data) throw new Error("Supplier unavailable");
    return data as {updated_at:string;logo_url:string|null;profile_image_url:string|null};
  }
  const fileType=file.type;
  class InvalidCopy extends Error {}
  async function readVerified(bucket:string, path:string) {
    const {data,error}=await client.storage.from(bucket).download(path);
    if(error || !data) throw new Error("Could not read the stored image");
    if(data.type!==fileType || data.size!==bytes.length) throw new InvalidCopy();
    const copy=Buffer.from(await data.arrayBuffer());
    if(digest(copy)!==hash) throw new InvalidCopy();
    return copy;
  }
  async function storeAndVerify(bucket:string, path:string, body:Buffer) {
    // A lost acknowledgement or existing key is accepted only after exact read-back.
    await client.storage.from(bucket).upload(path,body,{contentType:fileType,upsert:false}).catch(()=>null);
    await readVerified(bucket,path);
  }
  await profile(); // Verify the protected supplier exists before staging any bytes.
  await storeAndVerify("supplier-application-media",staged,bytes);
  const receipt=await staffRpc(client,"staff_supplier_media_save",{p_actor:actor,p_supplier:id,p_operation:operation,p_base_version:version,
    p_field:field,p_profile_patch:patch,p_staged_key:staged,p_digest:hash});
  if(receipt?.job_id!==operation) throw new Error("Save not confirmed");
  const current=await profile();
  if(current[field as "logo_url"|"profile_image_url"]===publicUrl) return {url:publicUrl,version:current.updated_at};
  let job=await staffRpc(client,"staff_supplier_media_lease",{p_job:operation,p_lease:lease});
  // A manual retry may need a fresh worker lease, but always keeps the saved operation.
  if(job?.result==="lease_inactive" && current.updated_at===receipt.saved_version)
    job=await staffRpc(client,"staff_supplier_media_lease",{p_job:operation,p_lease:randomUUID()});
  if(job?.result!=="leased"){
    if(current.updated_at!==receipt.saved_version) throw new StaffRequestError(409,conflictCopy.staff_supplier_media_save,true);
    throw new StaffRequestError(503,"The photo has not been attached. Keep the photo and retry the same save.");
  }
  if(job.supplier_id!==id || job.job_id!==operation || !idPattern.test(job.lease_id) || job.public_key!==target || job.staged_key!==staged || job.digest!==hash || job.bytes!==bytes.length || job.mime!==fileType)
    throw new Error("Unexpected lease");
  if(Date.parse(job.lease_until)<=Date.now()) throw new Error("Lease expired before copy");
  try {
    const source=await readVerified("supplier-application-media",job.staged_key);
    await storeAndVerify("suppliers",job.public_key,source);
  } catch(error) {
    // Only a known copy failure is reported here. Never recast an unknown Finish as failure.
    const failure=await staffRpc(client,"staff_supplier_media_finish",{
      p_job:operation,p_lease:job.lease_id,p_verified_digest:null,
      p_result:error instanceof InvalidCopy?"verification_failed":"copy_error"
    });
    if(failure?.result==="superseded") throw new StaffRequestError(409,conflictCopy.staff_supplier_media_save,true);
    throw new Error("Copy not verified");
  }
  const finished=await staffRpc(client,"staff_supplier_media_finish",{p_job:operation,p_lease:job.lease_id,p_result:"verified",p_verified_digest:hash});
  if(finished?.result==="superseded") throw new StaffRequestError(409,conflictCopy.staff_supplier_media_save,true);
  if(finished?.result!=="attached") throw new Error("Attachment not confirmed");
  return {url:publicUrl,version:finished.version};
}
