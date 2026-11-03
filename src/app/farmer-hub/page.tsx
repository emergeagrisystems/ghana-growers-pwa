import { Suspense } from "react";
import { FarmTools } from "@/components/FarmTools";
import { foundationFont } from "@/components/homepage-foundation/font";
import { createPageMetadata } from "@/lib/seo";
import { getPreviewMamaPalette } from "@/lib/previewMamaPalette";
import paletteStyles from "./FarmerHubPalette.module.css";

export const metadata = createPageMetadata({
  title: "Ask Mama G",
  description: "Ask a farming question, check a crop photo and use Ghana Growers’ farm tools.",
  path: "/farmer-hub"
});

export default function FarmerHubPage({searchParams}: {searchParams: {mamaPalette?: string | string[]}}) {
  const mamaPalette = getPreviewMamaPalette(searchParams.mamaPalette);
  return <div className={foundationFont.className + " " + paletteStyles.paletteRoot} data-mama-palette={mamaPalette ?? undefined}>
    <Suspense fallback={<p role="status">Opening Ask Mama G…</p>}><FarmTools /></Suspense>
  </div>;
}
