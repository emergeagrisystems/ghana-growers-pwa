import { farmerRegistrationNotifications } from "@/data/notificationConfig";
import { appendValuesToGoogleSheet } from "@/lib/googleSheets";

export type FarmerRegistrationPayload = {
  fullName: string;
  farmName: string;
  phoneNumber: string;
  whatsappNumber: string;
  emailAddress: string;
  region: string;
  district: string;
  farmSizeAcres: string;
  farmType: "Crop" | "Livestock" | "Mixed";
  products: string;
  expectedHarvestPeriod: string;
  additionalNotes: string;
  privacyAccepted: boolean;
};

export type FarmerRegistrationResult = {
  ok: boolean;
  errors: Partial<Record<keyof FarmerRegistrationPayload, string>>;
  data?: FarmerRegistrationPayload;
};

const requiredFields: Array<keyof FarmerRegistrationPayload> = [
  "fullName",
  "farmName",
  "phoneNumber",
  "whatsappNumber",
  "emailAddress",
  "region",
  "district",
  "farmSizeAcres",
  "farmType",
  "products",
  "expectedHarvestPeriod"
];

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function validateFarmerRegistration(input: Record<string, unknown>): FarmerRegistrationResult {
  const data: FarmerRegistrationPayload = {
    fullName: clean(input.fullName),
    farmName: clean(input.farmName),
    phoneNumber: clean(input.phoneNumber),
    whatsappNumber: clean(input.whatsappNumber),
    emailAddress: clean(input.emailAddress),
    region: clean(input.region),
    district: clean(input.district),
    farmSizeAcres: clean(input.farmSizeAcres),
    farmType: clean(input.farmType) as FarmerRegistrationPayload["farmType"],
    products: clean(input.products),
    expectedHarvestPeriod: clean(input.expectedHarvestPeriod),
    additionalNotes: clean(input.additionalNotes),
    privacyAccepted: input.privacyAccepted === true
  };
  const errors: FarmerRegistrationResult["errors"] = {};

  requiredFields.forEach((field) => {
    if (!data[field]) {
      errors[field] = "This field is required.";
    }
  });

  if (data.emailAddress && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.emailAddress)) {
    errors.emailAddress = "Enter a valid email address.";
  }

  if (data.farmSizeAcres && Number(data.farmSizeAcres) <= 0) {
    errors.farmSizeAcres = "Enter a farm size greater than zero.";
  }

  if (!["Crop", "Livestock", "Mixed"].includes(data.farmType)) {
    errors.farmType = "Select a valid farm type.";
  }

  if (!data.privacyAccepted) {
    errors.privacyAccepted = "You must accept the privacy notice.";
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

  return appendValuesToGoogleSheet(sheetName, "A:M", [[
    submittedAt,
    data.fullName,
    data.farmName,
    data.phoneNumber,
    data.whatsappNumber,
    data.emailAddress,
    data.region,
    data.district,
    data.farmSizeAcres,
    data.farmType,
    data.products,
    data.expectedHarvestPeriod,
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
      subject: `${farmerRegistrationNotifications.subjectPrefix}: ${data.fullName}`,
      text: [
        `Full Name: ${data.fullName}`,
        `Farm Name: ${data.farmName}`,
        `Phone Number: ${data.phoneNumber}`,
        `WhatsApp Number: ${data.whatsappNumber}`,
        `Email Address: ${data.emailAddress}`,
        `Region: ${data.region}`,
        `District: ${data.district}`,
        `Farm Size (Acres): ${data.farmSizeAcres}`,
        `Farm Type: ${data.farmType}`,
        `Products Grown/Raised: ${data.products}`,
        `Expected Harvest Period: ${data.expectedHarvestPeriod}`,
        `Additional Notes: ${data.additionalNotes || "None"}`
      ].join("\n")
    })
  });

  if (!response.ok) {
    throw new Error("Unable to send farmer registration email.");
  }

  return { configured: true };
}
