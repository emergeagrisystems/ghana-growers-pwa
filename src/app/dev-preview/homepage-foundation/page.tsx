import type { Metadata } from "next";
import { HomepageFoundation } from "@/components/homepage-foundation/HomepageFoundation";

export const metadata: Metadata = {
  title: "Private foundation review",
  robots: { index: false, follow: false }
};

// Existing release middleware protects this child route in both launch modes.
export default function HomepageFoundationPage() {
  return <HomepageFoundation />;
}
