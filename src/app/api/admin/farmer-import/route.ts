import { generateUniqueSlug, splitList } from "@/app/api/admin/records";
import { requireAdminUser } from "@/lib/adminAuth";
import { logAdminActivity } from "@/lib/adminActivity";
import { insertSupabaseRecord, selectSupabaseRecords, updateSupabaseRecord, uploadSupabaseStorageObject } from "@/lib/supabase/admin";
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
  phone_number?: string | null;
  whatsapp_number: string | null;
  email?: string | null;
  farm_location?: string | null;
  farming_experience?: string | null;
  currently_harvesting?: string | null;
  supply_frequency?: string | null;
  delivery_preference?: string | null;
  payment_preference?: string | null;
  workshop_interest?: string | null;
  referral_source?: string | null;
  tally_photo_url?: string | null;
  imported_photo_url?: string | null;
  original_tally_data?: Record<string, string> | null;
  status: string | null;
  verification_status: string | null;
  verification_date?: string | null;
  verified_by?: string | null;
  verification_notes?: string | null;
  profile_image_url?: string | null;
  description?: string | null;
  created_at?: string | null;
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
  phone_number: string;
  whatsapp_number: string;
  email: string;
  farm_location: string;
  farming_experience: string;
  currently_harvesting: string;
  supply_frequency: string;
  delivery_preference: string;
  payment_preference: string;
  workshop_interest: string;
  referral_source: string;
  tally_photo_url: string;
  imported_photo_url?: string;
  original_tally_data: Record<string, string>;
  status: "Pending Review";
  verification_status: "Pending";
  source: "Tally Import";
};

const fieldLabels = {
  farmerName: "Farmer Name",
  farmName: "Farm Name",
  region: "Region",
  district: "District",
  farmType: "Farm Type",
  products: "Products",
  farmSize: "Farm Size",
  phoneNumber: "Phone Number",
  whatsappNumber: "WhatsApp Number",
  email: "Email",
  farmLocation: "Farm Location",
  farmingExperience: "Farming Experience",
  currentlyHarvesting: "Currently Harvesting",
  supplyFrequency: "Supply Frequency",
  deliveryPreference: "Delivery Preference",
  paymentPreference: "Payment Preference",
  workshopInterest: "Workshop/Event Interest",
  referralSource: "How They Heard About Ghana Growers",
  tallyPhotoUrl: "Tally Photo"
} as const;
type ImportFieldKey = keyof typeof fieldLabels;

const requiredImportFields: ImportFieldKey[] = ["farmerName"];
const farmerReviewSelect =
  "select=id,slug,farmer_name,farm_name,region,district,farm_type,products,farm_size,phone_number,whatsapp_number,email,farm_location,farming_experience,currently_harvesting,supply_frequency,delivery_preference,payment_preference,workshop_interest,referral_source,tally_photo_url,imported_photo_url,original_tally_data,status,verification_status,verification_date,verified_by,verification_notes,profile_image_url,description,created_at,source";

const headerAliases: Record<ImportFieldKey, string[]> = {
  farmerName: [
    "farmer name",
    "full name",
    "full names",
    "name",
    "your name",
    "respondent name",
    "what is your full name",
    "what s your full name",
    "please enter your full name",
    "applicant name",
    "contact name"
  ],
  farmName: [
    "farm name",
    "business or farm name",
    "business farm name",
    "business name",
    "company name",
    "name of farm",
    "what is the name of your farm",
    "what s the name of your farm"
  ],
  region: ["region", "farm region", "location region", "which region", "region in ghana", "where is your farm located region"],
  district: ["district", "farm district", "location district", "city", "town", "community", "municipality", "where is your farm located district"],
  farmType: ["farm type", "type of farm", "farmer type", "what type of farming", "type of farming", "farming type"],
  products: [
    "products",
    "crops",
    "main crops",
    "products grown",
    "crops grown",
    "produce",
    "what do you grow",
    "what crops do you grow",
    "what products do you produce",
    "main products",
    "farm produce"
  ],
  farmSize: ["farm size", "farm size acres", "acreage", "size of farm", "how large is your farm", "number of acres"],
  phoneNumber: [
    "phone",
    "phone number",
    "mobile number",
    "contact number",
    "telephone",
    "tel",
    "contact",
    "your phone number",
    "mobile"
  ],
  whatsappNumber: [
    "whatsapp",
    "whatsapp number",
    "your whatsapp number",
    "phone whatsapp",
    "whatsapp phone number"
  ],
  email: ["email", "email address", "e mail", "your email", "mail"],
  farmLocation: ["farm location", "location", "community", "town village", "where is your farm", "farm address", "gps address"],
  farmingExperience: ["farming experience", "years farming", "years of farming", "how long have you been farming", "experience"],
  currentlyHarvesting: ["currently harvesting", "harvesting now", "what are you currently harvesting", "current harvest", "available now"],
  supplyFrequency: ["supply frequency", "how often can you supply", "frequency", "supply capacity", "available frequency"],
  deliveryPreference: ["delivery preference", "collection point", "delivery", "pickup", "collection point delivery", "delivery pickup"],
  paymentPreference: ["payment preference", "preferred payment", "payment method", "how do you prefer to be paid"],
  workshopInterest: ["workshop", "event interest", "training interest", "interested in workshop", "interested in events"],
  referralSource: ["how did you hear", "heard about", "referral", "source", "how did you hear about ghana growers"],
  tallyPhotoUrl: ["photo", "upload photo", "farmer photo", "farm photo", "image", "picture", "file upload"]
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

function firstUrlFromText(value?: string | null) {
  const match = value?.match(/https?:\/\/[^\s"',\])}]+/i);
  return match?.[0]?.trim() ?? "";
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function resolveFieldIndex(headers: string[], key: ImportFieldKey) {
  const aliases = headerAliases[key].map(normalizeHeader);
  const exactIndex = headers.findIndex((header) => aliases.includes(header));

  if (exactIndex !== -1) {
    return exactIndex;
  }

  const containsIndex = headers.findIndex((header) =>
    aliases.some((alias) => header.includes(alias) || alias.includes(header))
  );

  if (containsIndex !== -1) {
    return containsIndex;
  }

  if (key === "farmerName") {
    return headers.findIndex((header) => header.includes("name") && !header.includes("farm") && !header.includes("business"));
  }

  if (key === "whatsappNumber") {
    return headers.findIndex((header) => header.includes("phone") || header.includes("whatsapp") || header.includes("mobile") || header.includes("contact"));
  }

  if (key === "phoneNumber") {
    return headers.findIndex((header) => header.includes("phone") || header.includes("mobile") || header.includes("contact") || header.includes("tel"));
  }

  if (key === "products") {
    return headers.findIndex((header) => header.includes("crop") || header.includes("product") || header.includes("produce"));
  }

  return -1;
}

function csvHeaderInfo(rawHeaders: string[]) {
  const normalizedHeaders = rawHeaders.map(normalizeHeader);
  const mappings = Object.fromEntries(
    (Object.keys(headerAliases) as ImportFieldKey[]).map((key) => {
      const index = resolveFieldIndex(normalizedHeaders, key);

      return [
        key,
        index === -1
          ? null
          : {
              index,
              label: fieldLabels[key],
              detectedHeader: rawHeaders[index],
              normalizedHeader: normalizedHeaders[index]
            }
      ];
    })
  ) as Record<ImportFieldKey, { index: number; label: string; detectedHeader: string; normalizedHeader: string } | null>;
  const missingRequiredFields: string[] = requiredImportFields
    .filter((key) => !mappings[key])
    .map((key) => fieldLabels[key]);

  if (!mappings.phoneNumber && !mappings.whatsappNumber) {
    missingRequiredFields.push("Phone Number or WhatsApp Number");
  }

  return {
    rawHeaders,
    normalizedHeaders,
    mappings,
    missingRequiredFields
  };
}

function valueFromRow(values: string[], headerInfo: ReturnType<typeof csvHeaderInfo>, key: ImportFieldKey) {
  const mapping = headerInfo.mappings[key];

  if (!mapping) {
    return "";
  }

  return values[mapping.index]?.trim() ?? "";
}

function rowToPreview(values: string[], headerInfo: ReturnType<typeof csvHeaderInfo>) {
  const mapped = mapTallyRow(values, headerInfo);

  return {
    farmerName: mapped.farmer_name,
    farmName: mapped.farm_name,
    phone: mapped.whatsapp_number,
    location: [mapped.district, mapped.region].filter((value) => value && value !== "Not provided" && value !== "Ghana").join(", ") || mapped.region,
    products: mapped.products.join(", ")
  };
}

function firstMissingRequiredValue(values: string[], headerInfo: ReturnType<typeof csvHeaderInfo>) {
  for (const key of requiredImportFields) {
    const value = valueFromRow(values, headerInfo, key);

    if (!value.trim()) {
      return fieldLabels[key];
    }
  }

  const phone = valueFromRow(values, headerInfo, "phoneNumber");
  const whatsapp = valueFromRow(values, headerInfo, "whatsappNumber");

  if (!phone.trim() && !whatsapp.trim()) {
    return "Phone Number or WhatsApp Number";
  }

  return null;
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

function mapTallyRow(values: string[], headerInfo: ReturnType<typeof csvHeaderInfo>): ImportableFarmer {
  const farmerName = valueFromRow(values, headerInfo, "farmerName");
  const farmName = valueFromRow(values, headerInfo, "farmName") || (farmerName ? `${farmerName} Farm` : "");
  const products = normalizeProducts(valueFromRow(values, headerInfo, "products"));
  const phoneNumber = normalizePhone(valueFromRow(values, headerInfo, "phoneNumber"));
  const whatsappNumber = normalizePhone(valueFromRow(values, headerInfo, "whatsappNumber")) || phoneNumber;

  return {
    farmer_name: farmerName,
    farm_name: farmName,
    region: valueFromRow(values, headerInfo, "region") || "Ghana",
    district: valueFromRow(values, headerInfo, "district") || "Not provided",
    farm_type: valueFromRow(values, headerInfo, "farmType") || "Mixed",
    products,
    farm_size: valueFromRow(values, headerInfo, "farmSize") || "Not provided",
    phone_number: phoneNumber || whatsappNumber,
    whatsapp_number: whatsappNumber,
    email: valueFromRow(values, headerInfo, "email"),
    farm_location: valueFromRow(values, headerInfo, "farmLocation"),
    farming_experience: valueFromRow(values, headerInfo, "farmingExperience"),
    currently_harvesting: valueFromRow(values, headerInfo, "currentlyHarvesting"),
    supply_frequency: valueFromRow(values, headerInfo, "supplyFrequency"),
    delivery_preference: valueFromRow(values, headerInfo, "deliveryPreference"),
    payment_preference: valueFromRow(values, headerInfo, "paymentPreference"),
    workshop_interest: valueFromRow(values, headerInfo, "workshopInterest"),
    referral_source: valueFromRow(values, headerInfo, "referralSource"),
    tally_photo_url: firstUrlFromText(valueFromRow(values, headerInfo, "tallyPhotoUrl")),
    original_tally_data: Object.fromEntries(headerInfo.rawHeaders.map((header, index) => [header, values[index]?.trim() ?? ""])),
    status: "Pending Review",
    verification_status: "Pending",
    source: "Tally Import"
  };
}

function publicTallyPhotoCandidate(url: string) {
  if (!url.trim()) {
    return "";
  }

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.toLowerCase();

    if (host === "storage.tally.so" && path.includes("/private/")) {
      return "";
    }

    return parsed.protocol === "https:" || parsed.protocol === "http:" ? url : "";
  } catch {
    return "";
  }
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

function safeStorageName(value: string) {
  return value
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90) || "tally-farmer-photo";
}

async function importTallyPhoto(mapped: ImportableFarmer) {
  const photoUrl = firstUrlFromText(mapped.tally_photo_url) || firstUrlFromText(Object.values(mapped.original_tally_data).join(" "));

  if (!photoUrl) {
    return "";
  }

  const response = await fetch(photoUrl, {
    cache: "no-store"
  }).catch(() => null);

  if (!response?.ok) {
    return "";
  }

  const contentType = response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() ?? "";

  if (!["image/jpeg", "image/png", "image/webp"].includes(contentType)) {
    return "";
  }

  const body = await response.arrayBuffer().catch(() => null);

  if (!body || body.byteLength === 0 || body.byteLength > 5 * 1024 * 1024) {
    return "";
  }

  const extension = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  const path = `tally-import/${new Date().toISOString().slice(0, 10)}/${Date.now()}-${safeStorageName(mapped.farm_name || mapped.farmer_name)}.${extension}`;
  const upload = await uploadSupabaseStorageObject({
    bucket: "farmers",
    path,
    contentType,
    body
  });

  return upload.publicUrl ?? "";
}

async function tallyDetailPayload(mapped: ImportableFarmer) {
  const importedPhotoUrl = await importTallyPhoto(mapped);
  const publicTallyPhotoUrl = publicTallyPhotoCandidate(mapped.tally_photo_url);

  return {
    ...mapped,
    imported_photo_url: importedPhotoUrl || null,
    ...(importedPhotoUrl || publicTallyPhotoUrl ? { profile_image_url: importedPhotoUrl || publicTallyPhotoUrl } : {}),
    description: null
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
    phone_number: record.phone_number ?? record.whatsapp_number ?? "",
    whatsapp_number: record.whatsapp_number ?? "",
    email: record.email ?? "",
    farm_location: record.farm_location ?? "",
    farming_experience: record.farming_experience ?? "",
    currently_harvesting: record.currently_harvesting ?? "",
    supply_frequency: record.supply_frequency ?? "",
    delivery_preference: record.delivery_preference ?? "",
    payment_preference: record.payment_preference ?? "",
    workshop_interest: record.workshop_interest ?? "",
    referral_source: record.referral_source ?? "",
    tally_photo_url: record.tally_photo_url ?? "",
    imported_photo_url: record.imported_photo_url ?? "",
    original_tally_data: record.original_tally_data ?? {},
    status: record.status ?? "Pending Review",
    verification_status: record.verification_status ?? "Pending",
    verification_date: record.verification_date ?? null,
    verified_by: record.verified_by ?? null,
    verification_notes: record.verification_notes ?? "",
    profile_image_url: record.profile_image_url ?? null,
    description: record.description ?? "",
    created_at: record.created_at ?? null,
    source: normalizedFarmerSource(record.source)
  };
}

async function importExistingFarmerPhoto(record: ExistingFarmer) {
  const mapped: ImportableFarmer = {
    farmer_name: record.farmer_name ?? record.farm_name,
    farm_name: record.farm_name,
    region: record.region,
    district: record.district,
    farm_type: record.farm_type,
    products: record.products ?? [],
    farm_size: record.farm_size ?? "",
    phone_number: record.phone_number ?? record.whatsapp_number ?? "",
    whatsapp_number: record.whatsapp_number ?? "",
    email: record.email ?? "",
    farm_location: record.farm_location ?? "",
    farming_experience: record.farming_experience ?? "",
    currently_harvesting: record.currently_harvesting ?? "",
    supply_frequency: record.supply_frequency ?? "",
    delivery_preference: record.delivery_preference ?? "",
    payment_preference: record.payment_preference ?? "",
    workshop_interest: record.workshop_interest ?? "",
    referral_source: record.referral_source ?? "",
    tally_photo_url: firstUrlFromText(record.tally_photo_url) || firstUrlFromText(Object.values(record.original_tally_data ?? {}).join(" ")),
    original_tally_data: record.original_tally_data ?? {},
    status: "Pending Review",
    verification_status: "Pending",
    source: "Tally Import"
  };

  return importTallyPhoto(mapped);
}

async function getImportedFarmerById(id: string) {
  const filter = isUuid(id) ? `id=eq.${encodeURIComponent(id)}` : `slug=eq.${encodeURIComponent(id)}`;
  const farmers = await selectSupabaseRecords<ExistingFarmer>(
    "farmers",
    `${farmerReviewSelect}&${filter}&limit=1`
  );

  if (farmers.error) {
    return { error: farmers.error, status: farmers.status };
  }

  const farmer = farmers.data?.[0];

  if (!farmer) {
    return { error: "Imported farmer could not be found.", status: 404 };
  }

  return { farmer };
}

export async function GET(request: Request) {
  const adminUser = await requireAdminUser(request);

  if (!adminUser) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  const farmers = await selectSupabaseRecords<ExistingFarmer>("farmers", `${farmerReviewSelect}&order=created_at.desc&limit=5000`);

  if (farmers.error) {
    return NextResponse.json({ error: "Could not load imported farmers." }, { status: farmers.status });
  }

  const importedFarmers = (farmers.data ?? []).filter((farmer) => {
    const source = normalizedFarmerSource(farmer.source);
    return source === "Tally Import" || source === "Founding Farmer";
  });

  return NextResponse.json({
    farmers: importedFarmers.map(friendlyImportedFarmer),
    diagnostics: {
      totalSupabaseFarmers: farmers.data?.length ?? 0,
      importedFarmers: importedFarmers.length,
      tallyImportFarmers: importedFarmers.filter((farmer) => normalizedFarmerSource(farmer.source) === "Tally Import").length,
      foundingFarmers: importedFarmers.filter((farmer) => normalizedFarmerSource(farmer.source) === "Founding Farmer").length,
      sourceValues: Array.from(new Set((farmers.data ?? []).map((farmer) => farmer.source?.trim() || "(empty)"))).sort()
    }
  });
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
  const mode = formData?.get("mode") === "import" ? "import" : "preview";

  if (!rawHeaders || bodyRows.length === 0) {
    return NextResponse.json({ error: "CSV file does not contain farmer records." }, { status: 400 });
  }

  const headerInfo = csvHeaderInfo(rawHeaders);
  const previewRows = bodyRows.slice(0, 8).map((values) => rowToPreview(values, headerInfo));

  if (headerInfo.missingRequiredFields.length > 0) {
    return NextResponse.json(
      {
        error: `Required CSV column mapping missing: ${headerInfo.missingRequiredFields.join(", ")}.`,
        detectedHeaders: headerInfo.rawHeaders,
        normalizedHeaders: headerInfo.normalizedHeaders,
        fieldMappings: headerInfo.mappings,
        missingRequiredFields: headerInfo.missingRequiredFields,
        previewRows
      },
      { status: 400 }
    );
  }

  if (mode === "preview") {
    return NextResponse.json({
      ok: true,
      mode: "preview",
      detectedHeaders: headerInfo.rawHeaders,
      normalizedHeaders: headerInfo.normalizedHeaders,
      fieldMappings: headerInfo.mappings,
      missingRequiredFields: headerInfo.missingRequiredFields,
      previewRows,
      totalRows: bodyRows.length
    });
  }

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
    const missingRequiredValue = firstMissingRequiredValue(values, headerInfo);

    if (missingRequiredValue) {
      errors.push({ row: rowNumber, message: `${missingRequiredValue} is empty in the mapped CSV column.` });
      continue;
    }

    const mapped = mapTallyRow(values, headerInfo);

    if (!mapped.farmer_name || !mapped.whatsapp_number) {
      errors.push({ row: rowNumber, message: "Mapped Farmer Name or Phone / WhatsApp Number is empty." });
      continue;
    }

    const existingSamePhone = existingByPhone.get(mapped.whatsapp_number) ?? [];
    const signature = farmerSignature(mapped);
    const exactExisting = existingSamePhone.find((farmer) => farmerSignature({
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
      const update = await updateSupabaseRecord("farmers", `id=eq.${encodeURIComponent(exactExisting.id)}`, await tallyDetailPayload(mapped));

      if (update.error) {
        errors.push({ row: rowNumber, message: "Existing farmer found, but full Tally details could not be updated." });
      } else {
        const record = update.data as ExistingFarmer | undefined;
        if (record) {
          imported.push(record);
        }
        duplicates.push({ row: rowNumber, phone: mapped.whatsapp_number, reason: "Existing farmer updated with full Tally details." });
      }
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
      ...(await tallyDetailPayload(mapped)),
      slug: uniqueSlug.slug,
      verification_date: null,
      verified_by: null,
      verification_notes: null
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
    detectedHeaders: headerInfo.rawHeaders,
    normalizedHeaders: headerInfo.normalizedHeaders,
    fieldMappings: headerInfo.mappings,
    missingRequiredFields: headerInfo.missingRequiredFields,
    previewRows,
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

  const body = (await request.json().catch(() => ({}))) as {
    action?: "approve" | "under-review" | "needs-follow-up" | "verify" | "verify-only" | "founding" | "reject" | "archive" | "notes" | "view" | "import-photo";
    ids?: string[];
    notes?: string;
  };
  const ids = (body.ids ?? []).filter(Boolean);

  if (!body.action || !["approve", "under-review", "needs-follow-up", "verify", "verify-only", "founding", "reject", "archive", "notes", "view", "import-photo"].includes(body.action) || ids.length === 0) {
    return NextResponse.json({ error: "Choose farmers and a valid bulk action." }, { status: 400 });
  }

  if (body.action === "view") {
    const target = await getImportedFarmerById(ids[0]);

    if (target.error || !target.farmer) {
      return NextResponse.json({ error: target.error ?? "Imported farmer could not be found." }, { status: target.status ?? 404 });
    }

    await logAdminActivity({
      adminEmail: adminUser.email,
      actionType: "View",
      entityType: "Farmer",
      entityId: target.farmer.slug ?? target.farmer.id,
      entityName: target.farmer.farm_name
    });

    return NextResponse.json({ ok: true, farmer: friendlyImportedFarmer(target.farmer) });
  }

  if (body.action === "import-photo") {
    if (ids.length !== 1) {
      return NextResponse.json({ error: "Import one farmer photo at a time." }, { status: 400 });
    }

    const target = await getImportedFarmerById(ids[0]);

    if (target.error || !target.farmer) {
      return NextResponse.json({ error: target.error ?? "Imported farmer could not be found." }, { status: target.status ?? 404 });
    }

    const importedPhotoUrl = await importExistingFarmerPhoto(target.farmer);

    if (!importedPhotoUrl) {
      return NextResponse.json({ error: "Could not import this Tally photo. The source may be private, expired, missing, or unsupported." }, { status: 422 });
    }

    const update = await updateSupabaseRecord("farmers", `id=eq.${encodeURIComponent(target.farmer.id)}`, {
      imported_photo_url: importedPhotoUrl,
      profile_image_url: importedPhotoUrl
    });

    if (update.error) {
      return NextResponse.json({ error: "Photo was uploaded but could not be saved to the farmer record." }, { status: update.status });
    }

    await logAdminActivity({
      adminEmail: adminUser.email,
      actionType: "Edit",
      entityType: "Farmer",
      entityId: target.farmer.slug ?? target.farmer.id,
      entityName: target.farmer.farm_name
    });

    const refreshedTarget = await getImportedFarmerById(target.farmer.id);
    const farmer = refreshedTarget && "farmer" in refreshedTarget && refreshedTarget.farmer ? friendlyImportedFarmer(refreshedTarget.farmer) : undefined;

    return NextResponse.json({ ok: true, farmer, message: "Farmer photo imported successfully." });
  }

  const filter = `id=in.(${ids.map(encodeURIComponent).join(",")})`;
  const now = new Date().toISOString();
  const payload =
    body.action === "archive"
      ? { status: "Archived" }
      : body.action === "notes"
        ? { verification_notes: body.notes ?? "" }
      : body.action === "reject"
        ? { status: "Pending Review", verification_status: "Rejected", verification_date: null, verified_by: null, verification_notes: body.notes ?? "" }
      : body.action === "under-review"
        ? { status: "Pending Review", verification_status: "Under Review", verification_date: null, verified_by: null, verification_notes: body.notes ?? "" }
      : body.action === "needs-follow-up"
        ? { verification_status: "Needs Follow-up", verification_date: null, verified_by: null, verification_notes: body.notes ?? "" }
      : body.action === "founding"
        ? { status: "Active", source: "Founding Farmer" }
      : body.action === "verify"
        ? { status: "Active", verification_status: "Verified", verification_date: now, verified_by: adminUser.email, verification_notes: body.notes ?? "" }
      : body.action === "verify-only"
        ? { verification_status: "Verified", verification_date: now, verified_by: adminUser.email, verification_notes: body.notes ?? "" }
        : { status: "Active", verification_status: "Pending", verification_date: null, verified_by: null };
  const update = await updateSupabaseRecord("farmers", filter, payload);

  if (update.error) {
    return NextResponse.json({ error: "Could not update imported farmers." }, { status: update.status });
  }

  if (!update.data) {
    return NextResponse.json({ error: "No matching farmer record was updated." }, { status: 404 });
  }

  const actionType =
    body.action === "archive"
      ? "Archive"
      : body.action === "verify"
        ? "Verify"
      : body.action === "verify-only"
        ? "Verify"
      : body.action === "needs-follow-up"
        ? "Review"
      : body.action === "reject"
        ? "Reject"
      : body.action === "under-review"
        ? "Review"
      : body.action === "founding"
        ? "Edit"
      : body.action === "notes"
        ? "Edit"
        : "Approve";

  await logAdminActivity({
    adminEmail: adminUser.email,
    actionType,
    entityType: "Farmer",
    entityId: ids.join(","),
    entityName: `${ids.length} imported farmer${ids.length === 1 ? "" : "s"}${body.action === "founding" ? " assigned Founding Farmer" : ""}`
  });

  const refreshedTarget = ids.length === 1 ? await getImportedFarmerById(ids[0]) : null;
  const farmer = refreshedTarget && "farmer" in refreshedTarget && refreshedTarget.farmer ? friendlyImportedFarmer(refreshedTarget.farmer) : undefined;
  const message =
    body.action === "verify"
      ? "Farmer verified and published successfully."
      : body.action === "verify-only"
        ? "Farmer verified successfully. Public visibility was not changed."
      : body.action === "under-review"
        ? "Farmer marked under review."
        : body.action === "needs-follow-up"
          ? "Farmer marked as needs follow-up."
        : body.action === "reject"
          ? "Farmer rejected."
          : body.action === "archive"
            ? "Farmer archived."
            : body.action === "notes"
              ? "Verification notes saved."
              : "Farmer review updated.";

  return NextResponse.json({ ok: true, updated: ids.length, farmer, message });
}
