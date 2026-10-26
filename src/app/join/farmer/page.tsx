import { PublicWorkflowClosed } from "@/components/PublicWorkflowClosed";
import { getPublicWorkflowState } from "@/lib/publicSubmissionAvailability";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Farmer Registration | Not Open Yet",
  description: "Farmer registration is prepared but not public yet.",
  path: "/join/farmer"
});

export default function JoinFarmerPage() {
  return <PublicWorkflowClosed eyebrow="FARMER REGISTRATION" title="Farmer registration is not open yet." state={getPublicWorkflowState("farmer-registration")} />;
}
