import { PublicWorkflowClosed } from "@/components/PublicWorkflowClosed";
import { getPublicWorkflowState } from "@/lib/publicSubmissionAvailability";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Listing Submissions | Not Open Yet",
  description: "Public listing submissions are preserved but not open during Stage 1.",
  path: "/submit-listing"
});

export default function SubmitListingPage() {
  return <PublicWorkflowClosed eyebrow="STAGE 2 LISTINGS" title="Listing submissions are not open yet." state={getPublicWorkflowState("listing-submissions")} />;
}
