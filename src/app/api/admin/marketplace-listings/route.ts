import { createRecord, generateUniqueSlug, uniqueSlugAdminMessage, updateRecord } from "@/app/api/admin/records";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requiredFields = ["productName", "category", "region", "district", "sellerFarmer", "quantity", "unit", "availability", "whatsappNumber"];

export async function POST(request: Request) {
  return createRecord({
    request,
    table: "marketplace_listings",
    requiredFields,
    activity: {
      entityType: "Marketplace Listing",
      entityName: (payload) => payload.productName
    },
    mapPayload: async (payload) => {
      const slugSource = `${payload.productName}-${payload.sellerFarmer}`;
      const uniqueSlug = await generateUniqueSlug("marketplace_listings", slugSource);

      return {
        slug: uniqueSlug.slug,
        __slugBaseValue: slugSource,
        __adminError: uniqueSlug.error ? "Could not check whether this listing URL is available. Please try again." : undefined,
        __adminStatus: uniqueSlug.status,
        __adminMessage: uniqueSlug.wasChanged ? uniqueSlugAdminMessage() : undefined,
        product_name: payload.productName,
        category: payload.category,
        region: payload.region,
        district: payload.district,
        seller_name: payload.sellerFarmer,
        seller_type: "Farmer",
        quantity: payload.quantity,
        unit: payload.unit,
        availability: payload.availability,
        image_url: payload.imageUrl || null,
        whatsapp_number: payload.whatsappNumber,
        status: "Active",
        verification_status: "Pending Verification",
        featured: false
      };
    }
  });
}

export async function PATCH(request: Request) {
  return updateRecord({
    request,
    table: "marketplace_listings",
    filterColumn: "slug",
    requiredFields,
    activity: {
      entityType: "Marketplace Listing",
      entityName: (payload) => payload.productName
    },
    mapPayload: (payload) => ({
      product_name: payload.productName,
      category: payload.category,
      region: payload.region,
      district: payload.district,
      seller_name: payload.sellerFarmer,
      seller_type: "Farmer",
      quantity: payload.quantity,
      unit: payload.unit,
      availability: payload.availability,
      image_url: payload.imageUrl || null,
      whatsapp_number: payload.whatsappNumber,
      status: "Active"
    })
  });
}
