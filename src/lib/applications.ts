import { logAdminActivity, type AdminActionType, type AdminEntityType } from "@/lib/adminActivity";
import { insertSupabaseRecord, selectSupabaseRecords, updateSupabaseRecord } from "@/lib/supabase/admin";

export type ApplicationKind = "farmer" | "buyer" | "supplier";
export type ApplicationStatus = "New" | "Pending" | "Under Review" | "Approved" | "Rejected" | "Converted";

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
  business_name?: string | null;
  website_url?: string | null;
  registration_number?: string | null;
  categories?: string[] | null;
  regions_served?: string[] | null;
  products_services?: string | null;
  business_description?: string | null;
  years_in_business?: string | null;
  logo_url?: string | null;
  photo_urls?: string[] | null;
  certificate_urls?: string[] | null;
  gg_standard_agreement?: boolean | null;
  launch_status?: string | null;
  homepage_candidate?: boolean | null;
  marketplace_featured?: boolean | null;
  story_candidate?: boolean | null;
  editorial_notes?: string | null;
  launch_ready?: boolean | null;
  launch_checklist?: Record<string, boolean> | null;
  editorial_updated_at?: string | null;
  editorial_updated_by?: string | null;
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
  Pending: "Create",
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
  const baseQuery =
    "select=id,name,business_or_farm_name,phone,whatsapp_number,email,region,district,user_type,products_or_services,notes,status,created_at,updated_at&order=created_at.desc&limit=500";
  const supplierQuery =
    "select=id,name,business_or_farm_name,phone,whatsapp_number,email,region,district,user_type,products_or_services,notes,status,created_at,updated_at,business_name,website_url,registration_number,categories,regions_served,products_services,business_description,years_in_business,logo_url,photo_urls,certificate_urls,gg_standard_agreement,launch_status,homepage_candidate,marketplace_featured,story_candidate,editorial_notes,launch_ready,launch_checklist,editorial_updated_at,editorial_updated_by&order=created_at.desc&limit=500";
  const [farmers, buyers, suppliers] = await Promise.all([
    selectSupabaseRecords<ApplicationRecord>("farmer_applications", baseQuery),
    selectSupabaseRecords<ApplicationRecord>("buyer_applications", baseQuery),
    selectSupabaseRecords<ApplicationRecord>("supplier_applications", supplierQuery)
  ]);

  return {
    farmers: farmers.data ?? [],
    buyers: buyers.data ?? [],
    suppliers: suppliers.data ?? [],
    error: farmers.error || buyers.error || suppliers.error
  };
}

export async function updateSupplierEditorial({
  id,
  editorial,
  adminEmail,
  entityName
}: {
  id: string;
  editorial: {
    launchStatus: string;
    homepageCandidate: boolean;
    marketplaceFeatured: boolean;
    storyCandidate: boolean;
    editorialNotes: string;
    launchChecklist: Record<string, boolean>;
    launchReady: boolean;
  };
  adminEmail: string;
  entityName: string;
}) {
  const update = await updateSupabaseRecord("supplier_applications", `id=eq.${encodeURIComponent(id)}`, {
    launch_status: editorial.launchStatus,
    homepage_candidate: editorial.homepageCandidate,
    marketplace_featured: editorial.marketplaceFeatured,
    story_candidate: editorial.storyCandidate,
    editorial_notes: editorial.editorialNotes,
    launch_checklist: editorial.launchChecklist,
    launch_ready: editorial.launchReady,
    editorial_updated_at: new Date().toISOString(),
    editorial_updated_by: adminEmail,
    updated_at: new Date().toISOString()
  });

  if (!update.error) {
    await logAdminActivity({
      adminEmail,
      actionType: "Edit",
      entityType: "Supplier Application",
      entityId: id,
      entityName
    });
  }

  return update;
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
