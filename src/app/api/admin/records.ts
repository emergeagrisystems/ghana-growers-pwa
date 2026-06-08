import { NextResponse } from "next/server";
import { hasValidAdminSession } from "@/lib/adminAuth";
import { insertSupabaseRecord } from "@/lib/supabase/admin";

export type AdminFormPayload = Record<string, string>;

type CreateRecordOptions = {
  request: Request;
  table: string;
  requiredFields: string[];
  mapPayload: (payload: AdminFormPayload) => Record<string, unknown>;
};

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function splitList(value?: string) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function createRecord({ request, table, requiredFields, mapPayload }: CreateRecordOptions) {
  if (!hasValidAdminSession(request)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => ({}))) as AdminFormPayload;
  const missingField = requiredFields.find((field) => !payload[field]?.trim());

  if (missingField) {
    return NextResponse.json({ error: `${missingField} is required.` }, { status: 400 });
  }

  const insert = await insertSupabaseRecord(table, mapPayload(payload));

  if (insert.error) {
    return NextResponse.json({ error: insert.error }, { status: insert.status });
  }

  return NextResponse.json({ ok: true, record: insert.data }, { status: 201 });
}
