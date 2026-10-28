import { CheckCircle2 } from "lucide-react";
import { FarmerRegistrationForm } from "@/components/FarmerRegistrationForm";
import { PublicWorkflowClosed } from "@/components/PublicWorkflowClosed";
import { getPublicWorkflowState } from "@/lib/publicSubmissionAvailability";
import { createPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = createPageMetadata({
  title: "Register Your Farm",
  description: "Submit a private farmer application for Ghana Growers to review. Registration does not publish a public profile automatically.",
  path: "/join/farmer"
});

export default function JoinFarmerPage() {
  const state = getPublicWorkflowState("farmer-registration");
  if (!state.available) return <PublicWorkflowClosed eyebrow="FARMER REGISTRATION" title="Farmer registration is not open yet." state={state} />;
  return (
    <div className="bg-white py-12 sm:py-16 lg:py-20">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.65fr_1.35fr] lg:items-start lg:px-8">
        <aside className="rounded-md border border-earth-500/20 bg-ivory p-5 sm:p-6 lg:sticky lg:top-24">
          <p className="gg-eyebrow">Before you submit</p>
          <h1 className="mt-3 text-3xl font-black text-ink">Register your farm</h1>
          <div className="mt-5 grid gap-3">
            {["Manual review before any public profile", "Needs Information follow-up where required", "Private contact details and documents", "No guarantee of approval, buyers, sales or publication"].map((item) => <div key={item} className="flex items-start gap-3"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-leaf-700" aria-hidden="true" /><p className="text-sm leading-6 text-ink/68">{item}</p></div>)}
          </div>
        </aside>
        <FarmerRegistrationForm />
      </div>
    </div>
  );
}
