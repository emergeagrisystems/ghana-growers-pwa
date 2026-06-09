import { createRecord, generateUniqueSlug } from "@/app/api/admin/records";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return createRecord({
    request,
    table: "marketplace_listings",
    requiredFields: ["productName", "category", "region", "district", "sellerFarmer", "quantity", "unit", "availability", "whatsappNumber"],
    mapPayload: async (payload) => {
      const uniqueSlug = await generateUniqueSlug("marketplace_listings", `${payload.productName}-${payload.sellerFarmer}`);

      return {
        slug: uniqueSlug.slug,
        __adminMessage: uniqueSlug.wasChanged
          ? "A record with this URL already exists. A unique URL has been generated automatically."
          : undefined,
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
