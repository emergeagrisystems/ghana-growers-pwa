import { ServicePage } from "@/components/ServicePage";

export const metadata = {
  title: "For Farmers",
  description: "Sell produce, join the farmer network, and access buyers through Ghana Growers."
};

export default function FarmersServicePage() {
  return (
    <ServicePage
      eyebrow="Services for farmers"
      title="Sell produce and grow with better buyer access"
      description="Ghana Growers helps farmers and farmer groups present their supply, connect with buyers, learn best practices, and discover suppliers and support services."
      formAudience="farmer"
      whatsappMessage="Hello Ghana Growers, I want to join as a farmer."
      ctaHref="/join/farmer"
      ctaLabel="Join as a Farmer"
      points={[
        "Sell produce through a trusted marketplace structure.",
        "Join a farmer network by crop, region, and supply capacity.",
        "Get buyer access for market women, restaurants, hotels, shops, caterers, and households.",
        "Learn best practices for growing, harvesting, grading, packaging, and selling.",
        "Access suppliers for inputs, tools, equipment, packaging, logistics, and support."
      ]}
    />
  );
}
