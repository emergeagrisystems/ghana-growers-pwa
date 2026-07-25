import { NextResponse } from "next/server";
import { logAdminActivity } from "@/lib/adminActivity";
import { profileEditorPayload, saveAdminProfile, transitionAdminProfile } from "@/lib/adminProfileEditor";
import { requireAdminUser } from "@/lib/adminAuth";
import {
  convertFarmerApplicationToProfile,
  convertSupplierApplicationToProfile
} from "@/lib/profileApplications";
import type { ProfileEditorKind, ProfileTransition } from "@/lib/profileEditorContracts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const kinds = new Set<ProfileEditorKind>(["farmer", "supplier"]);
const transitions = new Set<ProfileTransition>(["under-review", "verify", "launch-ready", "activate", "pause", "feature", "unfeature"]);

function noStore(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, {
    ...init,
    headers: { "Cache-Control": "no-store, max-age=0" }
  });
}

export async function GET(request: Request) {
  const adminUser = await requireAdminUser(request);
  if (!adminUser) return noStore({ error: "Admin access required" }, { status: 401 });

  const url = new URL(request.url);
  const kind = url.searchParams.get("kind") as ProfileEditorKind | null;
  const recordKey = url.searchParams.get("id")?.trim();
  if (!kind || !kinds.has(kind) || !recordKey) {
    return noStore({ error: "Profile type and record ID are required." }, { status: 400 });
  }

  const result = await profileEditorPayload(kind, recordKey);
  if (!("data" in result)) {
    console.error("Admin profile editor load failed", {
      route: "/api/admin/profile-editor",
      feature: `${kind}_profile_editor`,
      code: result.status
    });
    return noStore({ error: result.error ?? "Profile could not be loaded." }, { status: result.status });
  }
  return noStore(result.data);
}

export async function PATCH(request: Request) {
  const adminUser = await requireAdminUser(request);
  if (!adminUser) return noStore({ error: "Admin access required" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    kind?: ProfileEditorKind;
    id?: string;
    changes?: Record<string, unknown>;
  };
  if (!body.kind || !kinds.has(body.kind) || !body.id || !body.changes || typeof body.changes !== "object") {
    return noStore({ error: "Profile type, record ID, and changes are required." }, { status: 400 });
  }

  const result = await saveAdminProfile({
    kind: body.kind,
    recordKey: body.id,
    changes: body.changes,
    adminEmail: adminUser.email
  });
  if (!("data" in result)) {
    console.error("Admin profile editor save failed", {
      route: "/api/admin/profile-editor",
      feature: `${body.kind}_profile_editor`,
      code: result.status
    });
    return noStore({ error: result.error ?? "Profile changes could not be saved.", errors: "errors" in result ? result.errors : undefined }, { status: result.status });
  }
  return noStore(result.data);
}

export async function POST(request: Request) {
  const adminUser = await requireAdminUser(request);
  if (!adminUser) return noStore({ error: "Admin access required" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    action?: "transition" | "convert";
    kind?: ProfileEditorKind;
    id?: string;
    transition?: ProfileTransition;
  };
  if (!body.kind || !kinds.has(body.kind) || !body.id) {
    return noStore({ error: "Profile type and record ID are required." }, { status: 400 });
  }

  if (body.action === "convert") {
    const result = body.kind === "farmer"
      ? await convertFarmerApplicationToProfile(body.id)
      : await convertSupplierApplicationToProfile(body.id);
    if (!("profileId" in result) || !result.profileId) {
      console.error("Admin profile application conversion failed", {
        route: "/api/admin/profile-editor",
        feature: `${body.kind}_application_conversion`,
        code: result.status
      });
      return noStore({ error: "error" in result ? result.error : "Profile could not be created." }, { status: result.status });
    }
    await logAdminActivity({
      adminEmail: adminUser.email,
      actionType: "Convert",
      entityType: body.kind === "farmer" ? "Farmer Application" : "Supplier Application",
      entityId: body.id,
      entityName: `${body.kind === "farmer" ? "Farmer" : "Supplier"} application`
    });
    return noStore({ profileId: result.profileId, reused: result.reused === true });
  }

  if (body.action !== "transition" || !body.transition || !transitions.has(body.transition)) {
    return noStore({ error: "A valid protected profile transition is required." }, { status: 400 });
  }
  const result = await transitionAdminProfile({
    kind: body.kind,
    recordKey: body.id,
    transition: body.transition,
    adminEmail: adminUser.email
  });
  if (!("data" in result)) {
    return noStore({
      error: result.error ?? "Profile status could not be updated.",
      checks: "checks" in result ? result.checks : undefined
    }, { status: result.status });
  }
  return noStore(result.data);
}
