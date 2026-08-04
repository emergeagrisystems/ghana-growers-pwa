import { createHmac, randomBytes } from "node:crypto";

export type FarmerRegistrationPayload = {
  applicantName: string;
  farmName: string;
  phoneNumber: string;
  whatsappNumber: string;
  email: string;
  region: string;
  district: string;
  farmLocation: string;
  farmType: "Crop" | "Livestock" | "Mixed";
  cropsProducts: string[];
  productionDetails: string;
  currentAvailability: string;
  supplyFrequency: string;
  harvestSeason: string;
  deliveryPreference: string;
  applicationMessage: string;
  agreementAccepted: boolean;
  submissionToken: string;
};

export type FarmerRegistrationField = keyof FarmerRegistrationPayload | "contact" | "media" | "form";

export type FarmerRegistrationResult = {
  ok: boolean;
  errors: Partial<Record<FarmerRegistrationField, string>>;
  data?: FarmerRegistrationPayload;
};

export type FarmerApplicationMediaFingerprint = {
  group: string;
  kind: "image" | "document";
  contentType: string;
  size: number;
  digest: string;
};

const maxLengths: Partial<Record<keyof FarmerRegistrationPayload, number>> = {
  applicantName: 120,
  farmName: 160,
  phoneNumber: 40,
  whatsappNumber: 40,
  email: 254,
  region: 120,
  district: 120,
  farmLocation: 200,
  productionDetails: 1500,
  currentAvailability: 500,
  supplyFrequency: 300,
  harvestSeason: 300,
  deliveryPreference: 500,
  applicationMessage: 1500
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanList(value: unknown) {
  const values = Array.isArray(value) ? value : [value];
  return Array.from(new Set(values.flatMap((item) => clean(item).split(/[\n,;]+/))
    .map((item) => item.trim())
    .filter(Boolean)));
}

function hasValidPhoneLength(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

export function isFarmerSubmissionToken(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function validateFarmerRegistration(input: Record<string, unknown>): FarmerRegistrationResult {
  const cropsProducts = cleanList(input.cropsProducts ?? input.mainCrops ?? input.products);
  const data: FarmerRegistrationPayload = {
    applicantName: clean(input.applicantName ?? input.farmerName ?? input.fullName),
    farmName: clean(input.farmName),
    phoneNumber: clean(input.phoneNumber ?? input.phone),
    whatsappNumber: clean(input.whatsappNumber ?? input.whatsapp),
    email: clean(input.email ?? input.emailAddress),
    region: clean(input.region),
    district: clean(input.district ?? input.districtTown),
    farmLocation: clean(input.farmLocation ?? input.location),
    farmType: clean(input.farmType) as FarmerRegistrationPayload["farmType"],
    cropsProducts,
    productionDetails: clean(input.productionDetails ?? input.farmDescription),
    currentAvailability: clean(input.currentAvailability),
    supplyFrequency: clean(input.supplyFrequency),
    harvestSeason: clean(input.harvestSeason ?? input.expectedHarvestPeriod),
    deliveryPreference: clean(input.deliveryPreference),
    applicationMessage: clean(input.applicationMessage ?? input.additionalNotes),
    agreementAccepted: input.agreementAccepted === true || input.agreement === true || input.privacyAccepted === true,
    submissionToken: clean(input.submissionToken)
  };
  const errors: FarmerRegistrationResult["errors"] = {};

  if (!data.applicantName) errors.applicantName = "Enter your name.";
  if (!data.phoneNumber && !data.whatsappNumber) errors.contact = "Enter a phone or WhatsApp number.";
  if (data.phoneNumber && !hasValidPhoneLength(data.phoneNumber)) errors.phoneNumber = "Enter a valid phone number.";
  if (data.whatsappNumber && !hasValidPhoneLength(data.whatsappNumber)) errors.whatsappNumber = "Enter a valid WhatsApp number.";
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "Enter a valid email address.";
  if (!data.region) errors.region = "Select your region.";
  if (!data.district) errors.district = "Enter your district.";
  if (!["Crop", "Livestock", "Mixed"].includes(data.farmType)) errors.farmType = "Select a farm type.";
  if (data.cropsProducts.length === 0) errors.cropsProducts = "Tell us what you grow or produce.";
  if (data.cropsProducts.length > 30 || data.cropsProducts.some((item) => item.length > 80)) {
    errors.cropsProducts = "Use up to 30 short crop or product names.";
  }
  if (!data.agreementAccepted) errors.agreementAccepted = "Confirm the application terms before submitting.";
  if (!isFarmerSubmissionToken(data.submissionToken)) errors.form = "Please refresh this page and try again.";

  for (const [field, maxLength] of Object.entries(maxLengths) as Array<[keyof FarmerRegistrationPayload, number]>) {
    const value = data[field];
    if (typeof value === "string" && value.length > maxLength) {
      errors[field] = `Keep this answer under ${maxLength} characters.`;
    }
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    data
  };
}

function hmacDigest(secret: string, parts: string[]) {
  if (secret.trim().length < 32) return "";
  return createHmac("sha256", secret).update(parts.join("|")).digest("hex");
}

export function farmerApplicationSubmissionKey(submissionToken: string, secret: string) {
  return hmacDigest(secret, ["farmer-application-submission", submissionToken]);
}

export function farmerApplicationPayloadFingerprint(
  payload: FarmerRegistrationPayload,
  media: FarmerApplicationMediaFingerprint[],
  secret: string
) {
  const canonicalPayload = {
    version: 1,
    applicantName: payload.applicantName,
    farmName: payload.farmName,
    phoneNumber: payload.phoneNumber,
    whatsappNumber: payload.whatsappNumber,
    email: payload.email,
    region: payload.region,
    district: payload.district,
    farmLocation: payload.farmLocation,
    farmType: payload.farmType,
    cropsProducts: [...payload.cropsProducts].sort((left, right) => left.localeCompare(right)),
    productionDetails: payload.productionDetails,
    currentAvailability: payload.currentAvailability,
    supplyFrequency: payload.supplyFrequency,
    harvestSeason: payload.harvestSeason,
    deliveryPreference: payload.deliveryPreference,
    applicationMessage: payload.applicationMessage,
    agreementAccepted: payload.agreementAccepted,
    media: media.map((item) => ({
      group: item.group,
      kind: item.kind,
      contentType: item.contentType.toLowerCase(),
      size: item.size,
      digest: item.digest
    }))
  };

  return hmacDigest(secret, ["farmer-application-payload-v1", JSON.stringify(canonicalPayload)]);
}

export function farmerApplicationId(submissionKey: string) {
  if (!/^[0-9a-f]{64}$/i.test(submissionKey)) return "";
  const hex = submissionKey.toLowerCase();
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${((parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, "0")}${hex.slice(18, 20)}-${hex.slice(20, 32)}`;
}

export function farmerApplicationRateLimitKey({
  contact,
  clientKey,
  secret
}: {
  contact: string;
  clientKey: string;
  secret: string;
}) {
  const requestFingerprint = hmacDigest(secret, ["farmer-application-fingerprint", clientKey || "public"]);
  return hmacDigest(secret, ["farmer-application-rate-limit", contact, requestFingerprint]);
}

export function farmerApplicationDedupeKey({
  applicantName,
  farmName,
  contact,
  region,
  secret
}: {
  applicantName: string;
  farmName: string;
  contact: string;
  region: string;
  secret: string;
}) {
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9+]+/g, " ").replace(/\s+/g, " ").trim();
  return hmacDigest(secret, [
    "farmer-application-dedupe",
    normalize(applicantName),
    normalize(farmName),
    normalize(contact),
    normalize(region)
  ]);
}

export function createFarmerApplicationReference(date = new Date(), entropy = randomBytes(4)) {
  const day = date.toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = entropy.toString("hex").toUpperCase();
  return `GGF-${day}-${suffix}`;
}
