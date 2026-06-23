import { ServicePage } from "@/components/ServicePage";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "For Buyers",
  description: "Find trusted farmers, fresh produce, and bulk buying support through Ghana Growers.",
  path: "/services/buyers"
});

export default function BuyersServicePage() {
  return (
    <ServicePage
      eyebrow="Services for buyers"
      title="Find trusted farmers and fresh produce faster"
      description="Ghana Growers supports buyers who need reliable produce supply, bulk sourcing help, and reviewed connections to suitable farmers or suppliers."
      formAudience="buyer"
      whatsappMessage="Hello Ghana Growers, I want to join as a buyer."
      ctaHref="/join/buyer"
      ctaLabel="Join as a Buyer"
      extraCtas={[
        { href: "/farmer-directory", label: "Browse Farmer Directory", variant: "secondary" }
      ]}
      points={[
        "Find trusted farmers and farmer groups by produce category and location.",
        "Buy fresh produce for markets, restaurants, shops, hotels, caterers, and households.",
        "Request support for bulk buying and recurring supply needs.",
        "Submit clear buyer requests so Ghana Growers can review and route demand.",
        "Access supplier and logistics support for packaging, transport, and cold storage."
      ]}
    />
  );
}
