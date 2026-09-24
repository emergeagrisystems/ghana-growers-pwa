import { AdminDashboard } from "@/components/AdminDashboard";
import { adminAccessCookie, getAdminUserFromAccessToken } from "@/lib/adminAuth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Launch Checklist | Ghana Growers Admin",
  description: "Protected Ghana Growers launch readiness checklist for farmer, buyer, and supplier onboarding."
};

export default async function AdminLaunchChecklistPage() {
  const currentAdmin = await getAdminUserFromAccessToken(cookies().get(adminAccessCookie)?.value);

  if (!currentAdmin) {
    redirect("/admin/login");
  }

  return (
    <AdminDashboard
      currentAdmin={currentAdmin}
      initialSection="launch-checklist"
      sitePrelaunchActive={process.env.SITE_PRELAUNCH === "true"}
    />
  );
}
