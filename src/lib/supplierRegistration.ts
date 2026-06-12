import { supplierRegistrationNotifications } from "@/data/notificationConfig";
import { appendValuesToGoogleSheet } from "@/lib/googleSheets";

export type SupplierRegistrationPayload = {
  companyName: string;
  contactPerson: string;
  phone: string;
  whatsapp: string;
  email: string;
  region: string;
  district: string;
  supplierCategory: string;
  productsServicesOffered: string;
  deliveryCoverage: string;
  website: string;
  description: string;
  logoImageUrl: string;
  privacyAccepted: boolean;
};

export type SupplierRegistrationResult = {
  ok: boolean;
  errors: Partial<Record<keyof SupplierRegistrationPayload, string>>;
  data?: SupplierRegistrationPayload;
};

const requiredFields: Array<keyof SupplierRegistrationPayload> = [
  "contactPerson",
  "phone",
  "whatsapp",
  "region",
  "district",
  "supplierCategory",
  "productsServicesOffered",
  "deliveryCoverage"
];

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function validateSupplierRegistration(input: Record<string, unknown>): SupplierRegistrationResult {
  const data: SupplierRegistrationPayload = {
    companyName: clean(input.companyName),
    contactPerson: clean(input.contactPerson),
    phone: clean(input.phone),
    whatsapp: clean(input.whatsapp),
    email: clean(input.email),
    region: clean(input.region),
    district: clean(input.district),
    supplierCategory: clean(input.supplierCategory),
    productsServicesOffered: clean(input.productsServicesOffered),
    deliveryCoverage: clean(input.deliveryCoverage),
    website: clean(input.website),
    description: clean(input.description),
    logoImageUrl: clean(input.logoImageUrl),
    privacyAccepted: input.privacyAccepted === true
  };
  const errors: SupplierRegistrationResult["errors"] = {};

  requiredFields.forEach((field) => {
    if (!data[field]) {
      errors[field] = "This field is required.";
    }
  });

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (data.website && !/^https?:\/\/.+\..+/.test(data.website)) {
    errors.website = "Enter a valid website URL starting with http:// or https://.";
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

export async function appendSupplierRegistrationToSheet(data: SupplierRegistrationPayload) {
  const sheetName = process.env.GOOGLE_SHEETS_SUPPLIER_SHEET_NAME || supplierRegistrationNotifications.googleSheetName;
  const submittedAt = new Date().toISOString();

  return appendValuesToGoogleSheet(sheetName, "A:N", [[
    submittedAt,
    data.companyName,
    data.contactPerson,
    data.phone,
    data.whatsapp,
    data.email,
    data.region,
    data.district,
    data.supplierCategory,
    data.productsServicesOffered,
    data.deliveryCoverage,
    data.website,
    data.description,
    data.logoImageUrl
  ]]);
}

export async function sendSupplierRegistrationEmail(data: SupplierRegistrationPayload) {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey || supplierRegistrationNotifications.adminEmails.length === 0) {
    return { configured: false };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: process.env.SUPPLIER_REGISTRATION_FROM_EMAIL || supplierRegistrationNotifications.fromEmail,
      to: supplierRegistrationNotifications.adminEmails,
      subject: `${supplierRegistrationNotifications.subjectPrefix}: ${data.companyName || data.contactPerson}`,
      text: [
        `Company Name: ${data.companyName || "Not provided"}`,
        `Contact Person: ${data.contactPerson}`,
        `Phone: ${data.phone}`,
        `WhatsApp: ${data.whatsapp}`,
        `Email: ${data.email || "Not provided"}`,
        `Region: ${data.region}`,
        `District: ${data.district}`,
        `Supplier Category: ${data.supplierCategory}`,
        `Products/Services Offered: ${data.productsServicesOffered}`,
        `Delivery Coverage: ${data.deliveryCoverage}`,
        `Website: ${data.website || "None"}`,
        `Logo/Image: ${data.logoImageUrl || "None"}`,
        `Description: ${data.description || "None"}`
      ].join("\n")
    })
  });

  if (!response.ok) {
    throw new Error("Unable to send supplier registration email.");
  }

  return { configured: true };
}
