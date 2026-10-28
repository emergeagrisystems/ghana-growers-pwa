import { SubmitBuyerRequestForm } from "@/components/SubmitBuyerRequestForm";
import { PublicWorkflowClosed } from "@/components/PublicWorkflowClosed";
import { getPublicWorkflowState } from "@/lib/publicSubmissionAvailability";
import { createPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = createPageMetadata({
  title: "Request Product",
  description: "Send a private product sourcing request for Ghana Growers to review.",
  path: "/submit-buyer-request"
});

export default function SubmitBuyerRequestPage() {
  const state = getPublicWorkflowState("buyer-request-submissions");
  if (!state.available) return <PublicWorkflowClosed eyebrow="MANAGED BUYER ENQUIRIES" title="Managed enquiries are not open yet." state={state} />;
  return (
    <div className="border-b border-leaf-900/10 bg-white"><div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.84fr_1.16fr] lg:px-8 lg:py-12"><div><p className="gg-eyebrow">Managed buyer enquiry</p><h1 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-5xl">Request Product</h1><p className="mt-4 max-w-2xl text-base leading-7 text-ink/70 sm:text-lg sm:leading-8">Tell Ghana Growers what you need. We aim to acknowledge requests within two Ghana business days, but cannot guarantee stock, sourcing or a buyer-seller connection.</p></div><SubmitBuyerRequestForm /></div></div>
  );
}
