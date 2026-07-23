import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { BrandLab, type BrandDirection } from "@/components/BrandLab";
import { adminAccessCookie, getAdminAuthorizationFromAccessToken } from "@/lib/adminAuth";
import { noIndexMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  ...noIndexMetadata,
  title: "Homepage Brand Lab",
  description: "Private Ghana Growers homepage and identity exploration."
};

const directions = new Set<BrandDirection>(["harvest", "growth", "market"]);

function selectedDirection(value?: string): BrandDirection {
  return value && directions.has(value as BrandDirection) ? (value as BrandDirection) : "harvest";
}

export default async function BrandLabPage({ searchParams }: { searchParams?: { direction?: string } }) {
  const isPreviewDeployment = process.env.VERCEL_ENV === "preview";

  if (!isPreviewDeployment) {
    const authorization = await getAdminAuthorizationFromAccessToken(cookies().get(adminAccessCookie)?.value);

    if (authorization.status === "unauthenticated") {
      redirect("/admin/login?next=%2Fbrand-lab");
    }

    if (authorization.status !== "authorized") {
      notFound();
    }
  }

  return <BrandLab direction={selectedDirection(searchParams?.direction)} />;
}
