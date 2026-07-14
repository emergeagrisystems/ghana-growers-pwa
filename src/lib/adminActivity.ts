import { insertSupabaseRecord, selectSupabaseRecords } from "@/lib/supabase/admin";

export type AdminActionType =
  | "Create"
  | "Edit"
  | "Verify"
  | "Archive"
  | "Review"
  | "Approve"
  | "Reject"
  | "Convert"
  | "View"
  | "Contact"
  | "Complete"
  | "Close"
  | "Submit"
  | "Marked Featured"
  | "Removed Featured"
  | "Featured Expired"
  | "Featured Note Updated"
  | "Publish";
export type AdminEntityType =
  | "Farmer"
  | "Supplier"
  | "Marketplace Listing"
  | "Buyer Request"
  | "Farmer Application"
  | "Buyer Application"
  | "Supplier Application"
  | "Listing Submission"
  | "Buyer Request Submission"
  | "Buyer Request Application"
  | "Match Opportunity"
  | "Lead Request"
  | "Featured Enquiry"
  | "Success Story";

export type AdminActivityLog = {
  id: string;
  admin_email: string;
  action_type: AdminActionType;
  entity_type: AdminEntityType;
  entity_id: string | null;
  entity_name: string;
  created_at: string;
};

export async function logAdminActivity({
  adminEmail,
  actionType,
  entityType,
  entityId,
  entityName
}: {
  adminEmail: string;
  actionType: AdminActionType;
  entityType: AdminEntityType;
  entityId?: string | null;
  entityName: string;
}) {
  const cleanName = entityName.trim() || "Record";

  try {
    await insertSupabaseRecord("admin_activity_log", {
      admin_email: adminEmail,
      action_type: actionType,
      entity_type: entityType,
      entity_id: entityId || null,
      entity_name: cleanName
    });

    return { ok: true as const };
  } catch {
    // Activity logging should never block the admin action itself.
    return { ok: false as const };
  }
}

export async function getRecentAdminActivity(limit = 25) {
  const safeLimit = Math.min(Math.max(limit, 1), 250);

  return selectSupabaseRecords<AdminActivityLog>(
    "admin_activity_log",
    `select=id,admin_email,action_type,entity_type,entity_id,entity_name,created_at&order=created_at.desc&limit=${safeLimit}`
  );
}
