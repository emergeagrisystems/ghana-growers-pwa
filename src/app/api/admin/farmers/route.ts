import { createRecord, generateUniqueSlug, splitList, uniqueSlugAdminMessage, updateRecord } from "@/app/api/admin/records";
import { requireAdminUser } from "@/lib/adminAuth";
import { selectSupabaseRecords } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requiredFields = ["farmerName", "farmName", "region", "district", "farmType", "products", "farmSize", "whatsappNumber", "verificationStatus"];
const adminFarmerSelect =
  "select=id,slug,farmer_name,farm_name,region,district,farm_type,products,farm_size,phone_number,whatsapp_number,verification_status,status,source,is_featured,featured_until,featured_note,created_at&order=created_at.desc&limit=5000";
const adminFarmerBaseSelect =
  "select=id,slug,farmer_name,farm_name,region,district,farm_type,products,farm_size,phone_number,whatsapp_number,verification_status,status,source,created_at&order=created_at.desc&limit=5000";

type AdminFarmerRecord = {
  id: string;
  slug: string | null;
  farmer_name: string | null;
  farm_name: string | null;
  region: string | null;
  district: string | null;
  farm_type: string | null;
  products: string[] | null;
  farm_size: string | null;
  phone_number: string | null;
  whatsapp_number: string | null;
  verification_status: string | null;
  status: string | null;
  source: string | null;
  is_featured?: boolean | null;
  featured_until?: string | null;
  featured_note?: string | null;
  created_at?: string | null;
};

function farmerSlugSource(farmerName: string, farmName: string) {
  const cleanFarmerName = farmerName.trim();
  const cleanFarmName = farmName.trim();

  if (cleanFarmerName.split(/\s+/).filter(Boolean).length >= 2) {
    return cleanFarmerName;
  }

  return cleanFarmName || cleanFarmerName;
}

function normalizedFarmerSource(value?: string | null) {
  const source = value?.trim();

  if (!source) {
    return "Manual/Test";
  }

  if (/tally/i.test(source)) {
    return "Tally Import";
  }

  if (/founding/i.test(source)) {
    return "Founding Farmer";
  }

  return source;
}

function farmerDiagnostics(farmers: AdminFarmerRecord[]) {
  const sourceValues = Array.from(new Set(farmers.map((farmer) => farmer.source?.trim() || "(empty)"))).sort();

  return {
    totalSupabaseFarmers: farmers.length,
    tallyImportFarmers: farmers.filter((farmer) => normalizedFarmerSource(farmer.source) === "Tally Import").length,
    foundingFarmers: farmers.filter((farmer) => normalizedFarmerSource(farmer.source) === "Founding Farmer").length,
    manualTestFarmers: farmers.filter((farmer) => {
      const source = normalizedFarmerSource(farmer.source);
      return source !== "Tally Import" && source !== "Founding Farmer";
    }).length,
    activeFarmers: farmers.filter((farmer) => farmer.status === "Active").length,
    pendingReviewFarmers: farmers.filter((farmer) => farmer.status === "Pending Review").length,
    archivedFarmers: farmers.filter((farmer) => farmer.status === "Archived").length,
    sourceValues
  };
}

function adminFarmerRecord(record: AdminFarmerRecord) {
  return {
    ...record,
    source: normalizedFarmerSource(record.source)
  };
}

export async function GET(request: Request) {
  const adminUser = await requireAdminUser(request);

  if (!adminUser) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  let migrationWarning = "";
  let farmers = await selectSupabaseRecords<AdminFarmerRecord>("farmers", adminFarmerSelect);

  if (farmers.error && farmers.error.includes("is_featured")) {
    migrationWarning =
      "Featured Membership migration is missing on the farmers table. Run migration 018 to enable featured controls. Farmers are loaded without featured fields for now.";
    farmers = await selectSupabaseRecords<AdminFarmerRecord>("farmers", adminFarmerBaseSelect);
  }

  if (farmers.error) {
    return NextResponse.json(
      {
        error: farmers.error,
        farmers: [],
        diagnostics: {
          totalSupabaseFarmers: 0,
          tallyImportFarmers: 0,
          foundingFarmers: 0,
          manualTestFarmers: 0,
          activeFarmers: 0,
          pendingReviewFarmers: 0,
          archivedFarmers: 0,
          sourceValues: []
        }
      },
      { status: farmers.status }
    );
  }

  const records = farmers.data ?? [];

  return NextResponse.json({
    farmers: records.map(adminFarmerRecord),
    diagnostics: {
      ...farmerDiagnostics(records),
      migrationWarning
    }
  });
}

export async function POST(request: Request) {
  return createRecord({
    request,
    table: "farmers",
    requiredFields,
    activity: {
      entityType: "Farmer",
      entityName: (payload) => payload.farmName || payload.farmerName
    },
    mapPayload: async (payload) => {
      const slugSource = farmerSlugSource(payload.farmerName, payload.farmName);
      const uniqueSlug = await generateUniqueSlug("farmers", slugSource);

      return {
        slug: uniqueSlug.slug,
        __slugBaseValue: slugSource,
        __adminError: uniqueSlug.error ? "Could not check whether this farmer URL is available. Please try again." : undefined,
        __adminStatus: uniqueSlug.status,
        __adminMessage: uniqueSlug.wasChanged ? uniqueSlugAdminMessage() : undefined,
        farmer_name: payload.farmerName,
        farm_name: payload.farmName,
        region: payload.region,
        district: payload.district,
        farm_type: payload.farmType,
        products: splitList(payload.products),
        farm_size: payload.farmSize,
        whatsapp_number: payload.whatsappNumber,
        verification_status: payload.verificationStatus,
        verification_date: payload.verificationStatus === "Verified" ? new Date().toISOString().slice(0, 10) : null,
        verified_by: payload.verificationStatus === "Verified" ? "Ghana Growers Admin" : null,
        verification_notes: null,
        profile_image_url: payload.profileImageUrl || null,
        status: payload.verificationStatus === "Rejected" ? "Archived" : "Active"
      };
    }
  });
}

export async function PATCH(request: Request) {
  return updateRecord({
    request,
    table: "farmers",
    filterColumn: "slug",
    requiredFields,
    activity: {
      entityType: "Farmer",
      entityName: (payload) => payload.farmName || payload.farmerName
    },
    mapPayload: (payload) => ({
      farmer_name: payload.farmerName,
      farm_name: payload.farmName,
      region: payload.region,
      district: payload.district,
      farm_type: payload.farmType,
      products: splitList(payload.products),
      farm_size: payload.farmSize,
      whatsapp_number: payload.whatsappNumber,
      verification_status: payload.verificationStatus,
      verification_date: payload.verificationStatus === "Verified" ? new Date().toISOString().slice(0, 10) : null,
      verified_by: payload.verificationStatus === "Verified" ? "Ghana Growers Admin" : null,
      profile_image_url: payload.profileImageUrl || null,
      status: payload.verificationStatus === "Rejected" ? "Archived" : "Active"
    })
  });
}
