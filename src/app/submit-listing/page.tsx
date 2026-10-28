import { SubmitProduceListingForm } from "@/components/SubmitProduceListingForm";
import { PublicWorkflowClosed } from "@/components/PublicWorkflowClosed";
import { getPublicWorkflowState } from "@/lib/publicSubmissionAvailability";
import { createPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = createPageMetadata({
  title: "List a Product",
  description: "Submit a private product listing for Ghana Growers to review. Submissions are not published automatically.",
  path: "/submit-listing"
});

export default function SubmitListingPage() {
  const state = getPublicWorkflowState("listing-submissions");
  if (!state.available) return <PublicWorkflowClosed eyebrow="PRODUCT LISTING" title="Listing submissions are not open yet." state={state} />;
  return (
    <div className="border-b border-leaf-900/10 bg-earth-50"><div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 sm:py-12 lg:grid-cols-[0.72fr_1.28fr] lg:px-8"><div><p className="gg-eyebrow">Private submission</p><h1 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-5xl">List a Product</h1><p className="mt-4 text-base leading-7 text-ink/70 sm:text-lg sm:leading-8">Tell Ghana Growers what you are selling. The submission stays private until manual review and cannot publish a Stage 2 Marketplace listing.</p></div><SubmitProduceListingForm /></div></div>
  );
}
