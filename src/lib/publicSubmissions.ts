import { createHmac, randomUUID } from "node:crypto";
import { logAdminActivity, type AdminActionType } from "@/lib/adminActivity";
import { createGenericSourcingLeadRequest } from "@/lib/leadRequests";
import { canonicalMarketplaceTradeFields, reviewedCustomUnitMessage, validateMarketplaceTradeInput, type MarketplaceNumericInput } from "@/lib/marketplace/trade";
import {
  callSupabaseRpc,
  deleteSupabaseStorageObject,
  downloadSupabaseStorageObject,
  insertSupabaseRecord,
  selectSupabaseRecords,
  updateSupabaseRecord,
  uploadSupabaseStorageObject
} from "@/lib/supabase/admin";

export type SubmissionStatus = "New" | "Needs Information" | "Under Review" | "Approved" | "Published" | "Paused" | "Rejected" | "Expired" | "Converted";
export type SubmissionKind = "listing" | "buyer-request";

export type ListingSubmission = {
  id: string;
  submission_reference?: string | null;
  product_name: string;
  marketplace_pathway?: string | null;
  subcategory?: string | null;
  variety?: string | null;
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
  pickup_location?: string | null;
  delivery_available?: "Yes" | "No" | "To be confirmed" | null;
  additional_notes?: string | null;
  region: string;
  district: string;
  seller_name: string;
  seller_contact_name?: string | null;
  seller_type: "Farmer" | "Supplier";
  phone_number?: string | null;
  whatsapp_number: string;
  whatsapp_same_as_phone?: boolean | null;
  existing_member?: "Yes" | "No" | "Not sure" | null;
  description: string;
  image_url: string | null;
  image_urls?: string[] | null;
  main_image_path?: string | null;
  seller_match_status?: string | null;
  matched_farmer_id?: string | null;
  matched_supplier_id?: string | null;
  assigned_reviewer?: string | null;
  admin_notes?: string | null;
  seller_message?: string | null;
  status_history?: Array<Record<string, unknown>> | null;
  published_listing_id?: string | null;
  published_at?: string | null;
  published_by?: string | null;
  approved_at?: string | null;
  approved_by?: string | null;
  submission_dedupe_key?: string | null;
  source?: string | null;
  status: SubmissionStatus;
  created_at: string;
  updated_at: string;
};

type ProductSellingMethod = "packaged_unit" | "weight" | "count" | "livestock" | "volume";

const listingSellerCategoryOptions: Record<ListingSubmission["seller_type"], string[]> = {
  Farmer: ["Fresh Produce", "Livestock"],
  Supplier: ["Farm Inputs", "Tools & Equipment"]
};
const listingCategoriesWithRequiredSubcategory = ["Fresh Produce", "Farm Inputs", "Tools & Equipment"];

function listingCategoryMatchesSellerType(sellerType: ListingSubmission["seller_type"], category: string) {
  return listingSellerCategoryOptions[sellerType]?.includes(category) ?? false;
}

function listingCategoryRequiresSubcategory(category: string) {
  return listingCategoriesWithRequiredSubcategory.includes(category);
}

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
  "Needs Information": "Review",
  "Under Review": "Review",
  Approved: "Approve",
  Published: "Publish",
  Paused: "Review",
  Rejected: "Reject",
  Expired: "Review",
  Converted: "Convert"
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 500) : "";
}

function cleanLong(value: unknown, max = 1600) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cleanPhone(value: unknown) {
  return clean(value).replace(/[^\d+]/g, "").slice(0, 24);
}

function booleanValue(value: unknown) {
  return value === "true" || value === "on" || value === "1";
}

function referenceFromId(id?: string) {
  return id ? `LS-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}` : "LS-PENDING";
}

function statusHistoryEntry(status: SubmissionStatus, actor: string, note?: string) {
  return {
    status,
    actor,
    note: note || "",
    at: new Date().toISOString()
  };
}

type ListingSubmissionLifecycleRecord = Pick<ListingSubmission, "id" | "status" | "published_listing_id" | "status_history" | "product_name">;

export function marketplaceStatusForSubmissionStatus(status: SubmissionStatus) {
  return status === "Published" ? "Active" : "Archived";
}

function linkedMarketplaceListingFilter(submissionId: string, publishedListingId?: string | null) {
  return publishedListingId
    ? `or=(id.eq.${encodeURIComponent(publishedListingId)},source_submission_id.eq.${encodeURIComponent(submissionId)})`
    : `source_submission_id=eq.${encodeURIComponent(submissionId)}`;
}

async function findListingSubmissionLifecycleRecord(id: string) {
  const result = await selectSupabaseRecords<ListingSubmissionLifecycleRecord>(
    "listing_submissions",
    `select=id,status,published_listing_id,status_history,product_name&id=eq.${encodeURIComponent(id)}&limit=1`
  );

  if (result.error) {
    return { status: result.status, error: result.error };
  }

  return { status: result.status, data: result.data?.[0] };
}

export async function syncLinkedMarketplaceListingForSubmissionStatus({
  submissionId,
  publishedListingId,
  status
}: {
  submissionId: string;
  publishedListingId?: string | null;
  status: SubmissionStatus;
}) {
  return updateSupabaseRecord("marketplace_listings", linkedMarketplaceListingFilter(submissionId, publishedListingId), {
    status: marketplaceStatusForSubmissionStatus(status),
    updated_at: new Date().toISOString()
  });
}

async function reconcileLinkedMarketplaceListingsForSubmissions(submissions: ListingSubmission[]) {
  const submissionsWithLinkedListings = submissions.filter(
    (submission) => submission.published_listing_id || submission.status === "Published"
  );

  for (const submission of submissionsWithLinkedListings) {
    const sync = await syncLinkedMarketplaceListingForSubmissionStatus({
      submissionId: submission.id,
      publishedListingId: submission.published_listing_id,
      status: submission.status
    });

    if (sync.error) {
      return {
        status: sync.status,
        error: `Could not synchronize linked marketplace listing for submission ${submission.id}.`
      };
    }
  }

  return { status: 200 };
}

const listingSubmissionWindowSeconds = 10 * 60;
const maxListingSubmissionsPerWindow = 3;

type RateLimitResult = {
  allowed?: boolean;
  remaining?: number;
  reset_at?: string;
};

function submissionHmacSecret() {
  return process.env.LISTING_SUBMISSION_RATE_LIMIT_SECRET?.trim() || "";
}

function hmacDigest(parts: string[]) {
  const secret = submissionHmacSecret();

  if (!secret) {
    return "";
  }

  return createHmac("sha256", secret).update(parts.join("|")).digest("hex");
}

function hashedRequestFingerprint(clientKey: string) {
  return hmacDigest(["request-fingerprint", clientKey || "public"]);
}

function submissionRateLimitKey({
  phoneNumber,
  whatsappNumber,
  clientKey
}: {
  phoneNumber: string;
  whatsappNumber: string;
  clientKey: string;
}) {
  return hmacDigest([
    "listing-submission-rate-limit",
    phoneNumber || whatsappNumber || "unknown-contact",
    hashedRequestFingerprint(clientKey)
  ]);
}

function submissionDedupeKey(payload: {
  product_name: string;
  seller_name: string;
  phone_number: string;
  whatsapp_number: string;
  category: string;
  region: string;
  district: string;
}) {
  return hmacDigest([
    "listing-submission-dedupe",
    submissionSearchToken(payload.product_name),
    submissionSearchToken(payload.seller_name),
    payload.phone_number || payload.whatsapp_number || "unknown-contact",
    submissionSearchToken(payload.category),
    submissionSearchToken(payload.region),
    submissionSearchToken(payload.district)
  ]);
}

function retryMinutes(resetAt?: string) {
  const resetTime = resetAt ? new Date(resetAt).getTime() : Number.NaN;

  if (!Number.isFinite(resetTime)) {
    return 10;
  }

  return Math.max(1, Math.ceil((resetTime - Date.now()) / 60000));
}

async function consumeDurableSubmissionRateLimit(key: string) {
  const result = await callSupabaseRpc<RateLimitResult>("consume_listing_submission_rate_limit", {
    p_request_key: key,
    p_window_seconds: listingSubmissionWindowSeconds,
    p_max_attempts: maxListingSubmissionsPerWindow
  });

  if (result.error) {
    return {
      status: result.status,
      error: "Could not accept the listing right now. Please try again in a few minutes."
    };
  }

  const allowed = Boolean(result.data?.allowed);

  if (!allowed) {
    const minutes = retryMinutes(result.data?.reset_at);

    return {
      status: 429,
      error: `Please wait ${minutes} minute${minutes === 1 ? "" : "s"} before submitting another listing.`
    };
  }

  return { status: result.status };
}

function submissionSearchToken(...values: string[]) {
  return values.join(" ").toLowerCase().replace(/[^a-z0-9+]+/g, " ").replace(/\s+/g, " ").trim();
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

async function duplicateListingSubmissionWarning(payload: {
  product_name: string;
  seller_name: string;
  phone_number: string;
  whatsapp_number: string;
}) {
  const query =
    "select=id,product_name,seller_name,phone_number,whatsapp_number,status,created_at&order=created_at.desc&limit=100";
  const recent = await selectSupabaseRecords<ListingSubmission>("listing_submissions", query);

  if (recent.error) {
    return "";
  }

  const currentProduct = submissionSearchToken(payload.product_name);
  const currentSeller = submissionSearchToken(payload.seller_name);
  const currentContact = payload.phone_number || payload.whatsapp_number;
  const duplicate = recent.data?.find((submission) => {
    const productMatches = submissionSearchToken(submission.product_name) === currentProduct;
    const sellerMatches = submissionSearchToken(submission.seller_name) === currentSeller;
    const contactMatches = [submission.phone_number, submission.whatsapp_number].filter(Boolean).includes(currentContact);
    const stillOpen = !["Rejected", "Expired", "Published", "Converted"].includes(submission.status);

    return productMatches && sellerMatches && contactMatches && stillOpen;
  });

  return duplicate ? "This looks like a listing you already submitted. Ghana Growers will review the earlier submission first." : "";
}

function duplicateInsertError(message?: string) {
  return Boolean(message && /duplicate|unique|listing_submissions_dedupe_open_idx/i.test(message));
}

async function cleanupStoragePaths(bucket: string, paths: string[]) {
  const failures: string[] = [];

  for (const path of paths.filter(Boolean)) {
    const deleted = await deleteSupabaseStorageObject({ bucket, path });

    if (deleted.error) {
      failures.push(`${path}: ${deleted.error}`);
    }
  }

  return failures;
}

async function recordPublicationCleanup({
  submissionId,
  publicPaths,
  reason,
  lastError
}: {
  submissionId: string;
  publicPaths: string[];
  reason: string;
  lastError?: string;
}) {
  if (!publicPaths.length) {
    return "";
  }

  const insert = await insertSupabaseRecord("listing_submission_publication_cleanup_queue", {
    submission_id: submissionId,
    public_paths: publicPaths,
    reason,
    last_error: lastError || null,
    status: "Pending"
  });

  return insert.error || "";
}

async function uploadSubmissionImages(formData: FormData, productName: string) {
  const files = [formData.get("mainImage"), ...formData.getAll("additionalImages")]
    .filter((file): file is File => file instanceof File && file.size > 0)
    .slice(0, 5);

  if (!files.length) {
    return { status: 400, error: "Please upload at least one clear product photo." };
  }

  const imagePaths: string[] = [];
  const safeProduct = productName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "listing";

  for (let index = 0; index < files.length; index += 1) {
    const image = files[index];

    if (!["image/jpeg", "image/png", "image/webp"].includes(image.type)) {
      await cleanupStoragePaths("listing-submissions", imagePaths);
      return { status: 400, error: "Upload JPG, PNG, or WEBP images only." };
    }

    if (image.size > 5 * 1024 * 1024) {
      await cleanupStoragePaths("listing-submissions", imagePaths);
      return { status: 400, error: "Each image must be 5MB or smaller." };
    }

    const extension = image.type === "image/png" ? "png" : image.type === "image/webp" ? "webp" : "jpg";
    const upload = await uploadSupabaseStorageObject({
      bucket: "listing-submissions",
      path: `pending-submissions/${randomUUID()}-${safeProduct}-${index + 1}.${extension}`,
      contentType: image.type,
      body: await image.arrayBuffer(),
      publicUrl: false
    });

    if (upload.error || !upload.path) {
      await cleanupStoragePaths("listing-submissions", imagePaths);
      return { status: upload.status, error: "Could not upload product photos. Please try again." };
    }

    imagePaths.push(upload.path);
  }

  return { status: 200, imagePaths };
}

function contentTypeFromPath(path: string, fallback?: string) {
  const lower = path.toLowerCase();

  if (fallback?.startsWith("image/")) {
    return fallback;
  }

  if (lower.endsWith(".png")) {
    return "image/png";
  }

  if (lower.endsWith(".webp")) {
    return "image/webp";
  }

  return "image/jpeg";
}

function extensionFromContentType(contentType: string) {
  if (contentType.includes("png")) {
    return "png";
  }

  if (contentType.includes("webp")) {
    return "webp";
  }

  return "jpg";
}

async function copyApprovedSubmissionImages(submission: ListingSubmission) {
  const imagePaths = (submission.image_urls?.length ? submission.image_urls : submission.image_url ? [submission.image_url] : [])
    .filter((image): image is string => Boolean(image))
    .slice(0, 5);
  const copied: Array<{ path: string; publicUrl: string }> = [];
  const safeProduct = submission.product_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "listing";

  if (!imagePaths.length) {
    return { status: 400, error: "At least one approved product photo is required before publication." };
  }

  for (let index = 0; index < imagePaths.length; index += 1) {
    const imagePath = imagePaths[index];

    if (/^https?:\/\//i.test(imagePath)) {
      return {
        status: 400,
        error: "Submission photos must be approved from private review storage before publication."
      };
    }

    const download = await downloadSupabaseStorageObject({
      bucket: "listing-submissions",
      path: imagePath
    });

    if (download.error || !download.body) {
      const cleanupFailures = await cleanupStoragePaths("marketplace", copied.map((image) => image.path));

      if (cleanupFailures.length) {
        await recordPublicationCleanup({
          submissionId: submission.id,
          publicPaths: copied.map((image) => image.path),
          reason: "image-copy-download-failed",
          lastError: cleanupFailures.join("; ")
        });
      }

      return { status: download.status, error: "Could not prepare approved product photos for publication." };
    }

    const contentType = contentTypeFromPath(imagePath, download.contentType);
    const publicPath = `approved-submissions/${submission.id}/${index + 1}-${safeProduct}.${extensionFromContentType(contentType)}`;
    const upload = await uploadSupabaseStorageObject({
      bucket: "marketplace",
      path: publicPath,
      contentType,
      body: download.body,
      publicUrl: true
    });

    if (upload.error || !upload.publicUrl) {
      const cleanupFailures = await cleanupStoragePaths("marketplace", copied.map((image) => image.path));

      if (cleanupFailures.length) {
        await recordPublicationCleanup({
          submissionId: submission.id,
          publicPaths: copied.map((image) => image.path),
          reason: "image-copy-upload-failed",
          lastError: cleanupFailures.join("; ")
        });
      }

      return { status: upload.status, error: "Could not publish approved product photos. Please try again." };
    }

    copied.push({ path: publicPath, publicUrl: upload.publicUrl });
  }

  return {
    status: 200,
    imageUrls: copied.map((image) => image.publicUrl),
    publicPaths: copied.map((image) => image.path)
  };
}

export async function createListingSubmission(formData: FormData, clientKey = "public") {
  if (clean(formData.get("companyWebsite"))) {
    return { status: 400, error: "Submission could not be accepted." };
  }

  const phoneNumber = cleanPhone(formData.get("phoneNumber"));
  const whatsappSameAsPhone = booleanValue(formData.get("whatsappSameAsPhone"));
  const whatsappNumber = whatsappSameAsPhone ? phoneNumber : cleanPhone(formData.get("whatsappNumber"));
  const marketplacePathway = clean(formData.get("marketplacePathway"));
  const submittedSubcategory = clean(formData.get("subcategory"));
  const subcategory = submittedSubcategory.toLowerCase() === marketplacePathway.toLowerCase() ? "" : submittedSubcategory;

  const payload = {
    product_name: clean(formData.get("productName")),
    marketplace_pathway: marketplacePathway,
    subcategory,
    variety: clean(formData.get("variety")),
    category: subcategory || marketplacePathway,
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
    total_quantity_value: payloadTotalQuantityValue(formData),
    total_quantity_measure: clean(formData.get("totalQuantityMeasure")),
    minimum_order_value: clean(formData.get("minimumOrderValue")),
    minimum_order_unit: clean(formData.get("minimumOrderUnit")),
    availability: clean(formData.get("availability")),
    supply_frequency: clean(formData.get("supplyFrequency")),
    available_from_date: clean(formData.get("availableFromDate")),
    grade_description: clean(formData.get("gradeDescription")),
    delivery_details: clean(formData.get("deliveryDetails")),
    pickup_location: clean(formData.get("pickupLocation")),
    delivery_available: clean(formData.get("deliveryAvailable")) as "Yes" | "No" | "To be confirmed",
    additional_notes: cleanLong(formData.get("additionalNotes")),
    region: clean(formData.get("region")),
    district: clean(formData.get("district")),
    seller_name: clean(formData.get("sellerName")) || clean(formData.get("farmBusinessName")),
    seller_contact_name: clean(formData.get("contactPerson")),
    seller_type: clean(formData.get("sellerType")) as "Farmer" | "Supplier",
    phone_number: phoneNumber,
    whatsapp_number: whatsappNumber,
    whatsapp_same_as_phone: whatsappSameAsPhone,
    existing_member: clean(formData.get("existingMember")) as "Yes" | "No" | "Not sure",
    description: cleanLong(formData.get("description")),
    source: "public_submission"
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
  const required = ["product_name", "marketplace_pathway", "category", "selling_method", "selling_unit", "region", "district", "seller_name", "seller_type", "phone_number", "whatsapp_number", "description", "availability"];

  if (isSpam(payloadWithLegacy, required)) {
    return { status: 400, error: "Submission cannot be empty." };
  }

  const missing = required.find((field) => !payloadWithLegacy[field as keyof typeof payloadWithLegacy]);

  if (missing || !["Farmer", "Supplier"].includes(payload.seller_type)) {
    return { status: 400, error: "Please complete all required listing fields." };
  }

  if (!listingCategoryMatchesSellerType(payload.seller_type, payload.marketplace_pathway)) {
    return { status: 400, error: "Please select a category that matches your seller type." };
  }

  if (listingCategoryRequiresSubcategory(payload.marketplace_pathway) && !payload.subcategory) {
    return { status: 400, error: "Please select a subcategory to continue." };
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

  const rateLimitKey = submissionRateLimitKey({
    phoneNumber,
    whatsappNumber,
    clientKey
  });
  const dedupeKey = submissionDedupeKey({
    product_name: payloadWithLegacy.product_name,
    seller_name: payloadWithLegacy.seller_name,
    phone_number: phoneNumber,
    whatsapp_number: whatsappNumber,
    category: payloadWithLegacy.category,
    region: payloadWithLegacy.region,
    district: payloadWithLegacy.district
  });

  if (!rateLimitKey || !dedupeKey) {
    return {
      status: 503,
      error: "Listing submissions are temporarily unavailable. Please try again later."
    };
  }

  const duplicateWarning = await duplicateListingSubmissionWarning(payload);

  if (duplicateWarning) {
    return { status: 409, error: duplicateWarning };
  }

  const rateLimit = await consumeDurableSubmissionRateLimit(rateLimitKey);

  if (rateLimit.error) {
    return { status: rateLimit.status, error: rateLimit.error };
  }

  const images = await uploadSubmissionImages(formData, payload.product_name);

  if (images.error || !images.imagePaths?.length) {
    return { status: images.status, error: images.error || "Please upload at least one clear product photo." };
  }

  const submissionStatus: SubmissionStatus = "New";
  const insert = await insertSupabaseRecord("listing_submissions", {
    ...payloadWithLegacy,
    record_source: "public_submission",
    source: "public_submission",
    submission_dedupe_key: dedupeKey,
    image_url: images.imagePaths[0],
    main_image_path: images.imagePaths[0],
    image_urls: images.imagePaths,
    seller_match_status: "Pending review",
    status: submissionStatus,
    status_history: [statusHistoryEntry(submissionStatus, "public")]
  });

  if (!insert.error) {
    const insertedRecord = insert.data as { id?: string; submission_reference?: string | null } | undefined;
    await logAdminActivity({
      adminEmail: "public-submission@ghana-growers",
      actionType: "Create",
      entityType: "Listing Submission",
      entityId: insertedRecord?.id,
      entityName: payload.product_name
    });

    return {
      ...insert,
      reference: insertedRecord?.submission_reference || referenceFromId(insertedRecord?.id),
      message: "Your listing is not live yet. Ghana Growers will review the details and contact you if more information is needed."
    };
  }

  const cleanupFailures = await cleanupStoragePaths("listing-submissions", images.imagePaths);

  if (duplicateInsertError(insert.error)) {
    return {
      status: 409,
      error: "This looks like a listing you already submitted. Ghana Growers will review the earlier submission first."
    };
  }

  return cleanupFailures.length
    ? {
        status: insert.status,
        error: "Could not save your listing, and some uploaded photos may need manual cleanup. Please contact Ghana Growers if this continues."
      }
    : insert;
}

function payloadTotalQuantityValue(formData: FormData) {
  const sellingMethod = clean(formData.get("sellingMethod"));
  const unitSizeValue = Number(clean(formData.get("unitSizeValue")));
  const unitsAvailable = Number(clean(formData.get("unitsAvailable")));

  if (!["packaged_unit", "volume"].includes(sellingMethod)) {
    return clean(formData.get("totalQuantityValue"));
  }

  if (!Number.isFinite(unitSizeValue) || !Number.isFinite(unitsAvailable) || unitSizeValue <= 0 || unitsAvailable <= 0) {
    return "";
  }

  return String(unitSizeValue * unitsAvailable);
}

export async function createBuyerRequestSubmission(body: Record<string, unknown>, clientKey = "public") {
  return createGenericSourcingLeadRequest(body, clientKey);
}

export async function getPublicListingSubmissions() {
  const listingQuery =
    "select=*&order=created_at.desc&limit=500";
  const listings = await selectSupabaseRecords<ListingSubmission>("listing_submissions", listingQuery);

  if (listings.error) {
    console.warn("Admin listing submission queue read failed", {
      listingStatus: listings.status,
      listingError: listings.error
    });
  } else if (listings.data?.length) {
    const lifecycleSync = await reconcileLinkedMarketplaceListingsForSubmissions(listings.data);

    if (lifecycleSync.error) {
      console.warn("Admin listing submission lifecycle sync failed", {
        lifecycleStatus: lifecycleSync.status,
        lifecycleError: lifecycleSync.error
      });
    }
  }

  return {
    listings: listings.data ?? [],
    error: listings.error,
    status: listings.status
  };
}

export async function getPublicSubmissions() {
  const listings = await getPublicListingSubmissions();
  const error = listings.error;

  if (error) {
    console.warn("Admin submission queue read failed", {
      listingStatus: listings.status,
      listingError: listings.error
    });
  }

  return {
    listings: listings.listings,
    buyerRequests: [],
    error
  };
}

export async function updateSubmissionStatus({
  kind,
  id,
  status,
  adminEmail,
  entityName,
  adminNotes,
  sellerMessage,
  currentHistory = []
}: {
  kind: SubmissionKind;
  id: string;
  status: SubmissionStatus;
  adminEmail: string;
  entityName: string;
  adminNotes?: string;
  sellerMessage?: string;
  currentHistory?: Array<Record<string, unknown>> | null;
}) {
  if (kind === "buyer-request") {
    return {
      status: 410,
      error: "Buyer sourcing requests are now reviewed through Lead Requests."
    };
  }

  const table = "listing_submissions";
  const existingListingSubmission = kind === "listing" ? await findListingSubmissionLifecycleRecord(id) : undefined;

  if (existingListingSubmission?.error) {
    return {
      status: existingListingSubmission.status,
      error: "Could not load the listing submission before updating its status."
    };
  }

  const payload: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString()
  };

  if (kind === "listing") {
    payload.status_history = [...(currentHistory ?? []), statusHistoryEntry(status, adminEmail, adminNotes || sellerMessage)];
    payload.assigned_reviewer = adminEmail;

    if (adminNotes !== undefined) {
      payload.admin_notes = adminNotes;
    }

    if (sellerMessage !== undefined) {
      payload.seller_message = sellerMessage;
    }

    if (status === "Approved") {
      payload.approved_at = new Date().toISOString();
      payload.approved_by = adminEmail;
    }
  }

  if (kind === "listing" && status !== "Published" && existingListingSubmission?.data) {
    const linkedListingUpdate = await syncLinkedMarketplaceListingForSubmissionStatus({
      submissionId: id,
      publishedListingId: existingListingSubmission.data.published_listing_id,
      status
    });

    if (linkedListingUpdate.error) {
      return {
        status: linkedListingUpdate.status,
        error: "Could not update the linked marketplace listing status."
      };
    }
  }

  const update = await updateSupabaseRecord(table, `id=eq.${encodeURIComponent(id)}`, {
    ...payload
  });

  if (!update.error && kind === "listing" && status === "Published" && existingListingSubmission?.data) {
    const linkedListingUpdate = await syncLinkedMarketplaceListingForSubmissionStatus({
      submissionId: id,
      publishedListingId: existingListingSubmission.data.published_listing_id,
      status
    });

    if (linkedListingUpdate.error) {
      return {
        status: linkedListingUpdate.status,
        error: "Submission was marked Published, but the linked marketplace listing could not be reactivated."
      };
    }
  }

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
  if (submission.published_listing_id) {
    const reactivated = await updateSubmissionStatus({
      kind: "listing",
      id: submission.id,
      status: "Published",
      adminEmail,
      entityName: submission.product_name,
      adminNotes: submission.admin_notes ?? undefined,
      sellerMessage: submission.seller_message ?? undefined,
      currentHistory: submission.status_history
    });

    if (reactivated.error) {
      return {
        status: reactivated.status,
        error: "Could not reactivate the linked marketplace listing."
      };
    }

    return {
      status: 200,
      data: {
        listing_id: submission.published_listing_id,
        reused: true
      }
    };
  }

  if (["Published", "Converted"].includes(submission.status)) {
    return { status: 409, error: "This listing submission has already been published." };
  }

  const validationErrors = validateMarketplaceTradeInput({
    sellingMethod: submission.selling_method,
    sellingUnit: submission.selling_unit ?? "",
    customUnitLabel: submission.custom_unit_label ?? "",
    customUnitReviewed: submission.custom_unit_reviewed ?? false,
    unitSizeValue: submission.unit_size_value ?? "",
    unitSizeMeasure: submission.unit_size_measure ?? "",
    unitSizeApproximate: submission.unit_size_approximate ?? false,
    priceAmount: submission.price_amount ?? "",
    priceBasis: submission.price_basis ?? "",
    unitsAvailable: submission.units_available ?? "",
    totalQuantityValue: submission.total_quantity_value ?? "",
    totalQuantityMeasure: submission.total_quantity_measure ?? "",
    minimumOrderValue: submission.minimum_order_value ?? "",
    minimumOrderUnit: submission.minimum_order_unit ?? "",
    supplyFrequency: submission.supply_frequency ?? ""
  });

  if (validationErrors.length) {
    return { status: 400, error: validationErrors[0] };
  }

  const approvedImages = await copyApprovedSubmissionImages(submission);

  if (approvedImages.error) {
    return { status: approvedImages.status, error: approvedImages.error };
  }

  const rpc = await callSupabaseRpc<{ listing_id?: string; slug?: string; reused?: boolean }>("publish_listing_submission", {
    p_submission_id: submission.id,
    p_admin_email: adminEmail,
    p_public_image_urls: approvedImages.imageUrls ?? []
  });

  if (rpc.error) {
    const copiedPaths = approvedImages.publicPaths ?? [];
    const cleanupFailures = await cleanupStoragePaths("marketplace", copiedPaths);

    if (cleanupFailures.length) {
      const cleanupRecordError = await recordPublicationCleanup({
        submissionId: submission.id,
        publicPaths: copiedPaths,
        reason: "publication-rpc-failed",
        lastError: cleanupFailures.join("; ")
      });

      return {
        status: rpc.status,
        error: `Could not publish the listing. Copied images may need manual cleanup.${cleanupRecordError ? " Cleanup tracking also failed." : ""}`
      };
    }

    return { status: rpc.status, error: "Could not publish the listing. No marketplace listing was created." };
  }

  if (rpc.data?.listing_id) {
    const linkedListingUpdate = await syncLinkedMarketplaceListingForSubmissionStatus({
      submissionId: submission.id,
      publishedListingId: rpc.data.listing_id,
      status: "Published"
    });

    if (linkedListingUpdate.error) {
      return {
        status: linkedListingUpdate.status,
        error: "The listing was published, but the marketplace status could not be confirmed as Active."
      };
    }
  }

  await logAdminActivity({
    adminEmail,
    actionType: "Publish",
    entityType: "Listing Submission",
    entityId: submission.id,
    entityName: submission.product_name
  });

  return rpc;
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
