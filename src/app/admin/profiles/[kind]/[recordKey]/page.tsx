import { AdminProfileEditor } from "@/components/AdminProfileEditor";
import { adminAccessCookie, getAdminUserFromAccessToken } from "@/lib/adminAuth";
import type { ProfileEditorKind } from "@/lib/profileEditorContracts";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Profile Editor | Ghana Growers Admin",
  description: "Protected Ghana Growers farmer and supplier profile editor."
};

export default async function AdminProfileEditorPage({
  params
}: {
  params: { kind: string; recordKey: string };
}) {
  const currentAdmin = await getAdminUserFromAccessToken(cookies().get(adminAccessCookie)?.value);
  if (!currentAdmin) redirect("/admin/login");
  if (params.kind !== "farmer" && params.kind !== "supplier") notFound();

  return (
    <AdminProfileEditor
      kind={params.kind as ProfileEditorKind}
      recordKey={decodeURIComponent(params.recordKey)}
      currentAdmin={currentAdmin}
    />
  );
}
