import { AdminListingSubmissionsWorkspace } from "@/components/AdminListingSubmissionsWorkspace";
import { adminAccessCookie, getAdminUserFromAccessToken } from "@/lib/adminAuth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Listing Submissions | Ghana Growers Admin",
  description: "Review public marketplace listing submissions before publication."
};

export default async function AdminListingSubmissionsPage() {
  const currentAdmin = await getAdminUserFromAccessToken(cookies().get(adminAccessCookie)?.value);

  if (!currentAdmin) {
    redirect("/admin/login");
  }

  return <AdminListingSubmissionsWorkspace currentAdmin={currentAdmin} />;
}
