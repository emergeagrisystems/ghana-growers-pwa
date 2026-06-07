import { ServicePage } from "@/components/ServicePage";

export const metadata = {
  title: "For Suppliers",
  description: "List agricultural products and services for farmers and buyers in Ghana."
};

export default function SuppliersServicePage() {
  return (
    <ServicePage
      eyebrow="Services for suppliers"
      title="Reach farmers and buyers who need agricultural support"
      description="Ghana Growers gives suppliers a practical channel to promote inputs, tools, equipment, packaging, transport, cold storage, and related services."
      formAudience="supplier"
      whatsappMessage="Hello Ghana Growers, I want to become a supplier."
      ctaHref="/join/supplier"
      ctaLabel="Become a Supplier"
      points={[
        "List agricultural products and services in a supplier-friendly marketplace.",
        "Reach farmers who need inputs, tools, equipment, and advisory support.",
        "Reach buyers who need packaging, logistics, cold storage, and handling services.",
        "Promote seeds, fertilizer, tools, crates, cartons, transport, cold storage, and more.",
        "Use direct WhatsApp inquiries while advanced supplier accounts are added later."
      ]}
    />
  );
}
