import "server-only";

import type { AdminContactEnquiryRecord, ContactEnquiryType } from "@/lib/contactEnquiryContracts";
import { selectSupabaseRecords } from "@/lib/supabase/admin";

type ContactEnquiryRow = {
  public_reference: string;
  enquiry_type: ContactEnquiryType;
  name: string;
  email: string;
  phone_whatsapp: string | null;
  organisation: string | null;
  subject_interest: string | null;
  website: string | null;
  message: string;
  status: "New" | "Contacted" | "Closed";
  source_path: "/contact" | "/partner-with-us";
  created_at: string;
  updated_at: string;
};

export async function loadContactEnquiriesForAdmin(enquiryType?: ContactEnquiryType) {
  const typeFilter = enquiryType ? `&enquiry_type=eq.${encodeURIComponent(enquiryType)}` : "";
  const result = await selectSupabaseRecords<ContactEnquiryRow>(
    "contact_enquiries",
    `select=public_reference,enquiry_type,name,email,phone_whatsapp,organisation,subject_interest,website,message,status,source_path,created_at,updated_at${typeFilter}&order=created_at.desc&limit=250`
  );

  return {
    ...result,
    data: result.data?.map((row): AdminContactEnquiryRecord => ({
      reference: row.public_reference,
      enquiryType: row.enquiry_type,
      name: row.name,
      email: row.email,
      phone: row.phone_whatsapp,
      organisation: row.organisation,
      subject: row.subject_interest,
      website: row.website,
      message: row.message,
      status: row.status,
      sourcePath: row.source_path,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }))
  };
}
