import { NextResponse } from "next/server";
import { hasValidAdminSession } from "@/lib/adminAuth";
import { insertSupabaseRecord, selectSupabaseRecords } from "@/lib/supabase/admin";

export type AdminFormPayload = Record<string, string>;

type CreateRecordOptions = {
  request: Request;
  table: string;
  requiredFields: string[];
  mapPayload: (payload: AdminFormPayload) => Record<string, unknown> | Promise<Record<string, unknown>>;
};

type SlugRow = {
  slug: string | null;
};

export function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "record";
}

export function splitList(value?: string) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function generateUniqueSlug(table: string, baseValue: string) {
  const baseSlug = slugify(baseValue);
  const query = `select=slug&slug=like.${encodeURIComponent(`${baseSlug}%`)}`;
  const existing = await selectSupabaseRecords<SlugRow>(table, query);

  if (existing.error) {
    return {
      slug: baseSlug,
      wasChanged: false,
      error: existing.error,
      status: existing.status
    };
  }

  const matchingPattern = new RegExp(`^${escapeRegExp(baseSlug)}(?:-(\\d+))?$`);
  const existingSlugs = new Set(
    (existing.data ?? [])
      .map((row) => row.slug)
      .filter((slug): slug is string => Boolean(slug && matchingPattern.test(slug)))
  );

  if (!existingSlugs.has(baseSlug)) {
    return { slug: baseSlug, wasChanged: false };
  }

  let suffix = 2;
  while (existingSlugs.has(`${baseSlug}-${suffix}`)) {
    suffix += 1;
  }

  return { slug: `${baseSlug}-${suffix}`, wasChanged: true };
}

function isDuplicateSlugError(error: string) {
  const lower = error.toLowerCase();
  return lower.includes("duplicate") && lower.includes("slug");
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

  const recordPayload = await mapPayload(payload);
  const adminMessage = typeof recordPayload.__adminMessage === "string" ? recordPayload.__adminMessage : undefined;
  delete recordPayload.__adminMessage;
  const insert = await insertSupabaseRecord(table, recordPayload);

  if (insert.error) {
    if (isDuplicateSlugError(insert.error)) {
      return NextResponse.json(
        { error: "A record with this URL already exists. A unique URL has been generated automatically. Please submit the form again." },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: insert.error }, { status: insert.status });
  }

  return NextResponse.json(
    {
      ok: true,
      record: insert.data,
      message: adminMessage,
      slug: recordPayload.slug
    },
    { status: 201 }
  );
}
