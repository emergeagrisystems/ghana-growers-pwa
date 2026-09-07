import "server-only";
import media from "./authorised-media.json";
// Kept out of public/static assets and client imports. Delivered only with the
// protected, non-production page. Source mapping: docs/p09/near-final-media-manifest.json.
export function getHomepagePreviewMedia() {
 if(process.env.VERCEL_ENV === "production") throw new Error("Preview media unavailable in Production");
 return media;
}
