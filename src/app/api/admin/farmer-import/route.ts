import { generateUniqueSlug, splitList } from "@/app/api/admin/records";
import { requireAdminUser } from "@/lib/adminAuth";
import { logAdminActivity } from "@/lib/adminActivity";
import { insertSupabaseRecord, selectSupabaseRecords, updateSupabaseRecord } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ExistingFarmer = {
  id: string;
  slug: string | null;
  farmer_name: string | null;
  farm_name: string;
  region: string;
  district: string;
  farm_type: string;
  products: string[] | null;
  farm_size: string | null;
  whatsapp_number: string | null;
  status: string | null;
  verification_status: string | null;
  source: string | null;
};

type ImportableFarmer = {
  farmer_name: string;
  farm_name: string;
  region: string;
  district: string;
  farm_type: string;
  products: string[];
  farm_size: string;
  whatsapp_number: string;
  status: "Pending Review";
  verification_status: "Pending";
  source: "Tally Import";
};

const headerAliases: Record<string, string[]> = {
  farmerName: ["farmer name", "full name", "name", "your name", "respondent name"],
  farmName: ["farm name", "business or farm name", "business name", "company name"],
  region: ["region", "farm region", "location region"],
  district: ["district", "farm district", "location district", "city", "town"],
  farmType: ["farm type", "type of farm", "farmer type"],
  products: ["products", "crops", "main crops", "products grown", "crops grown", "produce", "what do you grow"],
  farmSize: ["farm size", "farm size/acres", "acreage", "size of farm"],
  whatsappNumber: ["whatsapp", "whatsapp number", "phone", "phone number", "mobile number", "contact number"]
};

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }

      row.push(cell);
      if (row.some((value) => value.trim())) {
        rows.push(row);
      }
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell);
  if (row.some((value) => value.trim())) {
    rows.push(row);
  }

  return rows;
}

function normalizeHeader(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, " ").trim();
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D+/g, "");

  if (digits.startsWith("0") && digits.length === 10) {
    return `233${digits.slice(1)}`;
  }

  return digits;
}

function valueFromRow(row: Record<string, string>, key: keyof typeof headerAliases) {
  for (const alias of headerAliases[key]) {
    const value = row[alias];

    if (value?.trim()) {
      return value.trim();
    }
  }

  return "";
}

function rowToRecord(headers: string[], values: string[]) {
  return Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() ?? ""]));
}

function normalizeProducts(value: string) {
  return splitList(value.replace(/[;\n|/]+/g, ","));
}

function farmerSignature(farmer: Pick<ImportableFarmer, "farmer_name" | "farm_name" | "region" | "district" | "farm_type" | "farm_size" | "whatsapp_number"> & { products: string[] | null }) {
  return [
    farmer.farmer_name,
    farmer.farm_name,
    farmer.region,
    farmer.district,
    farmer.farm_type,
    (farmer.products ?? []).join(","),
    farmer.farm_size ?? "",
    normalizePhone(farmer.whatsapp_number)
  ]
    .join("|")
    .toLowerCase()
    .trim();
}

function mapTallyRow(row: Record<string, string>): ImportableFarmer {
  const farmerName = valueFromRow(row, "farmerName");
  const farmName = valueFromRow(row, "farmName") || (farmerName ? `${farmerName} Farm` : "");
  const products = normalizeProducts(valueFromRow(row, "products"));

  return {
    farmer_name: farmerName,
    farm_name: farmName,
    region: valueFromRow(row, "region") || "Ghana",
    district: valueFromRow(row, "district") || "Not provided",
    farm_type: valueFromRow(row, "farmType") || "Mixed",
    products,
    farm_size: valueFromRow(row, "farmSize") || "Not provided",
    whatsapp_number: normalizePhone(valueFromRow(row, "whatsappNumber")),
    status: "Pending Review",
    verification_status: "Pending",
    source: "Tally Import"
  };
}

function friendlyImportedFarmer(record: ExistingFarmer) {
  return {
    id: record.id,
    slug: record.slug ?? record.id,
    farmer_name: record.farmer_name ?? "",
    farm_name: record.farm_name,
    region: record.region,
    district: record.district,
    farm_type: record.farm_type,
    products: record.products ?? [],
    farm_size: record.farm_size ?? "",
    whatsapp_number: record.whatsapp_number ?? "",
    status: record.status ?? "Pending Review",
    verification_status: record.verification_status ?? "Pending",
    source: record.source ?? "Tally Import"
  };
}

export async function POST(request: Request) {
  const adminUser = await requireAdminUser(request);

  if (!adminUser) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("csv");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Upload a Tally CSV file." }, { status: 400 });
  }

  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "CSV file must be 2MB or smaller." }, { status: 400 });
  }

  const text = await file.text();
  const rows = parseCsv(text);
  const [rawHeaders, ...bodyRows] = rows;

  if (!rawHeaders || bodyRows.length === 0) {
    return NextResponse.json({ error: "CSV file does not contain farmer records." }, { status: 400 });
  }

  const headers = rawHeaders.map(normalizeHeader);
  const existing = await selectSupabaseRecords<ExistingFarmer>(
    "farmers",
    "select=id,slug,farmer_name,farm_name,region,district,farm_type,products,farm_size,whatsapp_number,status,verification_status,source&limit=5000"
  );

  if (existing.error) {
    return NextResponse.json({ error: "Could not read existing farmers before import." }, { status: existing.status });
  }

  const existingByPhone = new Map<string, ExistingFarmer[]>();
  for (const farmer of existing.data ?? []) {
    const phone = normalizePhone(farmer.whatsapp_number ?? "");

    if (!phone) {
      continue;
    }

    existingByPhone.set(phone, [...(existingByPhone.get(phone) ?? []), farmer]);
  }

  const seenPhones = new Map<string, ImportableFarmer>();
  const imported: ExistingFarmer[] = [];
  const duplicates: Array<{ row: number; phone: string; reason: string }> = [];
  const errors: Array<{ row: number; message: string }> = [];

  for (let index = 0; index < bodyRows.length; index += 1) {
    const values = bodyRows[index];
    const rowNumber = index + 2;
    const mapped = mapTallyRow(rowToRecord(headers, values));

    if (!mapped.farmer_name || !mapped.whatsapp_number) {
      errors.push({ row: rowNumber, message: "Farmer name and phone/WhatsApp number are required." });
      continue;
    }

    const existingSamePhone = existingByPhone.get(mapped.whatsapp_number) ?? [];
    const signature = farmerSignature(mapped);
    const exactExisting = existingSamePhone.some((farmer) => farmerSignature({
      farmer_name: farmer.farmer_name ?? "",
      farm_name: farmer.farm_name,
      region: farmer.region,
      district: farmer.district,
      farm_type: farmer.farm_type,
      products: farmer.products ?? [],
      farm_size: farmer.farm_size ?? "",
      whatsapp_number: farmer.whatsapp_number ?? ""
    }) === signature);

    if (exactExisting) {
      duplicates.push({ row: rowNumber, phone: mapped.whatsapp_number, reason: "Exact duplicate already exists." });
      continue;
    }

    const seenSamePhone = seenPhones.get(mapped.whatsapp_number);
    if (seenSamePhone) {
      if (farmerSignature(seenSamePhone) === signature) {
        duplicates.push({ row: rowNumber, phone: mapped.whatsapp_number, reason: "Exact duplicate in CSV." });
      } else {
        errors.push({ row: rowNumber, message: `Duplicate phone number ${mapped.whatsapp_number} needs manual review.` });
      }
      continue;
    }

    if (existingSamePhone.length > 0) {
      errors.push({ row: rowNumber, message: `Phone number ${mapped.whatsapp_number} already exists for another farmer.` });
      continue;
    }

    seenPhones.set(mapped.whatsapp_number, mapped);
    const uniqueSlug = await generateUniqueSlug("farmers", mapped.farm_name || mapped.farmer_name);

    if (uniqueSlug.error) {
      errors.push({ row: rowNumber, message: "Could not generate a unique farmer URL." });
      continue;
    }

    const insert = await insertSupabaseRecord("farmers", {
      ...mapped,
      slug: uniqueSlug.slug,
      verification_date: null,
      verified_by: null,
      verification_notes: null,
      profile_image_url: null,
      description: null
    });

    if (insert.error) {
      errors.push({ row: rowNumber, message: "Could not import this farmer. Check table schema and required fields." });
      continue;
    }

    const record = insert.data as ExistingFarmer | undefined;

    if (record) {
      imported.push(record);
      existingByPhone.set(mapped.whatsapp_number, [record]);
    }
  }

  for (const farmer of imported) {
    await logAdminActivity({
      adminEmail: adminUser.email,
      actionType: "Create",
      entityType: "Farmer",
      entityId: farmer.slug ?? farmer.id,
      entityName: farmer.farm_name
    });
  }

  return NextResponse.json({
    ok: true,
    report: {
      imported: imported.length,
      duplicates: duplicates.length,
      errors: errors.length,
      duplicateRows: duplicates,
      errorRows: errors
    },
    farmers: imported.map(friendlyImportedFarmer)
  });
}

export async function PATCH(request: Request) {
  const adminUser = await requireAdminUser(request);

  if (!adminUser) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { action?: "approve" | "verify" | "archive"; ids?: string[] };
  const ids = (body.ids ?? []).filter(Boolean);

  if (!body.action || !["approve", "verify", "archive"].includes(body.action) || ids.length === 0) {
    return NextResponse.json({ error: "Choose farmers and a valid bulk action." }, { status: 400 });
  }

  const filter = `id=in.(${ids.map(encodeURIComponent).join(",")})`;
  const today = new Date().toISOString().slice(0, 10);
  const payload =
    body.action === "archive"
      ? { status: "Archived" }
      : body.action === "verify"
        ? { status: "Active", verification_status: "Verified", verification_date: today, verified_by: adminUser.email }
        : { status: "Active", verification_status: "Pending", verification_date: null, verified_by: null };
  const update = await updateSupabaseRecord("farmers", filter, payload);

  if (update.error) {
    return NextResponse.json({ error: "Could not update imported farmers." }, { status: update.status });
  }

  await logAdminActivity({
    adminEmail: adminUser.email,
    actionType: body.action === "archive" ? "Archive" : body.action === "verify" ? "Verify" : "Approve",
    entityType: "Farmer",
    entityId: ids.join(","),
    entityName: `${ids.length} imported farmer${ids.length === 1 ? "" : "s"}`
  });

  return NextResponse.json({ ok: true, updated: ids.length });
}
