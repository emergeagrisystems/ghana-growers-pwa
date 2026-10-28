export type PublicSubmissionWorkflow =
  | "farmer-registration"
  | "supplier-registration"
  | "buyer-registration"
  | "listing-submissions"
  | "buyer-request-submissions"
  | "lead-requests"
  | "contact-enquiries"
  | "featured-enquiries"
  | "waitlist"
  | "whatsapp-leads"
  | "farmmate-feedback"
  | "network-interest";

export type PublicWorkflowState = {
  workflow: PublicSubmissionWorkflow;
  available: boolean;
  publicLabel: string;
  publicMessage: string;
};

type IntakeControl =
  | "PUBLIC_INTAKE_FARMER_REGISTRATION_ENABLED"
  | "PUBLIC_INTAKE_SUPPLIER_REGISTRATION_ENABLED"
  | "PUBLIC_INTAKE_PRODUCT_LISTING_ENABLED"
  | "PUBLIC_INTAKE_BUYER_ENQUIRIES_ENABLED";

const intakeControlByWorkflow: Partial<Record<PublicSubmissionWorkflow, IntakeControl>> = {
  "farmer-registration": "PUBLIC_INTAKE_FARMER_REGISTRATION_ENABLED",
  "supplier-registration": "PUBLIC_INTAKE_SUPPLIER_REGISTRATION_ENABLED",
  "listing-submissions": "PUBLIC_INTAKE_PRODUCT_LISTING_ENABLED",
  "buyer-request-submissions": "PUBLIC_INTAKE_BUYER_ENQUIRIES_ENABLED",
  "lead-requests": "PUBLIC_INTAKE_BUYER_ENQUIRIES_ENABLED"
};

// One server-owned, default-closed authority controls both public copy and API
// availability. Each workflow remains independent so a later founder decision
// can open one without silently opening the others.
const workflowStates: Record<PublicSubmissionWorkflow, Omit<PublicWorkflowState, "workflow">> = {
  "farmer-registration": { available: false, publicLabel: "Farmer registration closed", publicMessage: "Farmer registration is not open yet." },
  "supplier-registration": { available: false, publicLabel: "Supplier registration closed", publicMessage: "Supplier and service registration is not open yet." },
  "buyer-registration": { available: false, publicLabel: "Buyer registration closed", publicMessage: "Buyer registration is not open." },
  "listing-submissions": { available: false, publicLabel: "Listing submissions closed", publicMessage: "Public listing submissions are not open yet." },
  "buyer-request-submissions": { available: false, publicLabel: "Buyer enquiries closed", publicMessage: "Managed buyer enquiries are not open yet." },
  "lead-requests": { available: false, publicLabel: "Managed enquiries closed", publicMessage: "Managed sourcing enquiries are not open yet." },
  "contact-enquiries": { available: false, publicLabel: "Contact form closed", publicMessage: "The public contact form is not open yet." },
  "featured-enquiries": { available: false, publicLabel: "Featured enquiries closed", publicMessage: "Featured enquiries are not open yet." },
  "waitlist": { available: false, publicLabel: "Waitlist closed", publicMessage: "The waitlist is not open." },
  "whatsapp-leads": { available: false, publicLabel: "WhatsApp leads closed", publicMessage: "WhatsApp lead capture is not open." },
  "farmmate-feedback": { available: false, publicLabel: "Feedback closed", publicMessage: "Public FarmMate feedback is not open." },
  "network-interest": { available: false, publicLabel: "Network interest closed", publicMessage: "Network interest submissions are not open." }
};

export function getPublicWorkflowState(workflow: PublicSubmissionWorkflow): PublicWorkflowState {
  const control = intakeControlByWorkflow[workflow];
  const available = control ? process.env[control]?.trim().toLowerCase() === "true" : false;
  return { workflow, ...workflowStates[workflow], available };
}

export function isPublicSubmissionAvailable(workflow: PublicSubmissionWorkflow): boolean {
  return getPublicWorkflowState(workflow).available;
}

export const PUBLIC_SUBMISSION_UNAVAILABLE = "This service is currently unavailable. No information can be submitted here.";

export function publicSubmissionGate(workflow: PublicSubmissionWorkflow): Response | null {
  const state = getPublicWorkflowState(workflow);
  if (state.available) return null;

  return Response.json({
    ok: false,
    code: "PUBLIC_SUBMISSION_UNAVAILABLE",
    message: state.publicMessage,
    error: state.publicMessage,
    errors: { form: state.publicMessage }
  }, { status: 503, headers: { "Cache-Control": "no-store" } });
}
