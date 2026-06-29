import { supplierRegistrationNotifications } from "@/data/notificationConfig";
import { appendValuesToGoogleSheet } from "@/lib/googleSheets";

export type SupplierRegistrationPayload = {
  businessName: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  whatsapp: string;
  email: string;
  websiteUrl: string;
  registrationNumber: string;
  region: string;
  district: string;
  categories: string[];
  regionsServed: string[];
  supplierCategory: string;
  productsServicesOffered: string;
  deliveryCoverage: string;
  businessDescription: string;
  yearsInBusiness: string;
  website: string;
  description: string;
  logoImageUrl: string;
  photoUrls: string[];
  certificateUrls: string[];
  ggStandardAgreement: boolean;
  privacyAccepted: boolean;
};

export type SupplierRegistrationResult = {
  ok: boolean;
  errors: Partial<Record<keyof SupplierRegistrationPayload, string>>;
  data?: SupplierRegistrationPayload;
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

export function validateSupplierRegistration(input: Record<string, unknown>): SupplierRegistrationResult {
  const isOnboardingFlow = input.onboardingFlow === "true";
  const categories = cleanArray(input.categories ?? input.supplierCategory);
  const regionsServed = cleanArray(input.regionsServed ?? input.region);
  const businessName = clean(input.businessName) || clean(input.companyName);
  const websiteUrl = clean(input.websiteUrl) || clean(input.website);
  const businessDescription = clean(input.businessDescription) || clean(input.description);

  const data: SupplierRegistrationPayload = {
    businessName,
    companyName: clean(input.companyName) || businessName,
    contactPerson: clean(input.contactPerson),
    phone: clean(input.phone),
    whatsapp: clean(input.whatsapp),
    email: clean(input.email),
    region: clean(input.region),
    district: clean(input.district),
    websiteUrl,
    registrationNumber: clean(input.registrationNumber),
    categories,
    regionsServed,
    supplierCategory: clean(input.supplierCategory) || categories.join(", "),
    productsServicesOffered: clean(input.productsServicesOffered),
    deliveryCoverage: clean(input.deliveryCoverage) || regionsServed.join(", "),
    businessDescription,
    yearsInBusiness: clean(input.yearsInBusiness),
    website: websiteUrl,
    description: businessDescription,
    logoImageUrl: clean(input.logoImageUrl),
    photoUrls: cleanArray(input.photoUrls),
    certificateUrls: cleanArray(input.certificateUrls),
    ggStandardAgreement: input.ggStandardAgreement === true,
    privacyAccepted: input.privacyAccepted === true || input.ggStandardAgreement === true
  };
  const errors: SupplierRegistrationResult["errors"] = {};
  const requiredFields: Array<keyof SupplierRegistrationPayload> = isOnboardingFlow
    ? ["contactPerson", "phone", "email", "productsServicesOffered"]
    : ["contactPerson", "phone", "whatsapp", "region", "district", "supplierCategory", "productsServicesOffered", "deliveryCoverage"];

  requiredFields.forEach((field) => {
    if (!data[field]) {
      errors[field] = "This field is required.";
    }
  });

  if (isOnboardingFlow && !data.businessName) {
    errors.businessName = "Business name is required.";
    errors.companyName = "Business name is required.";
  }

  if (isOnboardingFlow && data.categories.length === 0) {
    errors.categories = "Choose at least one supplier category.";
    errors.supplierCategory = "Choose at least one supplier category.";
  }

  if (isOnboardingFlow && data.regionsServed.length === 0 && !data.region) {
    errors.regionsServed = "Choose at least one region served.";
    errors.region = "Choose at least one region served.";
  }

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (data.website && !/^https?:\/\/.+\..+/.test(data.website)) {
    errors.website = "Enter a valid website URL starting with http:// or https://.";
    errors.websiteUrl = "Enter a valid website URL starting with http:// or https://.";
  }

  if (isOnboardingFlow && !data.ggStandardAgreement) {
    errors.ggStandardAgreement = "You must accept the Ghana Growers Quality Standard agreement.";
    errors.privacyAccepted = "You must accept the Ghana Growers Quality Standard agreement.";
  } else if (!isOnboardingFlow && !data.privacyAccepted) {
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

  return appendValuesToGoogleSheet(sheetName, "A:S", [[
    submittedAt,
    data.companyName,
    data.contactPerson,
    data.phone,
    data.whatsapp,
    data.email,
    data.region,
    data.district,
    data.categories.join(", ") || data.supplierCategory,
    data.productsServicesOffered,
    data.regionsServed.join(", ") || data.deliveryCoverage,
    data.websiteUrl,
    data.businessDescription,
    data.logoImageUrl,
    data.registrationNumber,
    data.yearsInBusiness,
    data.photoUrls.join(", "),
    data.certificateUrls.join(", "),
    data.ggStandardAgreement ? "Yes" : "No"
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
        `Business Name: ${data.businessName || data.companyName}`,
        `Contact Person: ${data.contactPerson}`,
        `Phone: ${data.phone}`,
        `WhatsApp: ${data.whatsapp}`,
        `Email: ${data.email || "Not provided"}`,
        `Region: ${data.region || "Not provided"}`,
        `District: ${data.district}`,
        `Supplier Categories: ${data.categories.join(", ") || data.supplierCategory}`,
        `Regions Served: ${data.regionsServed.join(", ") || data.deliveryCoverage}`,
        `Products/Services Offered: ${data.productsServicesOffered}`,
        `Website: ${data.websiteUrl || "None"}`,
        `Registration Number: ${data.registrationNumber || "None"}`,
        `Years in Business: ${data.yearsInBusiness || "Not provided"}`,
        `Logo/Image: ${data.logoImageUrl || "None"}`,
        `Photos: ${data.photoUrls.join(", ") || "None"}`,
        `Certificates: ${data.certificateUrls.join(", ") || "None"}`,
        `Description: ${data.businessDescription || "None"}`,
        `GG Standard Agreement: ${data.ggStandardAgreement ? "Yes" : "No"}`
      ].join("\n")
    })
  });

  if (!response.ok) {
    throw new Error("Unable to send supplier registration email.");
  }

  return { configured: true };
}
