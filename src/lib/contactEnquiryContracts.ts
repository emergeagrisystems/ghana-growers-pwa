export type ContactEnquiryType = "Contact" | "Partnership";

export type ContactEnquiryPayload = {
  enquiryType: ContactEnquiryType;
  name: string;
  email: string;
  phone: string;
  organisation: string;
  subject: string;
  website: string;
  message: string;
  submissionToken: string;
};

export type ContactEnquiryField = keyof ContactEnquiryPayload | "form";

export type ContactEnquiryValidation = {
  ok: boolean;
  errors: Partial<Record<ContactEnquiryField, string>>;
  data?: ContactEnquiryPayload;
};

export type AdminContactEnquiryRecord = {
  reference: string;
  enquiryType: ContactEnquiryType;
  name: string;
  email: string;
  phone: string | null;
  organisation: string | null;
  subject: string | null;
  website: string | null;
  message: string;
  status: "New" | "Contacted" | "Closed";
  sourcePath: "/contact" | "/partner-with-us";
  createdAt: string;
  updatedAt: string;
};

const maxLengths: Partial<Record<keyof ContactEnquiryPayload, number>> = {
  name: 120,
  email: 254,
  phone: 40,
  organisation: 180,
  subject: 180,
  website: 300,
  message: 3000
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function isContactEnquirySubmissionToken(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function validateContactEnquiry(input: Record<string, unknown>): ContactEnquiryValidation {
  const data: ContactEnquiryPayload = {
    enquiryType: clean(input.enquiryType) as ContactEnquiryType,
    name: clean(input.name),
    email: clean(input.email),
    phone: clean(input.phone),
    organisation: clean(input.organisation),
    subject: clean(input.subject),
    website: clean(input.website),
    message: clean(input.message),
    submissionToken: clean(input.submissionToken)
  };
  const errors: ContactEnquiryValidation["errors"] = {};

  if (!(["Contact", "Partnership"] as string[]).includes(data.enquiryType)) {
    errors.enquiryType = "Choose a valid enquiry type.";
  }
  if (!data.name) errors.name = "Enter your name.";
  if (!data.email) {
    errors.email = "Enter your email address.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (!data.message) errors.message = "Enter your message.";
  if (data.phone) {
    const digits = data.phone.replace(/\D/g, "");
    if (digits.length < 7 || digits.length > 15) errors.phone = "Enter a valid phone or WhatsApp number.";
  }
  if (data.enquiryType === "Partnership") {
    if (!data.organisation) errors.organisation = "Enter your organisation name.";
    if (!data.subject) errors.subject = "Tell us your partnership interest.";
  }
  if (data.website && !/^https?:\/\/[^\s]+$/i.test(data.website)) {
    errors.website = "Enter a complete website address beginning with http:// or https://.";
  }
  if (!isContactEnquirySubmissionToken(data.submissionToken)) {
    errors.form = "Please refresh this page and try again.";
  }

  for (const [field, maxLength] of Object.entries(maxLengths) as Array<[keyof ContactEnquiryPayload, number]>) {
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
