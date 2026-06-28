import SmartSolutionsPage from "@/app/smart-solutions/page";
import { createPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Farmer Hub",
  description:
    "Free weather updates, crop health checks, market prices, and practical farming advice for Ghanaian farmers.",
  path: "/farmer-hub"
});

export default SmartSolutionsPage;
