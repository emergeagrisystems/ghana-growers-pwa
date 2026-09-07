import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AmendedHomepage } from "@/components/homepage/AmendedHomepage";
import { getHomepagePreviewFixtures } from "./fixtures";
import { getHomepagePreviewMedia } from "./media";

export const metadata: Metadata = { title: "Amended homepage · Protected review", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

// Existing middleware verifies the signed preview grant in both launch modes.
// This additional guard prevents this fixture page from running on a Production deployment.
export default function AmendedHomepagePage({searchParams}: {searchParams: {fixture?: string | string[]}}) {
  if (process.env.VERCEL_ENV === "production") notFound();
  const scenario = typeof searchParams.fixture === "string" ? searchParams.fixture : undefined;
  return <AmendedHomepage data={getHomepagePreviewFixtures(scenario)} media={getHomepagePreviewMedia()} />;
}
