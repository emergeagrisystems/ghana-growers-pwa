import "server-only";

import { logAdminActivity, type AdminActionType, type AdminEntityType } from "@/lib/adminActivity";
import {
  loadProfileApplicationsForAdmin,
  type FarmerApplicationAdminRow,
  type SupplierApplicationAdminRow
} from "@/lib/profileApplications";
import { insertSupabaseRecord, updateSupabaseRecord } from "@/lib/supabase/admin";

export type ApplicationKind = "farmer" | "buyer" | "supplier";
export type ApplicationStatus = "New" | "Pending" | "Under Review" | "Approved" | "Rejected" | "Converted";
export type ApplicationQueueState = "loaded" | "unavailable" | "error";

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
  normalized_categories?: string[] | null;
  private_logo_path?: string | null;
  private_photo_paths?: string[] | null;
  private_certificate_paths?: string[] | null;
  private_document_paths?: string[] | null;
  private_profile_image_path?: string | null;
  private_farm_image_paths?: string[] | null;
  private_produce_image_paths?: string[] | null;
  application_reference?: string | null;
  farm_location?: string | null;
  farm_type?: string | null;
  production_details?: string | null;
  current_availability?: string | null;
  supply_frequency?: string | null;
  harvest_season?: string | null;
  delivery_preference?: string | null;
  review_state?: string | null;
  verification_decision?: string | null;
  linked_farmer_id?: string | null;
  linked_supplier_id?: string | null;
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

export async function getApplicationQueue(kind: ApplicationKind): Promise<{
  kind: ApplicationKind;
  state: ApplicationQueueState;
  applications: ApplicationRecord[];
  source: string;
  status: number;
}> {
  if (kind === "buyer") {
    return {
      kind,
      state: "unavailable",
      applications: [],
      source: "buyer_applications",
      status: 200
    };
  }

  const result = await loadProfileApplicationsForAdmin(kind);

  if (result.error) {
    return {
      kind,
      state: "error",
      applications: [],
      source: tableByKind[kind],
      status: result.status
    };
  }

  return {
    kind,
    state: "loaded",
    applications: kind === "farmer"
      ? (result.data ?? []).map((application) => mapFarmerApplication(application as FarmerApplicationAdminRow))
      : (result.data ?? []).map((application) => mapSupplierApplication(application as SupplierApplicationAdminRow)),
    source: tableByKind[kind],
    status: result.status
  };
}

function mapFarmerApplication(application: FarmerApplicationAdminRow): ApplicationRecord {
  const applicationReference = typeof application.source_metadata?.application_reference === "string"
    ? application.source_metadata.application_reference
    : null;
  return {
    id: application.id,
    name: application.applicant_name,
    business_or_farm_name: application.farm_name ?? null,
    phone: application.phone_number,
    whatsapp_number: application.whatsapp_number ?? "",
    email: application.email ?? "",
    region: application.region,
    district: application.district,
    user_type: "Farmer",
    products_or_services: (application.crops_products ?? []).join(", "),
    notes: application.application_message ?? application.admin_notes ?? null,
    application_reference: applicationReference,
    farm_location: application.location ?? null,
    farm_type: application.farm_type,
    production_details: application.production_details ?? null,
    current_availability: application.current_availability ?? null,
    supply_frequency: application.supply_frequency ?? null,
    harvest_season: application.harvest_season ?? null,
    delivery_preference: application.delivery_preference ?? null,
    status: application.status as ApplicationStatus,
    created_at: application.created_at,
    updated_at: application.updated_at,
    private_profile_image_path: application.private_profile_image_path,
    private_farm_image_paths: application.private_farm_image_paths,
    private_produce_image_paths: application.private_produce_image_paths,
    private_document_paths: application.private_document_paths,
    review_state: application.review_state,
    verification_decision: application.verification_decision,
    linked_farmer_id: application.linked_farmer_id,
    launch_ready: application.launch_ready
  };
}

function mapSupplierApplication(application: SupplierApplicationAdminRow): ApplicationRecord {
  return {
    id: application.id,
    name: application.name ?? application.contact_person ?? "Supplier application",
    business_or_farm_name: application.business_or_farm_name ?? application.business_name ?? null,
    business_name: application.business_name ?? null,
    phone: application.phone ?? "",
    whatsapp_number: application.whatsapp_number ?? "",
    email: application.email ?? "",
    region: application.region ?? null,
    district: application.district ?? null,
    user_type: "Supplier",
    products_or_services: application.products_or_services ?? null,
    notes: application.notes ?? application.admin_notes ?? null,
    status: application.status as ApplicationStatus,
    created_at: application.created_at,
    updated_at: application.updated_at,
    website_url: application.website_url ?? null,
    registration_number: application.registration_number ?? null,
    categories: application.categories ?? null,
    normalized_categories: application.normalized_categories ?? null,
    regions_served: application.regions_served ?? null,
    business_description: application.business_description ?? null,
    years_in_business: application.years_in_business ?? null,
    private_logo_path: application.private_logo_path,
    private_photo_paths: application.private_photo_paths,
    private_certificate_paths: application.private_certificate_paths,
    private_document_paths: application.private_document_paths,
    review_state: application.review_state,
    verification_decision: application.verification_decision,
    linked_supplier_id: application.linked_supplier_id,
    gg_standard_agreement: application.gg_standard_agreement,
    launch_ready: application.launch_ready
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
