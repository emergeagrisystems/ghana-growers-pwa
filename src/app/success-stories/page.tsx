import { PageHero } from "@/components/PageHero";
import { SuccessStoriesSection } from "@/components/SuccessStoriesSection";
import { createPageMetadata } from "@/lib/seo";
import { getSuccessStoriesData } from "@/lib/supabase/publicData";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Success Stories",
  description:
    "Published Ghana Growers success stories from farmers, buyers, and suppliers as the agricultural network grows.",
  path: "/success-stories"
});

export default async function SuccessStoriesPage() {
  const stories = await getSuccessStoriesData();

  return (
    <>
      <PageHero
        eyebrow="Success Stories"
        title="Real outcomes from Ghana Growers members"
        description="This public section will feature published stories from farmers, buyers, and suppliers once verified outcomes are available."
      />
      <SuccessStoriesSection stories={stories} />
    </>
  );
}
