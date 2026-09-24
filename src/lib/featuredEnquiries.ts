import { logAdminActivity } from "@/lib/adminActivity";
import { insertSupabaseRecord, selectSupabaseRecords, updateSupabaseRecord } from "@/lib/supabase/admin";

export type FeaturedEnquiryRole = "Farmer" | "Supplier" | "Listing Owner";
export type FeaturedEnquiryStatus = "New" | "Contacted" | "Approved" | "Rejected" | "Closed";

export type FeaturedEnquiryRecord = {
  id: string;
  created_at: string;
  name: string;
  phone: string;
  whatsapp: string;
  email: string | null;
  role: FeaturedEnquiryRole;
  profile_or_listing_name: string;
  feature_request: string;
  message: string | null;
  status: FeaturedEnquiryStatus;
};

const allowedRoles = new Set<FeaturedEnquiryRole>(["Farmer", "Supplier", "Listing Owner"]);
const allowedStatuses = new Set<FeaturedEnquiryStatus>(["New", "Contacted", "Approved", "Rejected", "Closed"]);

function clean(value: unknown, limit = 300) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

export function normalizeFeaturedEnquiryPayload(payload: Record<string, unknown>) {
  const name = clean(payload.name);
  const phone = clean(payload.phone, 80);
  const whatsapp = clean(payload.whatsapp, 80);
  const email = clean(payload.email, 200);
  const role = clean(payload.role, 80) as FeaturedEnquiryRole;
  const profileOrListingName = clean(payload.profileOrListingName);
  const featureRequest = clean(payload.featureRequest, 700);
  const message = clean(payload.message, 1200);
  const honeypot = clean(payload.companyWebsite);

  if (honeypot) {
    return { error: "Submission could not be accepted." };
  }

  if (!allowedRoles.has(role)) {
    return { error: "Choose a valid role." };
  }

  if (!name || !phone || !whatsapp || !profileOrListingName || !featureRequest) {
    return { error: "Please complete all required fields." };
  }

  return {
    data: {
      name,
      phone,
      whatsapp,
      email: email || null,
      role,
      profile_or_listing_name: profileOrListingName,
      feature_request: featureRequest,
      message: message || null,
      status: "New" as FeaturedEnquiryStatus
    }
  };
}

export async function insertFeaturedEnquiry(payload: Record<string, unknown>) {
  const normalized = normalizeFeaturedEnquiryPayload(payload);

  if ("error" in normalized) {
    return { status: 400, error: normalized.error };
  }

  const insert = await insertSupabaseRecord("featured_membership_enquiries", normalized.data);

  if (!insert.error) {
    await logAdminActivity({
      adminEmail: "Public submission",
      actionType: "Submit",
      entityType: "Featured Enquiry",
      entityId: (insert.data as { id?: string } | undefined)?.id ?? null,
      entityName: `${normalized.data.name} requested featured placement`
    });
  }

  return insert;
}

export async function getFeaturedEnquiries(limit = 250) {
  const safeLimit = Math.min(Math.max(limit, 1), 250);

  return selectSupabaseRecords<FeaturedEnquiryRecord>(
    "featured_membership_enquiries",
    `select=id,created_at,name,phone,whatsapp,email,role,profile_or_listing_name,feature_request,message,status&order=created_at.desc&limit=${safeLimit}`
  );
}

export async function updateFeaturedEnquiryStatus({
  id,
  status,
  adminEmail
}: {
  id: string;
  status: FeaturedEnquiryStatus;
  adminEmail: string;
}) {
  if (!allowedStatuses.has(status)) {
    return { status: 400, error: "Choose a valid featured enquiry status." };
  }

  const update = await updateSupabaseRecord("featured_membership_enquiries", `id=eq.${encodeURIComponent(id)}`, { status });

  if (!update.error) {
    const actionType = status === "Contacted" ? "Contact" : status === "Closed" ? "Close" : status === "Approved" ? "Approve" : status === "Rejected" ? "Reject" : "Edit";

    await logAdminActivity({
      adminEmail,
      actionType,
      entityType: "Featured Enquiry",
      entityId: id,
      entityName: `featured enquiry marked ${status}`
    });
  }

  return update;
}

