import { createRecord, updateRecord } from "@/app/api/admin/records";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requiredFields = ["productNeeded", "quantity", "region", "district", "buyerType", "deadline", "status", "whatsappNumber"];

function mapBuyerRequestPayload(payload: Record<string, string>) {
  return {
    product_needed: payload.productNeeded,
    quantity: payload.quantity,
    region: payload.region,
    district: payload.district,
    buyer_type: payload.buyerType,
    deadline: payload.deadline,
    status: payload.status,
    whatsapp_number: payload.whatsappNumber,
    notes: payload.notes || null
  };
}

export async function POST(request: Request) {
  return createRecord({
    request,
    table: "buyer_requests",
    requiredFields,
    activity: {
      entityType: "Buyer Request",
      entityName: (payload) => payload.productNeeded
    },
    mapPayload: (payload) => ({
      ...mapBuyerRequestPayload(payload),
      verification_status: "Pending",
      verification_date: null,
      verified_by: null,
      verification_notes: null
    })
  });
}

export async function PATCH(request: Request) {
  return updateRecord({
    request,
    table: "buyer_requests",
    requiredFields,
    activity: {
      entityType: "Buyer Request",
      entityName: (payload) => payload.productNeeded
    },
    mapPayload: mapBuyerRequestPayload
  });
}
