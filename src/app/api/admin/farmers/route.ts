import { createRecord, generateUniqueSlug, splitList, uniqueSlugAdminMessage, updateRecord } from "@/app/api/admin/records";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requiredFields = ["farmerName", "farmName", "region", "district", "farmType", "products", "farmSize", "whatsappNumber", "verificationStatus"];

function farmerSlugSource(farmerName: string, farmName: string) {
  const cleanFarmerName = farmerName.trim();
  const cleanFarmName = farmName.trim();

  if (cleanFarmerName.split(/\s+/).filter(Boolean).length >= 2) {
    return cleanFarmerName;
  }

  return cleanFarmName || cleanFarmerName;
}

export async function POST(request: Request) {
  return createRecord({
    request,
    table: "farmers",
    requiredFields,
    mapPayload: async (payload) => {
      const slugSource = farmerSlugSource(payload.farmerName, payload.farmName);
      const uniqueSlug = await generateUniqueSlug("farmers", slugSource);

      return {
        slug: uniqueSlug.slug,
        __slugBaseValue: slugSource,
        __adminError: uniqueSlug.error ? "Could not check whether this farmer URL is available. Please try again." : undefined,
        __adminStatus: uniqueSlug.status,
        __adminMessage: uniqueSlug.wasChanged ? uniqueSlugAdminMessage() : undefined,
        farmer_name: payload.farmerName,
        farm_name: payload.farmName,
        region: payload.region,
        district: payload.district,
        farm_type: payload.farmType,
        products: splitList(payload.products),
        farm_size: payload.farmSize,
        whatsapp_number: payload.whatsappNumber,
        verification_status: payload.verificationStatus,
        verification_date: payload.verificationStatus === "Verified" ? new Date().toISOString().slice(0, 10) : null,
        verified_by: payload.verificationStatus === "Verified" ? "Ghana Growers Admin" : null,
        verification_notes: null,
        profile_image_url: payload.profileImageUrl || null,
        status: payload.verificationStatus === "Rejected" ? "Archived" : "Active"
      };
    }
  });
}

export async function PATCH(request: Request) {
  return updateRecord({
    request,
    table: "farmers",
    filterColumn: "slug",
    requiredFields,
    mapPayload: (payload) => ({
      farmer_name: payload.farmerName,
      farm_name: payload.farmName,
      region: payload.region,
      district: payload.district,
      farm_type: payload.farmType,
      products: splitList(payload.products),
      farm_size: payload.farmSize,
      whatsapp_number: payload.whatsappNumber,
      verification_status: payload.verificationStatus,
      verification_date: payload.verificationStatus === "Verified" ? new Date().toISOString().slice(0, 10) : null,
      verified_by: payload.verificationStatus === "Verified" ? "Ghana Growers Admin" : null,
      profile_image_url: payload.profileImageUrl || null,
      status: payload.verificationStatus === "Rejected" ? "Archived" : "Active"
    })
  });
}
