import { createRecord, slugify, splitList } from "@/app/api/admin/records";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return createRecord({
    request,
    table: "suppliers",
    requiredFields: ["companyName", "contactPerson", "region", "district", "category", "productsServices", "whatsappNumber", "verificationStatus"],
    mapPayload: (payload) => ({
      slug: slugify(payload.companyName),
      company_name: payload.companyName,
      contact_person: payload.contactPerson,
      region: payload.region,
      district: payload.district,
      category: payload.category,
      products_services: splitList(payload.productsServices),
      whatsapp_number: payload.whatsappNumber,
      phone: payload.whatsappNumber,
      verification_status: payload.verificationStatus,
      verification_date: payload.verificationStatus === "Verified" ? new Date().toISOString().slice(0, 10) : null,
      verified_by: payload.verificationStatus === "Verified" ? "Ghana Growers Admin" : null,
      verification_notes: null,
      website: payload.website || null,
      status: payload.verificationStatus === "Rejected" ? "Archived" : "Active"
    })
  });
}
