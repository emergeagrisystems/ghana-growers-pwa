import {
  normalizeServiceAreas,
  normalizeSupplierCategories,
  unsupportedServiceAreas,
  unsupportedSupplierCategories
} from "@/lib/profileApplicationContracts";

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
  submissionToken: string;
};

export type SupplierRegistrationResult = {
  ok: boolean;
  errors: Partial<Record<keyof SupplierRegistrationPayload, string>>;
  data?: SupplierRegistrationPayload;
};

function clean(value: unknown, maxLength = 4000) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
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
  const submittedCategories = cleanArray(input.categories ?? input.supplierCategory);
  const submittedRegions = cleanArray(input.regionsServed ?? input.region);
  const categories = normalizeSupplierCategories(submittedCategories);
  const regionsServed = normalizeServiceAreas(submittedRegions);
  const businessName = clean(input.businessName, 160) || clean(input.companyName, 160);
  const websiteUrl = clean(input.websiteUrl, 2048) || clean(input.website, 2048);
  const businessDescription = clean(input.businessDescription, 4000) || clean(input.description, 4000);

  const data: SupplierRegistrationPayload = {
    businessName,
    companyName: clean(input.companyName, 160) || businessName,
    contactPerson: clean(input.contactPerson, 120),
    phone: clean(input.phone, 32),
    whatsapp: clean(input.whatsapp, 32),
    email: clean(input.email, 254),
    region: normalizeServiceAreas([clean(input.region, 80)])[0] ?? "",
    district: clean(input.district, 120),
    websiteUrl,
    registrationNumber: clean(input.registrationNumber, 120),
    categories,
    regionsServed,
    supplierCategory: clean(input.supplierCategory) || categories.join(", "),
    productsServicesOffered: clean(input.productsServicesOffered, 2000),
    deliveryCoverage: clean(input.deliveryCoverage) || regionsServed.join(", "),
    businessDescription,
    yearsInBusiness: clean(input.yearsInBusiness, 80),
    website: websiteUrl,
    description: businessDescription,
    logoImageUrl: clean(input.logoImageUrl),
    photoUrls: cleanArray(input.photoUrls),
    certificateUrls: cleanArray(input.certificateUrls),
    ggStandardAgreement: input.ggStandardAgreement === true,
    privacyAccepted: input.privacyAccepted === true || input.ggStandardAgreement === true,
    submissionToken: clean(input.submissionToken, 64)
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

  if (unsupportedSupplierCategories(submittedCategories).length > 0) {
    errors.categories = "Choose supplier categories from the available list.";
    errors.supplierCategory = "Choose supplier categories from the available list.";
  }

  if (isOnboardingFlow && data.regionsServed.length === 0 && !data.region) {
    errors.regionsServed = "Choose at least one region served.";
    errors.region = "Choose at least one region served.";
  }

  if (unsupportedServiceAreas(submittedRegions).length > 0) {
    errors.regionsServed = "Choose service regions from the available list.";
    errors.region = "Choose service regions from the available list.";
  }

  if (data.phone && !/^[+0-9()\-\s]{7,32}$/.test(data.phone)) {
    errors.phone = "Enter a valid phone number.";
  }

  if (data.whatsapp && !/^[+0-9()\-\s]{7,32}$/.test(data.whatsapp)) {
    errors.whatsapp = "Enter a valid WhatsApp number.";
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

  if (!isSupplierSubmissionToken(data.submissionToken)) {
    errors.submissionToken = "Please refresh this page and try again.";
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    data
  };
}

export function isSupplierSubmissionToken(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
