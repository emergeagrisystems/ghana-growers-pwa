import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/adminAuth";
import {
  cleanupFarmerProfileStaging,
  stageFarmerProfileImage,
  type FarmerProfileMediaTarget
} from "@/lib/farmerProfileMedia";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function noStore(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store, max-age=0" } });
}

export async function POST(request: Request) {
  const adminUser = await requireAdminUser(request);
  if (!adminUser) return noStore({ error: "Admin access required" }, 401);

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  const profileId = formData?.get("profileId");
  const target = formData?.get("target") as FarmerProfileMediaTarget | null;
  if (!(file instanceof File) || typeof profileId !== "string" || !target) {
    return noStore({ error: "Farmer profile, media target, and image are required." }, 400);
  }

  const result = await stageFarmerProfileImage({ profileId, target, file });
  if (result.error) {
    console.error("Admin farmer profile staging failed", {
      route: "/api/admin/profile-editor/media",
      feature: "farmer_profile_media_staging",
      code: result.status
    });
    return noStore({ error: result.error }, result.status);
  }
  return noStore({ path: result.path, previewUrl: result.previewUrl, target: result.target });
}

export async function DELETE(request: Request) {
  const adminUser = await requireAdminUser(request);
  if (!adminUser) return noStore({ error: "Admin access required" }, 401);

  const body = (await request.json().catch(() => ({}))) as { profileId?: string; paths?: string[] };
  if (!body.profileId || !Array.isArray(body.paths)) {
    return noStore({ error: "Farmer profile and staged paths are required." }, 400);
  }
  const result = await cleanupFarmerProfileStaging(body.profileId, body.paths);
  if (result.failed) {
    console.error("Admin farmer profile staging cleanup failed", {
      route: "/api/admin/profile-editor/media",
      feature: "farmer_profile_media_cleanup",
      code: result.status
    });
    return noStore({ error: "Some staged images could not be removed.", ...result }, result.status);
  }
  return noStore({ ok: true, ...result });
}
