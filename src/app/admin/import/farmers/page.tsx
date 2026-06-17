import { AdminDashboard } from "@/components/AdminDashboard";
import { adminAccessCookie, getAdminUserFromAccessToken } from "@/lib/adminAuth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Farmer Import | Ghana Growers Admin",
  description: "Protected Ghana Growers admin tool for importing Tally farmer submissions."
};

export default async function FarmerImportPage() {
  const currentAdmin = await getAdminUserFromAccessToken(cookies().get(adminAccessCookie)?.value);

  if (!currentAdmin) {
    redirect("/admin/login");
  }

  return (
    <AdminDashboard
      currentAdmin={currentAdmin}
      initialSection="farmer-import"
      sitePrelaunchActive={process.env.SITE_PRELAUNCH === "true"}
    />
  );
}
