import { generateUniqueSlug } from "@/app/api/admin/records";
import { logAdminActivity, type AdminActionType, type AdminEntityType } from "@/lib/adminActivity";
import { insertSupabaseRecord, selectSupabaseRecords, updateSupabaseRecord, uploadSupabaseStorageObject } from "@/lib/supabase/admin";

export type SubmissionStatus = "New" | "Under Review" | "Approved" | "Rejected" | "Converted" | "Published";
export type SubmissionKind = "listing" | "buyer-request";

export type ListingSubmission = {
  id: string;
  product_name: string;
  category: string;
  quantity: string;
  unit: string;
  region: string;
  district: string;
  seller_name: string;
  seller_type: "Farmer" | "Supplier";
  whatsapp_number: string;
  description: string;
  image_url: string | null;
  status: SubmissionStatus;
  created_at: string;
  updated_at: string;
};

export type BuyerRequestSubmission = {
  id: string;
  product_needed: string;
  quantity: string;
  company_name: string | null;
  phone_number: string;
  region: string;
  district: string;
  buyer_name: string;
  buyer_type: string;
  whatsapp_number: string;
  preferred_delivery: string | null;
  deadline: string;
  notes: string | null;
  status: SubmissionStatus;
  created_at: string;
  updated_at: string;
};

const statusAction: Record<SubmissionStatus, AdminActionType> = {
  New: "Create",
  "Under Review": "Review",
  Approved: "Approve",
  Rejected: "Reject",
  Converted: "Convert",
  Published: "Publish"
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 500) : "";
}

function isSpam(payload: Record<string, string | null>, fields: string[]) {
  return fields.every((field) => !payload[field]);
}

export async function createListingSubmission(formData: FormData) {
  if (clean(formData.get("companyWebsite"))) {
    return { status: 400, error: "Submission could not be accepted." };
  }

  const payload = {
    product_name: clean(formData.get("productName")),
    category: clean(formData.get("category")),
    quantity: clean(formData.get("quantity")),
    unit: clean(formData.get("unit")),
    region: clean(formData.get("region")),
    district: clean(formData.get("district")),
    seller_name: clean(formData.get("sellerName")),
    seller_type: clean(formData.get("sellerType")) as "Farmer" | "Supplier",
    whatsapp_number: clean(formData.get("whatsappNumber")),
    description: clean(formData.get("description"))
  };
  const required = ["product_name", "category", "quantity", "unit", "region", "district", "seller_name", "seller_type", "whatsapp_number", "description"];

  if (isSpam(payload, required)) {
    return { status: 400, error: "Submission cannot be empty." };
  }

  const missing = required.find((field) => !payload[field as keyof typeof payload]);

  if (missing || !["Farmer", "Supplier"].includes(payload.seller_type)) {
    return { status: 400, error: "Please complete all required listing fields." };
  }

  const image = formData.get("image");
  let imageUrl: string | null = null;

  if (image instanceof File && image.size > 0) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(image.type)) {
      return { status: 400, error: "Upload a JPG, PNG, or WEBP image." };
    }

    if (image.size > 5 * 1024 * 1024) {
      return { status: 400, error: "Image must be 5MB or smaller." };
    }

    const extension = image.type === "image/png" ? "png" : image.type === "image/webp" ? "webp" : "jpg";
    const upload = await uploadSupabaseStorageObject({
      bucket: "marketplace",
      path: `submissions/${Date.now()}-${payload.product_name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.${extension}`,
      contentType: image.type,
      body: await image.arrayBuffer()
    });

    if (upload.error) {
      return { status: upload.status, error: "Could not upload image. Please try again." };
    }

    imageUrl = upload.publicUrl ?? null;
  }

  const insert = await insertSupabaseRecord("listing_submissions", {
    ...payload,
    image_url: imageUrl,
    status: "New"
  });

  if (!insert.error) {
    const insertedRecord = insert.data as { id?: string } | undefined;
    await logAdminActivity({
      adminEmail: "public-submission@ghana-growers",
      actionType: "Create",
      entityType: "Listing Submission",
      entityId: insertedRecord?.id,
      entityName: payload.product_name
    });
  }

  return insert;
}

export async function createBuyerRequestSubmission(body: Record<string, unknown>) {
  if (clean(body.companyWebsite)) {
    return { status: 400, error: "Submission could not be accepted." };
  }

  const payload = {
    product_needed: clean(body.productNeeded),
    quantity: clean(body.quantityNeeded || body.quantity),
    company_name: clean(body.companyName) || null,
    phone_number: clean(body.phoneNumber),
    region: clean(body.region),
    district: clean(body.district),
    buyer_name: clean(body.buyerName),
    buyer_type: clean(body.buyerType) || "Buyer",
    whatsapp_number: clean(body.whatsappNumber),
    preferred_delivery: clean(body.preferredDelivery) || null,
    deadline: clean(body.deadline),
    notes: clean(body.additionalNotes || body.notes)
  };
  const required = ["product_needed", "quantity", "phone_number", "region", "district", "buyer_name", "whatsapp_number", "deadline"];

  if (isSpam(payload, required)) {
    return { status: 400, error: "Submission cannot be empty." };
  }

  const missing = required.find((field) => !payload[field as keyof typeof payload]);

  if (missing) {
    return { status: 400, error: "Please complete all required buyer request fields." };
  }

  const insert = await insertSupabaseRecord("buyer_request_applications", {
    ...payload,
    status: "New"
  });

  if (!insert.error) {
    const insertedRecord = insert.data as { id?: string } | undefined;
    await logAdminActivity({
      adminEmail: "public-submission@ghana-growers",
      actionType: "Create",
      entityType: "Buyer Request Application",
      entityId: insertedRecord?.id,
      entityName: payload.product_needed
    });
  }

  return insert;
}

export async function getPublicSubmissions() {
  const listingQuery =
    "select=id,product_name,category,quantity,unit,region,district,seller_name,seller_type,whatsapp_number,description,image_url,status,created_at,updated_at&order=created_at.desc&limit=500";
  const buyerQuery =
    "select=id,product_needed,quantity,company_name,phone_number,region,district,buyer_name,buyer_type,whatsapp_number,preferred_delivery,deadline,notes,status,created_at,updated_at&order=created_at.desc&limit=500";
  const [listings, buyerRequests] = await Promise.all([
    selectSupabaseRecords<ListingSubmission>("listing_submissions", listingQuery),
    selectSupabaseRecords<BuyerRequestSubmission>("buyer_request_applications", buyerQuery)
  ]);

  return {
    listings: listings.data ?? [],
    buyerRequests: buyerRequests.data ?? [],
    error: listings.error || buyerRequests.error
  };
}

export async function updateSubmissionStatus({
  kind,
  id,
  status,
  adminEmail,
  entityName
}: {
  kind: SubmissionKind;
  id: string;
  status: SubmissionStatus;
  adminEmail: string;
  entityName: string;
}) {
  const table = kind === "listing" ? "listing_submissions" : "buyer_request_applications";
  const update = await updateSupabaseRecord(table, `id=eq.${encodeURIComponent(id)}`, {
    status,
    updated_at: new Date().toISOString()
  });

  if (!update.error) {
    await logAdminActivity({
      adminEmail,
      actionType: statusAction[status],
      entityType: kind === "listing" ? "Listing Submission" : "Buyer Request Application",
      entityId: id,
      entityName
    });
  }

  return update;
}

export async function convertListingSubmission(submission: ListingSubmission, adminEmail: string) {
  const uniqueSlug = await generateUniqueSlug("marketplace_listings", `${submission.product_name}-${submission.seller_name}`);
  const ownerType = submission.seller_type === "Supplier" ? "Supplier" : "Farmer";
  const insert = await insertSupabaseRecord("marketplace_listings", {
    slug: uniqueSlug.slug,
    product_name: submission.product_name,
    category: submission.category,
    region: submission.region,
    district: submission.district,
    seller_name: submission.seller_name,
    seller_type: submission.seller_type,
    owner_type: ownerType,
    owner_id: null,
    owner_name: submission.seller_name,
    quantity: submission.quantity,
    unit: submission.unit,
    availability: "Available",
    image_url: submission.image_url,
    whatsapp_number: submission.whatsapp_number,
    status: "Active",
    verification_status: "Pending Verification",
    featured: false
  });

  if (!insert.error) {
    await updateSubmissionStatus({ kind: "listing", id: submission.id, status: "Converted", adminEmail, entityName: submission.product_name });
  }

  return insert;
}

export async function convertBuyerRequestSubmission(submission: BuyerRequestSubmission, adminEmail: string) {
  const insert = await insertSupabaseRecord("buyer_requests", {
    product_needed: submission.product_needed,
    quantity: submission.quantity,
    region: submission.region,
    district: submission.district,
    buyer_name: submission.buyer_name,
    buyer_type: submission.buyer_type,
    whatsapp_number: submission.whatsapp_number,
    deadline: submission.deadline,
    delivery_preference: submission.preferred_delivery,
    notes: submission.notes,
    status: "Open",
    verification_status: "Pending",
    verification_date: null,
    verified_by: null,
    verification_notes: null
  });

  if (!insert.error) {
    await updateSubmissionStatus({ kind: "buyer-request", id: submission.id, status: "Published", adminEmail, entityName: submission.product_needed });
  }

  return insert;
}
