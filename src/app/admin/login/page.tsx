import { AdminLoginForm } from "@/components/AdminLoginForm";
import { adminAccessCookie, getAdminUserFromAccessToken } from "@/lib/adminAuth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Admin Login | Ghana Growers",
  description: "Secure Supabase Auth login for Ghana Growers administrators."
};

export default async function AdminLoginPage() {
  const currentAdmin = await getAdminUserFromAccessToken(cookies().get(adminAccessCookie)?.value);

  if (currentAdmin) {
    redirect("/admin");
  }

  return <AdminLoginForm />;
}
