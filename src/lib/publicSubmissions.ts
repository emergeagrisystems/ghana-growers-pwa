import { generateUniqueSlug } from "@/app/api/admin/records";
import { logAdminActivity, type AdminActionType, type AdminEntityType } from "@/lib/adminActivity";
import { canonicalMarketplaceTradeFields, reviewedCustomUnitMessage, validateMarketplaceTradeInput, type MarketplaceNumericInput } from "@/lib/marketplace/trade";
import { insertSupabaseRecord, selectSupabaseRecords, updateSupabaseRecord, uploadSupabaseStorageObject } from "@/lib/supabase/admin";

export type SubmissionStatus = "New" | "Under Review" | "Approved" | "Rejected" | "Converted" | "Published";
export type SubmissionKind = "listing" | "buyer-request";

export type ListingSubmission = {
  id: string;
  product_name: string;
  category: string;
  quantity: string;
  unit: string;
  selling_method?: ProductSellingMethod;
  selling_unit?: string | null;
  custom_unit_label?: string | null;
  custom_unit_reviewed?: boolean | null;
  unit_size_value?: MarketplaceNumericInput;
  unit_size_measure?: string | null;
  unit_size_approximate?: boolean | null;
  price_amount?: MarketplaceNumericInput;
  price_currency?: string | null;
  price_basis?: string | null;
  units_available?: MarketplaceNumericInput;
  total_quantity_value?: MarketplaceNumericInput;
  total_quantity_measure?: string | null;
  minimum_order_value?: MarketplaceNumericInput;
  minimum_order_unit?: string | null;
  availability?: string | null;
  supply_frequency?: string | null;
  available_from_date?: string | null;
  grade_description?: string | null;
  delivery_details?: string | null;
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

type ProductSellingMethod = "packaged_unit" | "weight" | "count" | "livestock" | "volume";

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

function isSpam(payload: Record<string, unknown>, fields: string[]) {
  return fields.every((field) => !payload[field]);
}

function legacyQuantityFromStructured(payload: {
  selling_method: string;
  selling_unit: string;
  units_available: MarketplaceNumericInput;
  total_quantity_value: MarketplaceNumericInput;
  total_quantity_measure: string;
}) {
  if (payload.selling_method === "weight" || payload.selling_method === "volume") {
    return {
      quantity: payload.total_quantity_value || payload.units_available || "Confirm",
      unit: payload.total_quantity_measure || payload.selling_unit || "unit"
    };
  }

  return {
    quantity: payload.units_available || payload.total_quantity_value || "Confirm",
    unit: payload.selling_unit || "unit"
  };
}

export async function createListingSubmission(formData: FormData) {
  if (clean(formData.get("companyWebsite"))) {
    return { status: 400, error: "Submission could not be accepted." };
  }

  const payload = {
    product_name: clean(formData.get("productName")),
    category: clean(formData.get("category")),
    selling_method: clean(formData.get("sellingMethod")) as ProductSellingMethod,
    selling_unit: clean(formData.get("sellingUnit")),
    custom_unit_label: clean(formData.get("customUnitLabel")),
    custom_unit_reviewed: false,
    unit_size_value: clean(formData.get("unitSizeValue")),
    unit_size_measure: clean(formData.get("unitSizeMeasure")),
    unit_size_approximate: formData.get("unitSizeApproximate") === "on",
    price_amount: clean(formData.get("priceAmount")),
    price_currency: clean(formData.get("priceCurrency")) || "GHS",
    price_basis: clean(formData.get("priceBasis")),
    units_available: clean(formData.get("unitsAvailable")),
    total_quantity_value: clean(formData.get("totalQuantityValue")),
    total_quantity_measure: clean(formData.get("totalQuantityMeasure")),
    minimum_order_value: clean(formData.get("minimumOrderValue")),
    minimum_order_unit: clean(formData.get("minimumOrderUnit")),
    availability: clean(formData.get("availability")),
    supply_frequency: clean(formData.get("supplyFrequency")),
    available_from_date: clean(formData.get("availableFromDate")),
    grade_description: clean(formData.get("gradeDescription")),
    delivery_details: clean(formData.get("deliveryDetails")),
    region: clean(formData.get("region")),
    district: clean(formData.get("district")),
    seller_name: clean(formData.get("sellerName")),
    seller_type: clean(formData.get("sellerType")) as "Farmer" | "Supplier",
    whatsapp_number: clean(formData.get("whatsappNumber")),
    description: clean(formData.get("description"))
  };
  const tradeFields = canonicalMarketplaceTradeFields({
    sellingMethod: payload.selling_method,
    sellingUnit: payload.selling_unit,
    customUnitLabel: payload.custom_unit_label,
    customUnitReviewed: payload.custom_unit_reviewed,
    unitSizeValue: payload.unit_size_value,
    unitSizeMeasure: payload.unit_size_measure,
    unitSizeApproximate: payload.unit_size_approximate,
    priceAmount: payload.price_amount,
    priceCurrency: payload.price_currency,
    unitsAvailable: payload.units_available,
    totalQuantityValue: payload.total_quantity_value,
    totalQuantityMeasure: payload.total_quantity_measure,
    minimumOrderValue: payload.minimum_order_value,
    minimumOrderUnit: payload.minimum_order_unit,
    supplyFrequency: payload.supply_frequency
  });
  const legacyQuantity = legacyQuantityFromStructured({
    selling_method: tradeFields.selling_method ?? payload.selling_method,
    selling_unit: tradeFields.selling_unit ?? payload.selling_unit,
    units_available: tradeFields.units_available ?? "",
    total_quantity_value: tradeFields.total_quantity_value ?? "",
    total_quantity_measure: tradeFields.total_quantity_measure ?? ""
  });
  const payloadWithLegacy = { ...payload, ...tradeFields, ...legacyQuantity };
  const required = ["product_name", "category", "selling_method", "selling_unit", "region", "district", "seller_name", "seller_type", "whatsapp_number", "description"];

  if (isSpam(payloadWithLegacy, required)) {
    return { status: 400, error: "Submission cannot be empty." };
  }

  const missing = required.find((field) => !payloadWithLegacy[field as keyof typeof payloadWithLegacy]);

  if (missing || !["Farmer", "Supplier"].includes(payload.seller_type)) {
    return { status: 400, error: "Please complete all required listing fields." };
  }

  const validationErrors = validateMarketplaceTradeInput({
    sellingMethod: payload.selling_method,
    sellingUnit: payload.selling_unit,
    customUnitLabel: payload.custom_unit_label,
    customUnitReviewed: payload.custom_unit_reviewed,
    unitSizeValue: payload.unit_size_value,
    unitSizeMeasure: payload.unit_size_measure,
    unitSizeApproximate: payload.unit_size_approximate,
    priceAmount: payload.price_amount,
    priceBasis: payload.price_basis,
    unitsAvailable: payload.units_available,
    totalQuantityValue: payload.total_quantity_value,
    totalQuantityMeasure: payload.total_quantity_measure,
    minimumOrderValue: payload.minimum_order_value,
    minimumOrderUnit: payload.minimum_order_unit,
    supplyFrequency: payload.supply_frequency
  }).filter((message) => message !== reviewedCustomUnitMessage);

  if (validationErrors.length) {
    return { status: 400, error: validationErrors[0] };
  }

  const submissionStatus: SubmissionStatus = payload.selling_unit.toLowerCase() === "other" ? "Under Review" : "New";

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
    ...payloadWithLegacy,
    record_source: "public_submission",
    image_url: imageUrl,
    status: submissionStatus
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
    "select=id,product_name,category,quantity,unit,selling_method,selling_unit,custom_unit_label,custom_unit_reviewed,unit_size_value,unit_size_measure,unit_size_approximate,price_amount,price_currency,price_basis,units_available,total_quantity_value,total_quantity_measure,minimum_order_value,minimum_order_unit,availability,supply_frequency,available_from_date,grade_description,delivery_details,region,district,seller_name,seller_type,whatsapp_number,description,image_url,status,created_at,updated_at&order=created_at.desc&limit=500";
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
    selling_method: submission.selling_method,
    selling_unit: submission.selling_unit,
    custom_unit_label: submission.custom_unit_label,
    custom_unit_reviewed: submission.custom_unit_reviewed ?? false,
    unit_size_value: submission.unit_size_value,
    unit_size_measure: submission.unit_size_measure,
    unit_size_approximate: submission.unit_size_approximate ?? false,
    price_amount: submission.price_amount,
    price_currency: submission.price_currency,
    price_basis: submission.price_basis,
    units_available: submission.units_available,
    total_quantity_value: submission.total_quantity_value,
    total_quantity_measure: submission.total_quantity_measure,
    minimum_order_value: submission.minimum_order_value,
    minimum_order_unit: submission.minimum_order_unit,
    availability: submission.availability || "Available",
    supply_frequency: submission.supply_frequency,
    available_from_date: submission.available_from_date,
    grade_description: submission.grade_description,
    delivery_details: submission.delivery_details,
    record_source: "public_submission",
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
