import { logAdminActivity } from "@/lib/adminActivity";
import { insertSupabaseRecord, selectSupabaseRecords, updateSupabaseRecord } from "@/lib/supabase/admin";

export type LeadRequestStatus = "New" | "Contacted" | "Negotiating" | "Closed";
export type LeadRequestSourceType = "Farmer" | "Supplier" | "Marketplace Listing";

export type LeadRequestRecord = {
  id: string;
  created_at: string;
  requester_name: string;
  phone: string;
  whatsapp: string;
  location: string;
  product_interest: string;
  quantity_needed: string | null;
  message: string | null;
  source_type: LeadRequestSourceType;
  source_id: string;
  source_name: string;
  source_page: string | null;
  status: LeadRequestStatus;
};

const allowedSourceTypes = new Set<LeadRequestSourceType>(["Farmer", "Supplier", "Marketplace Listing"]);
const allowedStatuses = new Set<LeadRequestStatus>(["New", "Contacted", "Negotiating", "Closed"]);

function clean(value: unknown, limit = 300) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

export function normalizeLeadRequestPayload(payload: Record<string, unknown>) {
  const requesterName = clean(payload.requesterName);
  const phone = clean(payload.phone, 80);
  const whatsapp = clean(payload.whatsapp, 80);
  const location = clean(payload.location);
  const productInterest = clean(payload.productInterest);
  const quantityNeeded = clean(payload.quantityNeeded);
  const message = clean(payload.message, 1200);
  const sourceType = clean(payload.sourceType) as LeadRequestSourceType;
  const sourceId = clean(payload.sourceId, 120);
  const sourceName = clean(payload.sourceName);
  const sourcePage = clean(payload.sourcePage, 500);
  const honeypot = clean(payload.companyWebsite);

  if (honeypot) {
    return { error: "Submission could not be accepted." };
  }

  if (!allowedSourceTypes.has(sourceType)) {
    return { error: "Choose a valid connection source." };
  }

  if (!requesterName || !phone || !whatsapp || !location || !productInterest || !sourceId || !sourceName) {
    return { error: "Please complete all required fields." };
  }

  return {
    data: {
      requester_name: requesterName,
      phone,
      whatsapp,
      location,
      product_interest: productInterest,
      quantity_needed: quantityNeeded || null,
      message: message || null,
      source_type: sourceType,
      source_id: sourceId,
      source_name: sourceName,
      source_page: sourcePage || null,
      status: "New" as LeadRequestStatus
    }
  };
}

export async function insertLeadRequest(payload: Record<string, unknown>) {
  const normalized = normalizeLeadRequestPayload(payload);

  if ("error" in normalized) {
    return { status: 400, error: normalized.error };
  }

  const insert = await insertSupabaseRecord("lead_requests", normalized.data);

  if (!insert.error) {
    await logAdminActivity({
      adminEmail: "Public submission",
      actionType: "Submit",
      entityType: "Lead Request",
      entityId: (insert.data as { id?: string } | undefined)?.id ?? null,
      entityName: `${normalized.data.requester_name} requested ${normalized.data.source_name}`
    });
  }

  return insert;
}

export async function getRecentLeadRequests(limit = 250) {
  const safeLimit = Math.min(Math.max(limit, 1), 250);

  return selectSupabaseRecords<LeadRequestRecord>(
    "lead_requests",
    `select=id,created_at,requester_name,phone,whatsapp,location,product_interest,quantity_needed,message,source_type,source_id,source_name,source_page,status&order=created_at.desc&limit=${safeLimit}`
  );
}

export async function updateLeadRequestStatus({
  id,
  status,
  adminEmail
}: {
  id: string;
  status: LeadRequestStatus;
  adminEmail: string;
}) {
  if (!allowedStatuses.has(status)) {
    return { status: 400, error: "Choose a valid lead status." };
  }

  const update = await updateSupabaseRecord("lead_requests", `id=eq.${encodeURIComponent(id)}`, { status });

  if (!update.error) {
    await logAdminActivity({
      adminEmail,
      actionType: status === "Contacted" ? "Contact" : status === "Closed" ? "Close" : "Edit",
      entityType: "Lead Request",
      entityId: id,
      entityName: `lead marked ${status}`
    });
  }

  return update;
}
