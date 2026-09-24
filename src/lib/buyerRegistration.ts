import { buyerRegistrationNotifications } from "@/data/notificationConfig";
import { appendValuesToGoogleSheet } from "@/lib/googleSheets";

export type BuyerRegistrationPayload = {
  name: string;
  businessName: string;
  phone: string;
  whatsapp: string;
  email: string;
  region: string;
  buyerType: string;
  productsInterestedIn: string;
  typicalPurchaseVolume: string;
  purchaseFrequency: string;
  additionalNotes: string;
  privacyAccepted: boolean;
};

export type BuyerRegistrationResult = {
  ok: boolean;
  errors: Partial<Record<keyof BuyerRegistrationPayload, string>>;
  data?: BuyerRegistrationPayload;
};

const requiredFields: Array<keyof BuyerRegistrationPayload> = [
  "name",
  "businessName",
  "phone",
  "whatsapp",
  "email",
  "region",
  "buyerType",
  "productsInterestedIn",
  "typicalPurchaseVolume",
  "purchaseFrequency"
];

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function validateBuyerRegistration(input: Record<string, unknown>): BuyerRegistrationResult {
  const data: BuyerRegistrationPayload = {
    name: clean(input.name),
    businessName: clean(input.businessName),
    phone: clean(input.phone),
    whatsapp: clean(input.whatsapp),
    email: clean(input.email),
    region: clean(input.region),
    buyerType: clean(input.buyerType),
    productsInterestedIn: clean(input.productsInterestedIn),
    typicalPurchaseVolume: clean(input.typicalPurchaseVolume),
    purchaseFrequency: clean(input.purchaseFrequency),
    additionalNotes: clean(input.additionalNotes),
    privacyAccepted: input.privacyAccepted === true
  };
  const errors: BuyerRegistrationResult["errors"] = {};

  requiredFields.forEach((field) => {
    if (!data[field]) {
      errors[field] = "This field is required.";
    }
  });

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Enter a valid email address.";
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

export async function appendBuyerRegistrationToSheet(data: BuyerRegistrationPayload) {
  const sheetName = process.env.GOOGLE_SHEETS_BUYER_SHEET_NAME || buyerRegistrationNotifications.googleSheetName;
  const submittedAt = new Date().toISOString();

  return appendValuesToGoogleSheet(sheetName, "A:L", [[
    submittedAt,
    data.name,
    data.businessName,
    data.phone,
    data.whatsapp,
    data.email,
    data.region,
    data.buyerType,
    data.productsInterestedIn,
    data.typicalPurchaseVolume,
    data.purchaseFrequency,
    data.additionalNotes
  ]]);
}

export async function sendBuyerRegistrationEmail(data: BuyerRegistrationPayload) {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey || buyerRegistrationNotifications.adminEmails.length === 0) {
    return { configured: false };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: process.env.BUYER_REGISTRATION_FROM_EMAIL || buyerRegistrationNotifications.fromEmail,
      to: buyerRegistrationNotifications.adminEmails,
      subject: `${buyerRegistrationNotifications.subjectPrefix}: ${data.name}`,
      text: [
        `Name: ${data.name}`,
        `Business Name: ${data.businessName}`,
        `Phone: ${data.phone}`,
        `WhatsApp: ${data.whatsapp}`,
        `Email: ${data.email}`,
        `Region: ${data.region}`,
        `Buyer Type: ${data.buyerType}`,
        `Products Interested In: ${data.productsInterestedIn}`,
        `Typical Purchase Volume: ${data.typicalPurchaseVolume}`,
        `Purchase Frequency: ${data.purchaseFrequency}`,
        `Additional Notes: ${data.additionalNotes || "None"}`
      ].join("\n")
    })
  });

  if (!response.ok) {
    throw new Error("Unable to send buyer registration email.");
  }

  return { configured: true };
}
