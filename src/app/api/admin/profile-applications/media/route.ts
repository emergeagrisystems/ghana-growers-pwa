import { NextResponse } from "next/server";
import { logAdminActivity } from "@/lib/adminActivity";
import { requireAdminUser } from "@/lib/adminAuth";
import { createPrivateApplicationMediaPreview, promoteApprovedApplicationImage } from "@/lib/profileApplications";
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
    action?: "preview" | "promote";
    profileId?: string;
    profileField?: "profile_image_url" | "farm_photo_urls" | "produce_photo_urls" | "logo_url";
    approved?: boolean;
  };
  if (!body.kind || !allowedKinds.has(body.kind) || !body.applicationId || !body.path) {
    return NextResponse.json({ error: "Application media details are required." }, { status: 400 });
  }

  if (body.action === "promote") {
    if (!body.profileId || !body.profileField || body.approved !== true) {
      return NextResponse.json({ error: "Profile, destination, and explicit image approval are required." }, { status: 400 });
    }
    const promotion = await promoteApprovedApplicationImage({
      kind: body.kind,
      applicationId: body.applicationId,
      sourcePath: body.path,
      profileId: body.profileId,
      profileField: body.profileField,
      approved: true
    });
    if (promotion.error) {
      console.error("Admin approved profile image promotion failed", {
        route: "/api/admin/profile-applications/media",
        feature: `${body.kind}_application_media_promotion`,
        code: promotion.status
      });
      return NextResponse.json({ error: promotion.error }, { status: promotion.status });
    }
    await logAdminActivity({
      adminEmail: adminUser.email,
      actionType: "Edit",
      entityType: body.kind === "farmer" ? "Farmer" : "Supplier",
      entityId: body.profileId,
      entityName: body.kind === "farmer" ? "Farmer profile media" : "Supplier profile media"
    });
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store, max-age=0" } });
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
