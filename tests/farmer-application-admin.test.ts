import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const repoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

test("Farmer Applications count, list and selection use the protected application response", () => {
  const dashboard = repoFile("src/components/AdminDashboard.tsx");
  const applications = repoFile("src/lib/applications.ts");

  assert.match(dashboard, /<FarmerApplicationsWorkspace[\s\S]*?applications=\{applications\.farmer\}/);
  assert.match(dashboard, /\["farmer", "Farmer Applications", applications\.farmer\.length\]/);
  assert.match(dashboard, /onClick=\{\(\) => setSelectedId\(application\.id\)\}/);
  assert.match(dashboard, /application\.application_reference \|\| "Reference unavailable"/);
  assert.match(applications, /farmer: "farmer_applications"/);
  assert.match(applications, /source_metadata\?\.application_reference/);
});

test("imported farmer review remains a separate, independently loaded workspace", () => {
  const dashboard = repoFile("src/components/AdminDashboard.tsx");

  assert.match(dashboard, /network-imported-farmers/);
  assert.match(dashboard, /Imported Farmers Pending Review/);
  assert.match(dashboard, /activeNavigationKey === "network-imported-farmers"/);
  assert.match(dashboard, /loadImportedFarmers/);
  assert.match(dashboard, /No imported farmer applications are waiting for review\./);
});

test("farmer application detail is protected, read-only on open, and keeps conversion explicit", () => {
  const dashboard = repoFile("src/components/AdminDashboard.tsx");
  const mediaRoute = repoFile("src/app/api/admin/profile-applications/media/route.ts");
  const applicationRoute = repoFile("src/app/api/admin/applications/route.ts");

  assert.match(dashboard, /Private contact information/);
  assert.match(dashboard, /Protected application media/);
  assert.match(dashboard, /Create Farmer Profile/);
  assert.match(dashboard, /onConvert\(selected\)/);
  assert.doesNotMatch(dashboard, /application_reference[^\n]*application\.id/);
  assert.match(mediaRoute, /requireAdminUser/);
  assert.match(applicationRoute, /requireAdminUser/);
  assert.match(applicationRoute, /export async function GET/);
  assert.match(applicationRoute, /export async function PATCH/);
});

test("private paths are used only for protected preview requests and are not rendered as labels", () => {
  const dashboard = repoFile("src/components/AdminDashboard.tsx");

  assert.match(dashboard, /applicationId: selected\.id, path: item\.path, action: "preview"/);
  assert.match(dashboard, /applicationId: selected\.id, path, action: "preview"/);
  assert.doesNotMatch(dashboard, />\{selected\.private_profile_image_path\}</);
  assert.doesNotMatch(dashboard, />\{path\}</);
});

test("protected media resolves Supabase relative signed paths through storage/v1", () => {
  const adminSource = repoFile("src/lib/supabase/admin.ts");

  assert.match(adminSource, /relativeSignedPath\.startsWith\("\/object\/"\)/);
  assert.match(adminSource, /`\/storage\/v1\$\{relativeSignedPath\}`/);
  assert.match(adminSource, /signedPath\.startsWith\("http"\) \? signedPath/);
});
