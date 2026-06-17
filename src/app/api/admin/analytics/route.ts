import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/adminAuth";
import { selectSupabaseRecords } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function readTable<T extends Record<string, unknown>>(table: string, query: string) {
  const result = await selectSupabaseRecords<T>(table, query);

  return result.error ? [] : result.data ?? [];
}

export async function GET(request: Request) {
  const adminUser = await requireAdminUser(request);

  if (!adminUser) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  const [
    farmers,
    suppliers,
    marketplaceListings,
    buyerRequests,
    whatsappLeads,
    leadRequests,
    cropHealthReports,
    marketPrices
  ] = await Promise.all([
    readTable("farmers", "select=id,slug,farmer_name,farm_name,region,district,farm_type,farm_size,products,phone_number,whatsapp_number,verification_status,status,source,is_featured,featured_until,featured_note,created_at&limit=1000"),
    readTable("suppliers", "select=id,slug,company_name,category,region,district,verification_status,status,is_featured,featured_until,featured_note,created_at&limit=1000"),
    readTable("marketplace_listings", "select=id,slug,product_name,category,region,district,seller_name,seller_type,owner_type,owner_id,owner_name,whatsapp_number,status,availability,is_featured,featured_until,featured_note,created_at&limit=1000"),
    readTable("buyer_requests", "select=id,product_needed,region,district,buyer_name,buyer_type,whatsapp_number,status,verification_status&limit=1000"),
    readTable("whatsapp_leads", "select=id,source_type,source_id,source_name,created_at&order=created_at.desc&limit=1000"),
    readTable("lead_requests", "select=id,source_type,source_id,source_name,product_interest,status,created_at&order=created_at.desc&limit=1000"),
    readTable("crop_health_reports", "select=id,created_at&limit=1000"),
    readTable("market_prices", "select=id,product,region,market,trend&limit=1000")
  ]);

  return NextResponse.json({
    farmers,
    suppliers,
    marketplaceListings,
    buyerRequests,
    whatsappLeads,
    leadRequests,
    cropHealthReports,
    marketPrices
  });
}
