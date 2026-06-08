import { createRecord, slugify } from "@/app/api/admin/records";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return createRecord({
    request,
    table: "marketplace_listings",
    requiredFields: ["productName", "category", "region", "district", "sellerFarmer", "quantity", "unit", "availability", "whatsappNumber"],
    mapPayload: (payload) => ({
      slug: slugify(`${payload.productName}-${payload.sellerFarmer}`),
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
    })
  });
}
