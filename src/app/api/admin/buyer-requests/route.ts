import { createRecord } from "@/app/api/admin/records";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return createRecord({
    request,
    table: "buyer_requests",
    requiredFields: ["productNeeded", "quantity", "region", "district", "buyerType", "deadline", "status", "whatsappNumber"],
    mapPayload: (payload) => ({
      product_needed: payload.productNeeded,
      quantity: payload.quantity,
      region: payload.region,
      district: payload.district,
      buyer_type: payload.buyerType,
      deadline: payload.deadline,
      status: payload.status,
      whatsapp_number: payload.whatsappNumber,
      notes: payload.notes || null,
      verification_status: "Pending",
      verification_date: null,
      verified_by: null,
      verification_notes: null
    })
  });
}
