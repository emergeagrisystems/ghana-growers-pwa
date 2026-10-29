import { AdminLoginForm } from "@/components/AdminLoginForm";
import { adminAccessCookie, getAdminUserFromAccessToken } from "@/lib/adminAuth";
import { safeAdminReturnPath } from "@/lib/previewAccess";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Admin Login | Ghana Growers",
  description: "Secure Supabase Auth login for Ghana Growers administrators."
};

function recoveryRedirectTo() {
  const branchUrl = process.env.VERCEL_ENV === "preview" ? process.env.VERCEL_BRANCH_URL?.trim() : undefined;
  if (branchUrl) {
    try {
      const candidate = new URL(`https://${branchUrl}/admin/reset-password`);
      if (candidate.hostname.endsWith(".vercel.app")) return candidate.href;
    } catch {
      // Fall through to the local/default origin below.
    }
  }

  return "http://localhost:3000/admin/reset-password";
}

export default async function AdminLoginPage({ searchParams }: { searchParams?: { next?: string | string[]; password?: string | string[] } }) {
  const requestedReturnPath = Array.isArray(searchParams?.next) ? searchParams?.next[0] : searchParams?.next;
  const returnTo = safeAdminReturnPath(requestedReturnPath);
  const currentAdmin = await getAdminUserFromAccessToken(cookies().get(adminAccessCookie)?.value);

  if (currentAdmin) {
    redirect(returnTo);
  }

  const passwordState = Array.isArray(searchParams?.password) ? searchParams?.password[0] : searchParams?.password;
  return <AdminLoginForm returnTo={returnTo} passwordUpdated={passwordState === "updated"} recoveryRedirectTo={recoveryRedirectTo()} />;
}
