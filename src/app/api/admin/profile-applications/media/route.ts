import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/adminAuth";
import { createPrivateApplicationMediaPreview } from "@/lib/profileApplications";
import type { ProfileApplicationKind } from "@/lib/profileApplicationContracts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedKinds = new Set<ProfileApplicationKind>(["farmer", "supplier"]);

export async function POST(request: Request) {
  const adminUser = await requireAdminUser(request);
  if (!adminUser) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    kind?: ProfileApplicationKind;
    applicationId?: string;
    path?: string;
  };
  if (!body.kind || !allowedKinds.has(body.kind) || !body.applicationId || !body.path) {
    return NextResponse.json({ error: "Application media details are required." }, { status: 400 });
  }

  const preview = await createPrivateApplicationMediaPreview({
    kind: body.kind,
    applicationId: body.applicationId,
    path: body.path
  });
  if (preview.error || !preview.signedUrl) {
    console.error("Admin private application media preview failed", {
      route: "/api/admin/profile-applications/media",
      feature: `${body.kind}_application_media`,
      code: preview.status
    });
    return NextResponse.json({ error: "Private media preview is unavailable." }, { status: preview.status });
  }

  return NextResponse.json(
    { signedUrl: preview.signedUrl, expiresIn: 300 },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
