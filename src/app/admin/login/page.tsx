import { AdminLoginForm } from "@/components/AdminLoginForm";
import { adminAccessCookie, getAdminUserFromAccessToken } from "@/lib/adminAuth";
import { safeAdminReturnPath } from "@/lib/previewAccess";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Admin Login | Ghana Growers",
  description: "Secure Supabase Auth login for Ghana Growers administrators."
};

export default async function AdminLoginPage({ searchParams }: { searchParams?: { next?: string | string[] } }) {
  const requestedReturnPath = Array.isArray(searchParams?.next) ? searchParams?.next[0] : searchParams?.next;
  const returnTo = safeAdminReturnPath(requestedReturnPath);
  const currentAdmin = await getAdminUserFromAccessToken(cookies().get(adminAccessCookie)?.value);

  if (currentAdmin) {
    redirect(returnTo);
  }

  return <AdminLoginForm returnTo={returnTo} />;
}
