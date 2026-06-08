import { createRecord } from "@/app/api/admin/records";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return createRecord({
    request,
    table: "market_prices",
    requiredFields: ["product", "region", "market", "wholesalePrice", "retailPrice", "dateUpdated", "trend"],
    mapPayload: (payload) => ({
      product: payload.product,
      region: payload.region,
      market: payload.market,
      wholesale_price: payload.wholesalePrice,
      retail_price: payload.retailPrice,
      currency: "GHS",
      date_updated: payload.dateUpdated,
      trend: payload.trend,
      status: "Active"
    })
  });
}
