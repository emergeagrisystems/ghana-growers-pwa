import { createRecord, updateRecord } from "@/app/api/admin/records";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requiredFields = ["product", "region", "market", "wholesalePrice", "retailPrice", "dateUpdated", "trend"];

function mapMarketPricePayload(payload: Record<string, string>) {
  return {
    product: payload.product,
    region: payload.region,
    market: payload.market,
    wholesale_price: payload.wholesalePrice,
    retail_price: payload.retailPrice,
    currency: "GHS",
    date_updated: payload.dateUpdated,
    trend: payload.trend,
    status: "Active"
  };
}

export async function POST(request: Request) {
  return createRecord({
    request,
    table: "market_prices",
    requiredFields,
    mapPayload: mapMarketPricePayload
  });
}

export async function PATCH(request: Request) {
  return updateRecord({
    request,
    table: "market_prices",
    requiredFields,
    mapPayload: mapMarketPricePayload
  });
}
