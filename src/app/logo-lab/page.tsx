import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LogoLab } from "@/components/logo-lab/LogoLab";
import { adminAccessCookie, getAdminUserFromAccessToken } from "@/lib/adminAuth";
import { noIndexMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  ...noIndexMetadata,
  title: "Logo Identity Lab",
  description: "Private Ghana Growers logo identity exploration."
};

export default async function LogoLabPage() {
  const isVercelPreview = process.env.VERCEL_ENV === "preview";

  if (!isVercelPreview) {
    const currentAdmin = await getAdminUserFromAccessToken(cookies().get(adminAccessCookie)?.value);

    if (!currentAdmin) {
      redirect("/admin/login?next=/logo-lab");
    }
  }

  return <LogoLab />;
}
