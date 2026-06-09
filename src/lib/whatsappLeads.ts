import { insertSupabaseRecord, selectSupabaseRecords } from "@/lib/supabase/admin";
import type { WhatsAppLeadSourceType } from "@/lib/whatsappLeadTracking";

export type WhatsAppLeadRecord = {
  id: string;
  source_type: WhatsAppLeadSourceType;
  source_id: string;
  source_name: string;
  phone_number: string;
  page_path: string;
  user_agent: string | null;
  created_at: string;
};

const allowedSourceTypes = new Set<WhatsAppLeadSourceType>([
  "Farmer",
  "Supplier",
  "Marketplace Listing",
  "Buyer Request",
  "Floating WhatsApp",
  "Platform"
]);

function clean(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim().slice(0, 300) : fallback;
}

export function normalizeWhatsAppLeadPayload(payload: Record<string, unknown>, userAgent: string | null) {
  const sourceType = clean(payload.sourceType) as WhatsAppLeadSourceType;

  if (!allowedSourceTypes.has(sourceType)) {
    return { error: "Invalid WhatsApp lead source." };
  }

  const sourceId = clean(payload.sourceId, "unknown");
  const sourceName = clean(payload.sourceName, "Ghana Growers");
  const phoneNumber = clean(payload.phoneNumber);
  const pagePath = clean(payload.pagePath, "/");

  if (!phoneNumber) {
    return { error: "WhatsApp phone number is required." };
  }

  return {
    data: {
      source_type: sourceType,
      source_id: sourceId || "unknown",
      source_name: sourceName || "Ghana Growers",
      phone_number: phoneNumber,
      page_path: pagePath || "/",
      user_agent: userAgent ? userAgent.slice(0, 500) : null
    }
  };
}

export async function insertWhatsAppLead(payload: Record<string, unknown>, userAgent: string | null) {
  const normalized = normalizeWhatsAppLeadPayload(payload, userAgent);

  if ("error" in normalized) {
    return { status: 400, error: normalized.error };
  }

  return insertSupabaseRecord("whatsapp_leads", normalized.data);
}

export async function getRecentWhatsAppLeads(limit = 250) {
  const safeLimit = Math.min(Math.max(limit, 1), 250);

  return selectSupabaseRecords<WhatsAppLeadRecord>(
    "whatsapp_leads",
    `select=id,source_type,source_id,source_name,phone_number,page_path,user_agent,created_at&order=created_at.desc&limit=${safeLimit}`
  );
}
