import { Stage1Homepage } from "@/components/homepage/Stage1Homepage";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Ghana Growers | Find Farms, Produce & Suppliers",
  description: "Find published farms and agricultural suppliers in Ghana, and get practical support from Mama G.",
  path: "/"
});

export default function HomePage() {
  return <Stage1Homepage />;
}
