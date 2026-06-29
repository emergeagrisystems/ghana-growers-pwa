import { farmerRegistrationNotifications } from "@/data/notificationConfig";
import { appendValuesToGoogleSheet } from "@/lib/googleSheets";

export type FarmerRegistrationPayload = {
  farmerName: string;
  fullName: string;
  farmName: string;
  phoneNumber: string;
  whatsappNumber: string;
  emailAddress: string;
  region: string;
  district: string;
  districtTown: string;
  farmSize: string;
  farmSizeAcres: string;
  farmType: "Crop" | "Livestock" | "Mixed";
  mainCrops: string;
  products: string;
  otherProduce: string;
  currentAvailability: string;
  harvestSeason: string;
  expectedHarvestPeriod: string;
  farmDescription: string;
  additionalNotes: string;
  hasAvailableProduce: string;
  farmerPhotoUrl: string;
  farmPhotoUrls: string[];
  producePhotoUrls: string[];
  agreement: boolean;
  privacyAccepted: boolean;
};

export type FarmerRegistrationResult = {
  ok: boolean;
  errors: Partial<Record<keyof FarmerRegistrationPayload | "form", string>>;
  data?: FarmerRegistrationPayload;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(clean).filter(Boolean);
  }

  const stringValue = clean(value);
  return stringValue ? stringValue.split(",").map((item) => item.trim()).filter(Boolean) : [];
}

export function validateFarmerRegistration(input: Record<string, unknown>): FarmerRegistrationResult {
  const farmerName = clean(input.farmerName) || clean(input.fullName);
  const districtTown = clean(input.districtTown) || clean(input.district);
  const farmSize = clean(input.farmSize) || clean(input.farmSizeAcres);
  const mainCrops = clean(input.mainCrops) || clean(input.products);
  const harvestSeason = clean(input.harvestSeason) || clean(input.expectedHarvestPeriod);
  const farmDescription = clean(input.farmDescription) || clean(input.additionalNotes);
  const agreement = input.agreement === true || input.privacyAccepted === true;

  const data: FarmerRegistrationPayload = {
    farmerName,
    fullName: farmerName,
    farmName: clean(input.farmName),
    phoneNumber: clean(input.phoneNumber) || clean(input.phone),
    whatsappNumber: clean(input.whatsappNumber) || clean(input.whatsapp),
    emailAddress: clean(input.emailAddress) || clean(input.email),
    region: clean(input.region),
    district: districtTown,
    districtTown,
    farmSize,
    farmSizeAcres: farmSize,
    farmType: (clean(input.farmType) || "Crop") as FarmerRegistrationPayload["farmType"],
    mainCrops,
    products: mainCrops,
    otherProduce: clean(input.otherProduce),
    currentAvailability: clean(input.currentAvailability),
    harvestSeason,
    expectedHarvestPeriod: harvestSeason,
    farmDescription,
    additionalNotes: farmDescription,
    hasAvailableProduce: clean(input.hasAvailableProduce),
    farmerPhotoUrl: clean(input.farmerPhotoUrl),
    farmPhotoUrls: cleanArray(input.farmPhotoUrls),
    producePhotoUrls: cleanArray(input.producePhotoUrls),
    agreement,
    privacyAccepted: agreement
  };
  const errors: FarmerRegistrationResult["errors"] = {};
  const requiredFields: Array<keyof FarmerRegistrationPayload> = [
    "farmerName",
    "phoneNumber",
    "region",
    "districtTown",
    "mainCrops",
    "currentAvailability",
    "farmDescription",
    "hasAvailableProduce"
  ];

  requiredFields.forEach((field) => {
    if (!data[field]) {
      errors[field] = "This field is required.";
    }
  });

  if (data.emailAddress && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.emailAddress)) {
    errors.emailAddress = "Enter a valid email address.";
  }

  if (data.farmSize && Number(data.farmSize) <= 0) {
    errors.farmSize = "Enter a farm size greater than zero.";
    errors.farmSizeAcres = "Enter a farm size greater than zero.";
  }

  if (!["Crop", "Livestock", "Mixed"].includes(data.farmType)) {
    errors.farmType = "Select a valid farm type.";
  }

  if (!data.agreement) {
    errors.agreement = "You must accept the Ghana Growers marketplace and quality guidelines.";
    errors.privacyAccepted = "You must accept the Ghana Growers marketplace and quality guidelines.";
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    data
  };
}

export async function appendFarmerRegistrationToSheet(data: FarmerRegistrationPayload) {
  const sheetName = process.env.GOOGLE_SHEETS_FARMER_SHEET_NAME || farmerRegistrationNotifications.googleSheetName;
  const submittedAt = new Date().toISOString();

  return appendValuesToGoogleSheet(sheetName, "A:U", [[
    submittedAt,
    data.farmerName,
    data.farmName,
    data.phoneNumber,
    data.whatsappNumber,
    data.emailAddress,
    data.region,
    data.districtTown,
    data.farmSize,
    data.farmType,
    data.mainCrops,
    data.otherProduce,
    data.currentAvailability,
    data.harvestSeason,
    data.hasAvailableProduce,
    data.farmDescription,
    data.farmerPhotoUrl,
    data.farmPhotoUrls.join(", "),
    data.producePhotoUrls.join(", "),
    data.agreement ? "Yes" : "No",
    data.additionalNotes
  ]]);
}

export async function sendFarmerRegistrationEmail(data: FarmerRegistrationPayload) {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey || farmerRegistrationNotifications.adminEmails.length === 0) {
    return { configured: false };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: process.env.FARMER_REGISTRATION_FROM_EMAIL || farmerRegistrationNotifications.fromEmail,
      to: farmerRegistrationNotifications.adminEmails,
      subject: `${farmerRegistrationNotifications.subjectPrefix}: ${data.farmerName}`,
      text: [
        `Farmer Name: ${data.farmerName}`,
        `Farm Name: ${data.farmName || "Not provided"}`,
        `Phone Number: ${data.phoneNumber}`,
        `WhatsApp Number: ${data.whatsappNumber || "Not provided"}`,
        `Email Address: ${data.emailAddress || "Not provided"}`,
        `Region: ${data.region}`,
        `District/Town: ${data.districtTown}`,
        `Farm Size: ${data.farmSize || "Not provided"}`,
        `Farm Type: ${data.farmType}`,
        `Main Crops/Produce: ${data.mainCrops}`,
        `Other Produce: ${data.otherProduce || "None"}`,
        `Current Availability: ${data.currentAvailability}`,
        `Harvest Season: ${data.harvestSeason || "Not provided"}`,
        `Has Available Produce: ${data.hasAvailableProduce}`,
        `Farm Description: ${data.farmDescription}`,
        `Farmer Photo: ${data.farmerPhotoUrl || "None"}`,
        `Farm Photos: ${data.farmPhotoUrls.join(", ") || "None"}`,
        `Produce Photos: ${data.producePhotoUrls.join(", ") || "None"}`,
        `Agreement: ${data.agreement ? "Yes" : "No"}`
      ].join("\n")
    })
  });

  if (!response.ok) {
    throw new Error("Unable to send farmer registration email.");
  }

  return { configured: true };
}
