import { ServicePage } from "@/components/ServicePage";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "For Suppliers",
  description: "List agricultural products and services for farmers and buyers in Ghana.",
  path: "/services/suppliers"
});

export default function SuppliersServicePage() {
  return (
    <ServicePage
      eyebrow="Services for suppliers"
      title="Reach farmers and buyers who need agricultural support"
      description="Ghana Growers gives suppliers a practical channel to promote inputs, tools, equipment, packaging, transport, cold storage, and related services."
      formAudience="supplier"
      whatsappMessage="Hello Ghana Growers, I want to become a supplier."
      ctaHref="/supplier-registration"
      ctaLabel="Become a Supplier"
      extraCtas={[
        { href: "/supplier-directory", label: "View Supplier Directory", variant: "secondary" }
      ]}
      points={[
        "List agricultural products and services in a supplier-friendly marketplace.",
        "Reach farmers who need inputs, tools, equipment, and advisory support.",
        "Reach buyers who need packaging, logistics, cold storage, and handling services.",
        "Promote seeds, fertilizer, tools, crates, cartons, transport, cold storage, and more.",
        "Receive reviewed connection requests from people looking for agricultural products and services."
      ]}
    />
  );
}
