import {MarketplacePreviewFrame} from "@/components/marketplace-preview/MarketplacePreviewFrame";
export default function NotFound(){if(process.env.VERCEL_ENV==="production")return null;return <MarketplacePreviewFrame><h1>Listing not found</h1><p>No listing is available at this address.</p><a href="/dev-preview/marketplace">Back to Marketplace</a></MarketplacePreviewFrame>;}
