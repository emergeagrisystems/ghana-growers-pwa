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

// RC1 has no identified receiver with tested receipt/failure evidence for these
// workflows. Reopening requires that evidence and an explicit release decision.
// This gate is deliberately not controlled by a browser or deployment variable.
export function isPublicSubmissionAvailable(_workflow: PublicSubmissionWorkflow): boolean {
  return false;
}

export const PUBLIC_SUBMISSION_UNAVAILABLE = "This service is currently unavailable. No information can be submitted here.";

export function publicSubmissionGate(workflow: PublicSubmissionWorkflow): Response | null {
  if (isPublicSubmissionAvailable(workflow)) return null;
  return Response.json({
    ok: false,
    code: "PUBLIC_SUBMISSION_UNAVAILABLE",
    message: PUBLIC_SUBMISSION_UNAVAILABLE,
    error: PUBLIC_SUBMISSION_UNAVAILABLE,
    errors: { form: PUBLIC_SUBMISSION_UNAVAILABLE }
  }, { status: 503, headers: { "Cache-Control": "no-store" } });
}
