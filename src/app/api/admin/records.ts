import { NextResponse } from "next/server";
import { hasValidAdminSession } from "@/lib/adminAuth";
import { insertSupabaseRecord, selectSupabaseRecords, updateSupabaseRecord } from "@/lib/supabase/admin";

export type AdminFormPayload = Record<string, string>;

type CreateRecordOptions = {
  request: Request;
  table: string;
  requiredFields: string[];
  mapPayload: (payload: AdminFormPayload) => Record<string, unknown> | Promise<Record<string, unknown>>;
};

type UpdateRecordOptions = {
  request: Request;
  table: string;
  requiredFields: string[];
  filterColumn?: "id" | "slug";
  mapPayload: (payload: AdminFormPayload) => Record<string, unknown> | Promise<Record<string, unknown>>;
};

type SlugRow = {
  slug: string | null;
};

const uniqueSlugMessage = "A record with this URL already exists. A unique URL has been generated automatically.";

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

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function recordFilter(recordId: string, filterColumn: "id" | "slug") {
  const column = filterColumn === "slug" && isUuid(recordId) ? "id" : filterColumn;
  return `${column}=eq.${encodeURIComponent(recordId)}`;
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

export function uniqueSlugAdminMessage() {
  return uniqueSlugMessage;
}

function isDuplicateSlugError(error: string) {
  const lower = error.toLowerCase();
  return (
    (lower.includes("duplicate") || lower.includes("unique constraint")) &&
    (lower.includes("slug") || lower.includes("_slug_key"))
  );
}

function friendlyAdminSaveError(error: string) {
  const lower = error.toLowerCase();

  if (lower.includes("supabase is not configured")) {
    return error;
  }

  if (lower.includes("violates") || lower.includes("constraint") || lower.includes("duplicate")) {
    return "Could not save this record because one of its fields conflicts with an existing record. Please review the form and try again.";
  }

  return "Could not save this record. Please check the fields and try again.";
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
  const adminError = typeof recordPayload.__adminError === "string" ? recordPayload.__adminError : undefined;
  const adminStatus = typeof recordPayload.__adminStatus === "number" ? recordPayload.__adminStatus : 500;
  const slugBaseValue = typeof recordPayload.__slugBaseValue === "string" ? recordPayload.__slugBaseValue : undefined;
  delete recordPayload.__adminMessage;
  delete recordPayload.__adminError;
  delete recordPayload.__adminStatus;
  delete recordPayload.__slugBaseValue;

  if (adminError) {
    return NextResponse.json({ error: adminError }, { status: adminStatus });
  }

  const insert = await insertSupabaseRecord(table, recordPayload);

  if (insert.error) {
    if (isDuplicateSlugError(insert.error) && slugBaseValue) {
      const uniqueSlug = await generateUniqueSlug(table, slugBaseValue);

      if (uniqueSlug.error) {
        return NextResponse.json(
          { error: "A record with this URL already exists. Please try saving again." },
          { status: uniqueSlug.status ?? 409 }
        );
      }

      const retryInsert = await insertSupabaseRecord(table, {
        ...recordPayload,
        slug: uniqueSlug.slug
      });

      if (!retryInsert.error) {
        return NextResponse.json(
          {
            ok: true,
            record: retryInsert.data,
            message: uniqueSlugMessage,
            slug: uniqueSlug.slug
          },
          { status: 201 }
        );
      }

      if (isDuplicateSlugError(retryInsert.error)) {
        return NextResponse.json(
          { error: "A record with this URL already exists. Please try saving again." },
          { status: 409 }
        );
      }

      return NextResponse.json({ error: friendlyAdminSaveError(retryInsert.error) }, { status: retryInsert.status });
    }

    if (isDuplicateSlugError(insert.error)) {
      return NextResponse.json(
        { error: "A record with this URL already exists. Please try saving again." },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: friendlyAdminSaveError(insert.error) }, { status: insert.status });
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

export async function updateRecord({ request, table, requiredFields, filterColumn = "id", mapPayload }: UpdateRecordOptions) {
  if (!hasValidAdminSession(request)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => ({}))) as AdminFormPayload;
  const recordId = payload.recordId?.trim();

  if (!recordId) {
    return NextResponse.json({ error: "Record ID is required." }, { status: 400 });
  }

  const missingField = requiredFields.find((field) => !payload[field]?.trim());

  if (missingField) {
    return NextResponse.json({ error: `${missingField} is required.` }, { status: 400 });
  }

  const recordPayload = await mapPayload(payload);
  const update = await updateSupabaseRecord(table, recordFilter(recordId, filterColumn), recordPayload);

  if (update.error) {
    return NextResponse.json({ error: friendlyAdminSaveError(update.error) }, { status: update.status });
  }

  return NextResponse.json({ ok: true, record: update.data }, { status: 200 });
}
