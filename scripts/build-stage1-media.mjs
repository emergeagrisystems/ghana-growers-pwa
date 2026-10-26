import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { basename, join, resolve } from "node:path";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const packageRoot = resolve(process.argv[2] ?? "");
if (!process.argv[2]) throw new Error("Pass the expanded Gate A media package directory.");

const repoRoot = resolve(import.meta.dirname, "..");
const outputRoot = join(repoRoot, "public", "stage1-media");
const provenancePath = join(repoRoot, "docs", "p09", "gate-a-media-provenance.json");
const manifest = JSON.parse(await readFile(join(packageRoot, "ASSET-MANIFEST.json"), "utf8"));

const sha256 = async (path) => createHash("sha256").update(await readFile(path)).digest("hex").toUpperCase();
const metadataMarker = async (path) => (await readFile(path)).includes(Buffer.from("hf-job-id"));

await mkdir(outputRoot, { recursive: true });
await mkdir(resolve(provenancePath, ".."), { recursive: true });

const derivatives = [];
async function convert({ asset, source, file, width, quality = 84 }) {
  const destination = join(outputRoot, file);
  await sharp(source).resize({ width, withoutEnlargement: true }).webp({ quality }).toFile(destination);
  const info = await sharp(destination).metadata();
  derivatives.push({
    asset_id: asset.asset_id,
    source_file: asset.original_file,
    source_sha256: asset.sha256,
    generation_id: asset.generation_id,
    derivative: `public/stage1-media/${file}`,
    derivative_sha256: await sha256(destination),
    width: info.width,
    height: info.height,
    format: info.format,
    hf_job_id_retained: await metadataMarker(destination),
    crop_authority: asset.crop,
    claim_boundary: asset.claim_boundary
  });
}

const byId = new Map(manifest.assets.map((asset) => [asset.asset_id, asset]));
const hero = byId.get("hero-clay-map");
const registration = byId.get("registration-r1");

for (const width of [640, 1088, 1600]) {
  await convert({
    asset: hero,
    source: join(packageRoot, hero.original_file),
    file: `hero-clay-map-${width}.webp`,
    width,
    quality: 88
  });
}

for (const width of [720, 1200, 1600]) {
  await convert({
    asset: registration,
    source: join(packageRoot, registration.original_file),
    file: `registration-r1-${width}.webp`,
    width,
    quality: 84
  });
}

const categoryAssets = [
  ["fresh-produce-f1", "fresh-produce"],
  ["grains-staples-g1", "grains-staples"],
  ["livestock-poultry-l1", "livestock-poultry"],
  ["seeds-inputs-i1", "inputs-supplies"],
  ["farm-equipment-tools-ea", "equipment-a-tools"]
];

for (const [assetId, stem] of categoryAssets) {
  const asset = byId.get(assetId);
  for (const [size, sourceName] of [[116, `${stem}-narrow-116.png`], [168, `${stem}-desktop-168.png`]]) {
    await convert({
      asset,
      source: join(packageRoot, "crops", sourceName),
      file: `${stem}-${size}.webp`,
      width: size,
      quality: 88
    });
  }
}

const videoSource = "C:\\Users\\lynne\\Downloads\\hf_20260911_164640_781ce448-a7be-4a65-bdb0-e948caab9991.mp4";
const videoDestination = join(outputRoot, "how-it-works-stage1.mp4");
await copyFile(videoSource, videoDestination);

const record = {
  schema_version: "1.0",
  package_id: manifest.package_id,
  package_zip: "ghana-growers-stage1-homepage-media-final-2026-10-26.zip",
  package_sha256: "885CEE95300D506AE164F7A55F1CF6752C05F5016515B638B16602759A049864",
  generated_at: new Date().toISOString(),
  processing: ["format_conversion", "compression", "responsive_resizing", "locked_crop_application"],
  original_public_files: [],
  metadata_note: "The original PNGs retain the provider hf-job-id marker. WebP conversion does not retain it; generation IDs and hashes are preserved here instead of fabricating replacement metadata.",
  derivatives,
  how_it_works_video: {
    source_file: basename(videoSource),
    source_sha256: await sha256(videoSource),
    public_file: "public/stage1-media/how-it-works-stage1.mp4",
    public_sha256: await sha256(videoDestination),
    generation_id: "781ce448-a7be-4a65-bdb0-e948caab9991",
    playback: { muted: true, autoplay: "when reduced motion is not requested", loop: false, replay_control: true }
  }
};

await writeFile(provenancePath, `${JSON.stringify(record, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ outputRoot, provenancePath, derivatives: derivatives.length }, null, 2));
