import { ServicePage } from "@/components/ServicePage";

export const metadata = {
  title: "For Buyers",
  description: "Find trusted farmers, fresh produce, and bulk buying support through Ghana Growers."
};

export default function BuyersServicePage() {
  return (
    <ServicePage
      eyebrow="Services for buyers"
      title="Find trusted farmers and fresh produce faster"
      description="Ghana Growers supports buyers who need reliable produce supply, bulk sourcing help, and quick WhatsApp inquiries."
      formAudience="buyer"
      whatsappMessage="Hello Ghana Growers, I want to join as a buyer."
      points={[
        "Find trusted farmers and farmer groups by produce category and location.",
        "Buy fresh produce for markets, restaurants, shops, hotels, caterers, and households.",
        "Request support for bulk buying and recurring supply needs.",
        "Send WhatsApp ordering and inquiry messages instead of using checkout.",
        "Access supplier and logistics support for packaging, transport, and cold storage."
      ]}
    />
  );
}
