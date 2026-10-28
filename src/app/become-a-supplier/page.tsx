import { SupplierOnboardingForm } from "@/components/SupplierOnboardingForm";
import { PublicWorkflowClosed } from "@/components/PublicWorkflowClosed";
import { getPublicWorkflowState } from "@/lib/publicSubmissionAvailability";
import { createPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = createPageMetadata({
  title: "Apply to Join as a Supplier",
  description: "Submit a private supplier or agricultural-service application for Ghana Growers to review.",
  path: "/become-a-supplier"
});

export default function BecomeSupplierPage() {
  const state = getPublicWorkflowState("supplier-registration");
  if (!state.available) return <PublicWorkflowClosed eyebrow="SUPPLIER REGISTRATION" title="Supplier registration is not open yet." state={state} />;
  return (
    <div className="bg-white py-12 sm:py-16 lg:py-20">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.7fr_1.3fr] lg:items-start lg:px-8">
        <aside className="rounded-2xl bg-ivory p-6 ring-1 ring-earth-500/25 lg:sticky lg:top-24"><p className="gg-eyebrow">Supplier application</p><h1 className="mt-3 text-3xl font-black text-ink">Apply to join as a supplier</h1><p className="mt-4 text-sm leading-6 text-ink/68">Applications are reviewed manually. Submitting does not publish a supplier profile or guarantee approval.</p></aside>
        <SupplierOnboardingForm />
      </div>
    </div>
  );
}
