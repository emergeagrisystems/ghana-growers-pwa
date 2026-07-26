import "server-only";

import { createHash, randomUUID } from "crypto";
import { PROFILE_APPLICATION_MEDIA, validateApplicationMedia } from "@/lib/profileApplicationContracts";
import {
  createSupabaseStorageSignedUrl,
  deleteSupabaseStorageObject,
  downloadSupabaseStorageObject,
  uploadSupabaseStorageObject
} from "@/lib/supabase/admin";

export type FarmerProfileMediaTarget = "profile_image_url" | "farm_photo_urls" | "produce_photo_urls";

export type StagedFarmerProfileMedia = {
  path: string;
  target: FarmerProfileMediaTarget;
};

type PromotedFarmerProfileMedia = StagedFarmerProfileMedia & {
  publicPath: string;
  publicUrl: string;
};

const allowedTargets = new Set<FarmerProfileMediaTarget>(["profile_image_url", "farm_photo_urls", "produce_photo_urls"]);

function extensionForType(contentType: string) {
  return contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
}

function stagingPrefix(profileId: string) {
  return `editor-staging/${profileId}/`;
}

export function isOwnedFarmerProfileStagingPath(profileId: string, path: string) {
  return path.startsWith(stagingPrefix(profileId)) && !path.includes("..") && path.split("/").length === 3;
}

export function validStagedFarmerProfileMedia(profileId: string, item: StagedFarmerProfileMedia) {
  return allowedTargets.has(item.target) && isOwnedFarmerProfileStagingPath(profileId, item.path);
}

export async function stageFarmerProfileImage({
  profileId,
  target,
  file
}: {
  profileId: string;
  target: FarmerProfileMediaTarget;
  file: File;
}) {
  if (!allowedTargets.has(target)) return { status: 400, error: "Unsupported farmer media target." };
  const validation = validateApplicationMedia({ contentType: file.type, size: file.size, kind: "image" });
  if (!validation.ok) return { status: 400, error: "Upload a JPG, PNG, or WEBP image up to 5MB." };

  const path = `${stagingPrefix(profileId)}${randomUUID()}.${extensionForType(file.type)}`;
  const upload = await uploadSupabaseStorageObject({
    bucket: PROFILE_APPLICATION_MEDIA.farmer.bucket,
    path,
    contentType: file.type,
    body: await file.arrayBuffer(),
    publicUrl: false
  });
  if (upload.error || !upload.path) return { status: upload.status, error: "The image could not be staged securely." };

  const preview = await createSupabaseStorageSignedUrl({
    bucket: PROFILE_APPLICATION_MEDIA.farmer.bucket,
    path,
    expiresIn: 600
  });
  if (preview.error || !preview.signedUrl) {
    await deleteSupabaseStorageObject({ bucket: PROFILE_APPLICATION_MEDIA.farmer.bucket, path });
    return { status: preview.status, error: "The staged image preview could not be created." };
  }

  return { status: 200, path, previewUrl: preview.signedUrl, target };
}

export async function cleanupFarmerProfileStaging(profileId: string, paths: string[]) {
  const owned = Array.from(new Set(paths.filter((path) => isOwnedFarmerProfileStagingPath(profileId, path))));
  const results = await Promise.all(owned.map((path) => deleteSupabaseStorageObject({
    bucket: PROFILE_APPLICATION_MEDIA.farmer.bucket,
    path
  })));
  const failed = results.filter((result) => result.error).length;
  return { status: failed ? 502 : 200, deleted: owned.length - failed, failed };
}

export async function promoteStagedFarmerProfileMedia(profileId: string, items: StagedFarmerProfileMedia[]) {
  const uniqueItems = Array.from(new Map(items.map((item) => [`${item.target}:${item.path}`, item])).values());
  if (uniqueItems.some((item) => !validStagedFarmerProfileMedia(profileId, item))) {
    return { status: 400, error: "Invalid staged farmer media.", promoted: [] as PromotedFarmerProfileMedia[] };
  }

  const promoted: PromotedFarmerProfileMedia[] = [];
  for (const item of uniqueItems) {
    const source = await downloadSupabaseStorageObject({ bucket: PROFILE_APPLICATION_MEDIA.farmer.bucket, path: item.path });
    if (source.error || !source.body || !source.contentType) {
      await cleanupPromotedFarmerProfileMedia(promoted, false);
      return { status: source.status, error: "A staged farmer image could not be loaded.", promoted: [] as PromotedFarmerProfileMedia[] };
    }
    const validation = validateApplicationMedia({ contentType: source.contentType, size: source.body.byteLength, kind: "image" });
    if (!validation.ok) {
      await cleanupPromotedFarmerProfileMedia(promoted, false);
      return { status: 400, error: "Only reviewed image files can be saved.", promoted: [] as PromotedFarmerProfileMedia[] };
    }

    const sourceKey = createHash("sha256").update(item.path).digest("hex").slice(0, 20);
    const publicPath = `editor-uploads/${profileId}/${item.target}/${sourceKey}.${extensionForType(source.contentType)}`;
    const upload = await uploadSupabaseStorageObject({
      bucket: PROFILE_APPLICATION_MEDIA.farmer.publicBucket,
      path: publicPath,
      contentType: source.contentType,
      body: source.body,
      publicUrl: true
    });
    if (upload.error || !upload.publicUrl || !upload.path) {
      await cleanupPromotedFarmerProfileMedia(promoted, false);
      return { status: upload.status, error: "A staged farmer image could not be promoted.", promoted: [] as PromotedFarmerProfileMedia[] };
    }
    const verified = await downloadSupabaseStorageObject({
      bucket: PROFILE_APPLICATION_MEDIA.farmer.publicBucket,
      path: upload.path
    });
    const sourceDigest = createHash("sha256").update(Buffer.from(source.body)).digest("hex");
    const verifiedDigest = verified.body
      ? createHash("sha256").update(Buffer.from(verified.body)).digest("hex")
      : null;
    if (verified.error || verifiedDigest !== sourceDigest || verified.contentType !== source.contentType) {
      await deleteSupabaseStorageObject({ bucket: PROFILE_APPLICATION_MEDIA.farmer.publicBucket, path: upload.path });
      await cleanupPromotedFarmerProfileMedia(promoted, false);
      return { status: 502, error: "A staged farmer image copy could not be verified.", promoted: [] as PromotedFarmerProfileMedia[] };
    }
    promoted.push({ ...item, publicPath: upload.path, publicUrl: upload.publicUrl });
  }

  return { status: 200, promoted };
}

export async function cleanupPromotedFarmerProfileMedia(items: PromotedFarmerProfileMedia[], includeStaging = true) {
  const publicResults = await Promise.all(items.map((item) => deleteSupabaseStorageObject({
    bucket: PROFILE_APPLICATION_MEDIA.farmer.publicBucket,
    path: item.publicPath
  })));
  const staging = includeStaging
    ? await cleanupFarmerProfileStaging(items[0]?.path.split("/")[1] ?? "", items.map((item) => item.path))
    : { failed: 0 };
  return { failed: publicResults.filter((result) => result.error).length + staging.failed };
}

export async function finalizeFarmerProfileStaging(profileId: string, items: PromotedFarmerProfileMedia[]) {
  return cleanupFarmerProfileStaging(profileId, items.map((item) => item.path));
}
