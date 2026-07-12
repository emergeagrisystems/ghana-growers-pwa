import { createRecord, generateUniqueSlug, uniqueSlugAdminMessage, updateRecord } from "@/app/api/admin/records";
import {
  canonicalMarketplaceTradeFields,
  reviewedCustomUnitMessage,
  validateMarketplaceTradeInput,
  type MarketplaceTradeDatabaseFields
} from "@/lib/marketplace/trade";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requiredFields = [
  "productName",
  "category",
  "region",
  "district",
  "sellerFarmer",
  "ownerType",
  "ownerName",
  "sellingMethod",
  "sellingUnit",
  "availability",
  "whatsappNumber"
];

function normalizeOwnerType(value: string | undefined) {
  return value === "Supplier" || value === "Admin" ? value : "Farmer";
}

function booleanValue(value: string | undefined) {
  return value === "true" || value === "on" || value === "1";
}

function tradeInput(payload: Record<string, string>) {
  return {
    sellingMethod: payload.sellingMethod as Parameters<typeof validateMarketplaceTradeInput>[0]["sellingMethod"],
    sellingUnit: payload.sellingUnit,
    customUnitLabel: payload.customUnitLabel,
    customUnitReviewed: booleanValue(payload.customUnitReviewed),
    unitSizeValue: payload.unitSizeValue,
    unitSizeMeasure: payload.unitSizeMeasure,
    unitSizeApproximate: booleanValue(payload.unitSizeApproximate),
    priceAmount: payload.priceAmount,
    priceCurrency: payload.priceCurrency,
    unitsAvailable: payload.unitsAvailable,
    totalQuantityValue: payload.totalQuantityValue,
    totalQuantityMeasure: payload.totalQuantityMeasure,
    minimumOrderValue: payload.minimumOrderValue,
    minimumOrderUnit: payload.minimumOrderUnit,
    supplyFrequency: payload.supplyFrequency
  };
}

function tradeValidationError(payload: Record<string, string>) {
  return validateMarketplaceTradeInput(tradeInput(payload)).find((message) => message !== reviewedCustomUnitMessage);
}

function normalizeImageUrls(value: unknown, coverImage?: string) {
  const rawImages = Array.isArray(value)
    ? value
    : typeof value === "string" && value.trim().startsWith("[")
      ? (() => {
          try {
            const parsed = JSON.parse(value) as unknown;
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })()
      : typeof value === "string"
        ? value.split(/\r?\n|,/)
        : [];

  const images = rawImages.filter((image): image is string => typeof image === "string").map((image) => image.trim()).filter(Boolean);
  const cover = coverImage?.trim();

  return Array.from(new Set([cover, ...images].filter((image): image is string => Boolean(image)))).slice(0, 10);
}

function legacyQuantityFields(tradeFields: MarketplaceTradeDatabaseFields, payload: Record<string, string>) {
  if (payload.quantity && payload.unit) {
    return { quantity: payload.quantity, unit: payload.unit };
  }

  if (tradeFields.selling_method === "weight" || tradeFields.selling_method === "volume") {
    return {
      quantity: tradeFields.total_quantity_value?.toString() || tradeFields.units_available?.toString() || "Confirm",
      unit: tradeFields.total_quantity_measure || tradeFields.selling_unit || "unit"
    };
  }

  return {
    quantity: tradeFields.units_available?.toString() || tradeFields.total_quantity_value?.toString() || "Confirm",
    unit: tradeFields.custom_unit_label || tradeFields.selling_unit || "unit"
  };
}

function listingPayload(payload: Record<string, string>, tradeFields: MarketplaceTradeDatabaseFields, imageUrls: string[], ownerType: string, ownerName: string) {
  const legacyQuantity = legacyQuantityFields(tradeFields, payload);

  return {
    product_name: payload.productName,
    category: payload.category,
    region: payload.region,
    district: payload.district,
    seller_name: payload.sellerFarmer || ownerName,
    seller_type: ownerType === "Admin" ? "Admin" : ownerType,
    owner_type: ownerType,
    owner_id: payload.ownerId || null,
    owner_name: ownerName,
    quantity: legacyQuantity.quantity,
    unit: legacyQuantity.unit,
    ...tradeFields,
    availability: payload.availability,
    supply_frequency: payload.supplyFrequency || null,
    available_from_date: payload.availableFromDate || null,
    grade_description: payload.gradeDescription || null,
    delivery_details: payload.deliveryDetails || null,
    record_source: payload.recordSource || null,
    price_range: payload.priceRange || null,
    description: payload.description || null,
    internal_operations_notes: payload.internalOperationsNotes || null,
    image_url: imageUrls[0] || null,
    image_urls: imageUrls.length ? imageUrls : null,
    whatsapp_number: payload.whatsappNumber
  };
}

export async function POST(request: Request) {
  return createRecord({
    request,
    table: "marketplace_listings",
    requiredFields,
    activity: {
      entityType: "Marketplace Listing",
      entityName: (payload) => payload.productName
    },
    mapPayload: async (payload) => {
      const ownerType = normalizeOwnerType(payload.ownerType);
      const ownerName = payload.ownerName || payload.sellerFarmer || "Ghana Growers";
      const slugSource = `${payload.productName}-${ownerName}`;
      const uniqueSlug = await generateUniqueSlug("marketplace_listings", slugSource);
      const imageUrls = normalizeImageUrls(payload.imageUrls, payload.imageUrl);
      const validationError = tradeValidationError(payload);
      const tradeFields = canonicalMarketplaceTradeFields(tradeInput(payload));

      return {
        slug: uniqueSlug.slug,
        __slugBaseValue: slugSource,
        __adminError: validationError || (uniqueSlug.error ? "Could not check whether this listing URL is available. Please try again." : undefined),
        __adminStatus: validationError ? 400 : uniqueSlug.status,
        __adminMessage: uniqueSlug.wasChanged ? uniqueSlugAdminMessage() : undefined,
        ...listingPayload(payload, tradeFields, imageUrls, ownerType, ownerName),
        record_source: payload.recordSource || "admin",
        status: "Active",
        verification_status: "Pending Verification",
        featured: false,
        is_featured: false,
        featured_until: null,
        featured_note: null
      };
    }
  });
}

export async function PATCH(request: Request) {
  return updateRecord({
    request,
    table: "marketplace_listings",
    filterColumn: "slug",
    requiredFields,
    activity: {
      entityType: "Marketplace Listing",
      entityName: (payload) => payload.productName
    },
    mapPayload: (payload) => {
      const ownerType = normalizeOwnerType(payload.ownerType);
      const ownerName = payload.ownerName || payload.sellerFarmer || "Ghana Growers";
      const imageUrls = normalizeImageUrls(payload.imageUrls, payload.imageUrl);
      const validationError = tradeValidationError(payload);
      const tradeFields = canonicalMarketplaceTradeFields(tradeInput(payload));

      return {
        __adminError: validationError,
        __adminStatus: validationError ? 400 : undefined,
        ...listingPayload(payload, tradeFields, imageUrls, ownerType, ownerName),
        status: "Active"
      };
    }
  });
}
