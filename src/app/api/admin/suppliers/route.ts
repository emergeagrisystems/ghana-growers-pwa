import { createRecord, generateUniqueSlug, splitList, uniqueSlugAdminMessage } from "@/app/api/admin/records";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return createRecord({
    request,
    table: "suppliers",
    requiredFields: ["companyName", "contactPerson", "region", "district", "category", "productsServices", "whatsappNumber", "verificationStatus"],
    mapPayload: async (payload) => {
      const uniqueSlug = await generateUniqueSlug("suppliers", payload.companyName);

      return {
        slug: uniqueSlug.slug,
        __slugBaseValue: payload.companyName,
        __adminError: uniqueSlug.error ? "Could not check whether this supplier URL is available. Please try again." : undefined,
        __adminStatus: uniqueSlug.status,
        __adminMessage: uniqueSlug.wasChanged ? uniqueSlugAdminMessage() : undefined,
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
        logo_url: payload.logoUrl || null,
        website: payload.website || null,
        status: payload.verificationStatus === "Rejected" ? "Archived" : "Active"
      };
    }
  });
}
