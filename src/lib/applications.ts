import { logAdminActivity, type AdminActionType, type AdminEntityType } from "@/lib/adminActivity";
import { insertSupabaseRecord, selectSupabaseRecords, updateSupabaseRecord } from "@/lib/supabase/admin";

export type ApplicationKind = "farmer" | "buyer" | "supplier";
export type ApplicationStatus = "New" | "Under Review" | "Approved" | "Rejected" | "Converted";

export type ApplicationRecord = {
  id: string;
  name: string;
  business_or_farm_name: string | null;
  phone: string;
  whatsapp_number: string;
  email: string;
  region: string | null;
  district: string | null;
  user_type: "Farmer" | "Buyer" | "Supplier";
  products_or_services: string | null;
  notes: string | null;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
};

const tableByKind: Record<ApplicationKind, string> = {
  farmer: "farmer_applications",
  buyer: "buyer_applications",
  supplier: "supplier_applications"
};

const entityByKind: Record<ApplicationKind, AdminEntityType> = {
  farmer: "Farmer Application",
  buyer: "Buyer Application",
  supplier: "Supplier Application"
};

const actionByStatus: Record<ApplicationStatus, AdminActionType> = {
  New: "Create",
  "Under Review": "Review",
  Approved: "Approve",
  Rejected: "Reject",
  Converted: "Convert"
};

export async function insertApplication(kind: ApplicationKind, payload: Omit<ApplicationRecord, "id" | "status" | "created_at" | "updated_at">) {
  return insertSupabaseRecord(tableByKind[kind], {
    ...payload,
    status: "New"
  });
}

export async function getApplications() {
  const query =
    "select=id,name,business_or_farm_name,phone,whatsapp_number,email,region,district,user_type,products_or_services,notes,status,created_at,updated_at&order=created_at.desc&limit=500";
  const [farmers, buyers, suppliers] = await Promise.all([
    selectSupabaseRecords<ApplicationRecord>("farmer_applications", query),
    selectSupabaseRecords<ApplicationRecord>("buyer_applications", query),
    selectSupabaseRecords<ApplicationRecord>("supplier_applications", query)
  ]);

  return {
    farmers: farmers.data ?? [],
    buyers: buyers.data ?? [],
    suppliers: suppliers.data ?? [],
    error: farmers.error || buyers.error || suppliers.error
  };
}

export async function updateApplicationStatus({
  kind,
  id,
  status,
  adminEmail,
  entityName
}: {
  kind: ApplicationKind;
  id: string;
  status: ApplicationStatus;
  adminEmail: string;
  entityName: string;
}) {
  const update = await updateSupabaseRecord(tableByKind[kind], `id=eq.${encodeURIComponent(id)}`, {
    status,
    updated_at: new Date().toISOString()
  });

  if (!update.error) {
    await logAdminActivity({
      adminEmail,
      actionType: actionByStatus[status],
      entityType: entityByKind[kind],
      entityId: id,
      entityName
    });
  }

  return update;
}
