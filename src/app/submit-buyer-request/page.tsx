import { PublicWorkflowClosed } from "@/components/PublicWorkflowClosed";
import { getPublicWorkflowState } from "@/lib/publicSubmissionAvailability";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Managed Buyer Enquiries | Not Open Yet",
  description: "Managed buyer enquiries are prepared but not public yet.",
  path: "/submit-buyer-request"
});

export default function SubmitBuyerRequestPage() {
  return <PublicWorkflowClosed eyebrow="MANAGED BUYER ENQUIRIES" title="Managed enquiries are not open yet." state={getPublicWorkflowState("lead-requests")} />;
}
