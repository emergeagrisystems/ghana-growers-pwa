import { PublicWorkflowClosed } from "@/components/PublicWorkflowClosed";
import { getPublicWorkflowState } from "@/lib/publicSubmissionAvailability";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Supplier Registration | Not Open Yet",
  description: "Supplier and service registration is prepared but not public yet.",
  path: "/become-a-supplier"
});

export default function BecomeSupplierPage() {
  return <PublicWorkflowClosed eyebrow="SUPPLIER REGISTRATION" title="Supplier registration is not open yet." state={getPublicWorkflowState("supplier-registration")} />;
}
