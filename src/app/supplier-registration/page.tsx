import JoinSupplierPage from "@/app/join/supplier/page";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Supplier Registration",
  description:
    "Register as a Ghana Growers supplier to reach farmers, buyers, and agricultural businesses across Ghana.",
  path: "/supplier-registration"
});

export default function SupplierRegistrationPage() {
  return <JoinSupplierPage />;
}
