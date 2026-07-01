import { createRecord, generateUniqueSlug, uniqueSlugAdminMessage, updateRecord } from "@/app/api/admin/records";

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
  "quantity",
  "unit",
  "availability",
  "whatsappNumber"
];

function normalizeOwnerType(value: string | undefined) {
  return value === "Supplier" || value === "Admin" ? value : "Farmer";
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

      return {
        slug: uniqueSlug.slug,
        __slugBaseValue: slugSource,
        __adminError: uniqueSlug.error ? "Could not check whether this listing URL is available. Please try again." : undefined,
        __adminStatus: uniqueSlug.status,
        __adminMessage: uniqueSlug.wasChanged ? uniqueSlugAdminMessage() : undefined,
        product_name: payload.productName,
        category: payload.category,
        region: payload.region,
        district: payload.district,
        seller_name: payload.sellerFarmer || ownerName,
        seller_type: ownerType === "Admin" ? "Admin" : ownerType,
        owner_type: ownerType,
        owner_id: payload.ownerId || null,
        owner_name: ownerName,
        quantity: payload.quantity,
        unit: payload.unit,
        availability: payload.availability,
        price_range: payload.priceRange || null,
        description: payload.description || null,
        internal_operations_notes: payload.internalOperationsNotes || null,
        image_url: imageUrls[0] || null,
        image_urls: imageUrls.length ? imageUrls : null,
        whatsapp_number: payload.whatsappNumber,
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
        quantity: payload.quantity,
        unit: payload.unit,
        availability: payload.availability,
        price_range: payload.priceRange || null,
        description: payload.description || null,
        internal_operations_notes: payload.internalOperationsNotes || null,
        image_url: imageUrls[0] || null,
        image_urls: imageUrls.length ? imageUrls : null,
        whatsapp_number: payload.whatsappNumber,
        status: "Active"
      };
    }
  });
}
