import { createRecord, slugify, splitList } from "@/app/api/admin/records";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return createRecord({
    request,
    table: "farmers",
    requiredFields: ["farmerName", "farmName", "region", "district", "farmType", "products", "farmSize", "whatsappNumber", "verificationStatus"],
    mapPayload: (payload) => ({
      slug: slugify(payload.farmName),
      farmer_name: payload.farmerName,
      farm_name: payload.farmName,
      region: payload.region,
      district: payload.district,
      farm_type: payload.farmType,
      products: splitList(payload.products),
      farm_size: payload.farmSize,
      whatsapp_number: payload.whatsappNumber,
      verification_status: payload.verificationStatus,
      profile_image_url: payload.profileImageUrl || null,
      status: payload.verificationStatus === "Pending Verification" ? "Pending" : "Active"
    })
  });
}
