import { createSign } from "node:crypto";
import { farmerRegistrationNotifications } from "@/data/notificationConfig";

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

function base64Url(value: string | Buffer) {
  return Buffer.from(value).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function getGoogleAccessToken() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    return undefined;
  }

  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64Url(
    JSON.stringify({
      iss: clientEmail,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now
    })
  );
  const unsignedJwt = `${header}.${claim}`;
  const signature = createSign("RSA-SHA256").update(unsignedJwt).sign(privateKey);
  const jwt = `${unsignedJwt}.${base64Url(signature)}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt
    })
  });

  if (!response.ok) {
    throw new Error("Unable to authenticate with Google Sheets.");
  }

  const token = (await response.json()) as { access_token?: string };
  return token.access_token;
}

export async function appendFarmerRegistrationToSheet(data: FarmerRegistrationPayload) {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const accessToken = await getGoogleAccessToken();

  if (!spreadsheetId || !accessToken) {
    return { configured: false };
  }

  const sheetName = process.env.GOOGLE_SHEETS_FARMER_SHEET_NAME || farmerRegistrationNotifications.googleSheetName;
  const submittedAt = new Date().toISOString();
  const values = [[
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
  ]];

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      `${sheetName}!A:M`
    )}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ values })
    }
  );

  if (!response.ok) {
    throw new Error("Unable to append farmer registration to Google Sheets.");
  }

  return { configured: true };
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
