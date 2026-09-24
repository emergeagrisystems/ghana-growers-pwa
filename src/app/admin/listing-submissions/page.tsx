import { AdminListingSubmissionsWorkspace } from "@/components/AdminListingSubmissionsWorkspace";
import { adminAccessCookie, getAdminUserFromAccessToken } from "@/lib/adminAuth";
import { getPublicListingSubmissions } from "@/lib/publicSubmissions";
import { unstable_noStore as noStore } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Listing Submissions | Ghana Growers Admin",
  description: "Review public marketplace listing submissions before publication."
};

export default async function AdminListingSubmissionsPage() {
  noStore();

  const currentAdmin = await getAdminUserFromAccessToken(cookies().get(adminAccessCookie)?.value);

  if (!currentAdmin) {
    redirect("/admin/login");
  }

  const submissions = await getPublicListingSubmissions();

  return (
    <AdminListingSubmissionsWorkspace
      currentAdmin={currentAdmin}
      initialError={submissions.error ?? ""}
      initialSubmissions={submissions.listings}
    />
  );
}
