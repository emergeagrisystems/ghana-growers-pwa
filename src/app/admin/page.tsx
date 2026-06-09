import { AdminDashboard } from "@/components/AdminDashboard";
import { adminAccessCookie, getAdminUserFromAccessToken } from "@/lib/adminAuth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Admin Dashboard | Ghana Growers",
  description: "Protected Ghana Growers admin dashboard for managing platform content and operational records."
};

export default async function AdminPage() {
  const currentAdmin = await getAdminUserFromAccessToken(cookies().get(adminAccessCookie)?.value);

  if (!currentAdmin) {
    redirect("/admin/login");
  }

  return <AdminDashboard currentAdmin={currentAdmin} />;
}
