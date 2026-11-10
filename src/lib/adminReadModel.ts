import "server-only";
import { selectSupabaseRecords } from "@/lib/supabase/admin";
import { publicSupplierBadge } from "@/lib/publicDirectoryBadge";
import { isEligiblePublicFarmer, isEligiblePublicSupplier } from "@/lib/publicProfileEligibility";
import { leadReference } from "@/lib/adminCrm";

export type StaffQueue = "farmer" | "supplier" | "listing" | "buyer";
export type IntakeRow = {
  id: string; queue: StaffQueue; name: string; contactName:string; reference: string; status: string; received: string;
  phone: string; whatsapp: string; location: string; product: string; quantity: string; delivery: string;
  profileId: string | null; message:string; sellerKind:"farmer"|"supplier"|null; sellerId:string;
};
export type ProfileRow = {
  id: string; slug:string; kind: "farmer" | "supplier"; type: string; name: string; location: string; offerings: string[];
  phone: string; whatsapp: string; eligible: boolean; created: string; updated: string;
};
export type ReadResult<T> = { rows: T[]; available: boolean };
type Row = Record<string, unknown>;
const string = (r: Row, k: string) => typeof r[k] === "string" ? r[k] as string : "";
const location = (r: Row) => [string(r,"district"), string(r,"region")].filter(Boolean).join(", ");
const columns = {
  farmer: ["farmer_applications", "id,farm_name,applicant_name,phone_number,whatsapp_number,status,created_at,region,district,linked_farmer_id,reference:source_metadata->>application_reference"],
  supplier: ["supplier_applications", "id,business_name,business_or_farm_name,name,phone,whatsapp_number,status,created_at,region,district,linked_supplier_id,reference:source_metadata->>application_reference"],
  listing: ["listing_submissions", "id,product_name,seller_name,whatsapp_number,status,created_at,region,district,submission_reference"],
  buyer: ["lead_requests", "id,company_name,requester_name,phone,whatsapp,status,created_at,product_interest,quantity_needed,delivery_location,required_by,location,message,farmer_profile_id,supplier_profile_id"]
} as const;

// Do not present a failed page as a complete result or stop at the legacy latest-250 window.
async function scan(table: string, select: string): Promise<ReadResult<Row>> {
  const rows: Row[] = [];
  try {
    for (let offset = 0; ; offset += 250) {
      const page = await selectSupabaseRecords<Row>(table, `select=${select}&order=id.asc&limit=250&offset=${offset}`,{strictArray:true});
      if (page.error || !page.data) return { rows: [], available: false };
      rows.push(...page.data);
      if (page.data.length < 250) return { rows, available: true };
    }
  } catch { return { rows: [], available: false }; }
}

export async function readIntakes(queue: StaffQueue, overview=false): Promise<ReadResult<IntakeRow>> {
  const [table, fields] = columns[queue];
  const summaryFields = queue==="buyer" ? ",product_interest,company_name,requester_name" : queue==="listing" ? ",submission_reference" : ",reference:source_metadata->>application_reference";
  const result = await scan(table, overview ? "id,status,created_at"+summaryFields : fields);
  return { available: result.available, rows: result.rows.map((r):IntakeRow => {
    const id = string(r,"id");
    return {
      id, queue, contactName:string(r,"requester_name")||string(r,"applicant_name")||string(r,"name"), name: string(r,"company_name") || string(r,"requester_name") || string(r,"farm_name") || string(r,"business_name") || string(r,"business_or_farm_name") || string(r,"seller_name") || string(r,"applicant_name") || string(r,"name"),
      reference: queue === "buyer" ? leadReference(id) : string(r,"reference") || string(r,"submission_reference") || (queue === "listing" ? "LS-"+id.replace(/-/g,"").slice(0,8).toUpperCase() : id),
      status: string(r,"status"), received: string(r,"created_at"), phone: string(r,"phone") || string(r,"phone_number"),
      whatsapp: string(r,"whatsapp") || string(r,"whatsapp_number"), location: string(r,"delivery_location") || location(r) || string(r,"location"),
      product: string(r,"product_interest") || string(r,"product_name"), quantity: string(r,"quantity_needed"), delivery: string(r,"required_by"),
      message:string(r,"message"),sellerId:string(r,"farmer_profile_id")||string(r,"supplier_profile_id"),sellerKind:r.farmer_profile_id?"farmer":r.supplier_profile_id?"supplier":null,
      profileId: string(r,"linked_farmer_id") || string(r,"linked_supplier_id") || null
    };
  }).sort((a,b)=>Date.parse(a.received)-Date.parse(b.received)||a.id.localeCompare(b.id)) };
}

export async function readProfiles(kind: "farmer" | "supplier"): Promise<ReadResult<ProfileRow>> {
  const common = "id,slug,region,district,status,source,verification_status,created_at,updated_at,whatsapp_number,launch_ready";
  const fields = kind === "farmer" ? "farm_name,products,phone_number" : "company_name,category,products_services,phone";
  const result = await scan(kind === "farmer" ? "farmers" : "suppliers", common+","+fields);
  return {available:result.available, rows:result.rows.map(r=>{
    const identity = {slug:string(r,"slug"),source:string(r,"source"),status:string(r,"status"),verificationStatus:string(r,"verification_status"),launchReady:r.launch_ready===true};
    const offers = r[kind === "farmer" ? "products" : "products_services"];
    return {id:string(r,"id"),slug:string(r,"slug"),kind,type:kind === "farmer" ? "Farm" : publicSupplierBadge(string(r,"category")),name:string(r,"farm_name")||string(r,"company_name"),
      location:location(r),offerings:Array.isArray(offers)?offers.filter((x):x is string=>typeof x==="string"):[],
      phone:string(r,"phone")||string(r,"phone_number"),whatsapp:string(r,"whatsapp_number"),
      eligible:kind === "farmer"?isEligiblePublicFarmer(identity):isEligiblePublicSupplier(identity),created:string(r,"created_at"),updated:string(r,"updated_at")};
  })};
}
