import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/adminAuth";
import { logAdminActivity, type AdminEntityType } from "@/lib/adminActivity";
import { insertSupabaseRecord, selectSupabaseRecords, updateSupabaseRecord } from "@/lib/supabase/admin";

export type AdminFormPayload = Record<string, string>;

type CreateRecordOptions = {
  request: Request;
  table: string;
  requiredFields: string[];
  mapPayload: (payload: AdminFormPayload) => Record<string, unknown> | Promise<Record<string, unknown>>;
  activity?: {
    entityType: AdminEntityType;
    entityName: (payload: AdminFormPayload, record?: unknown) => string;
  };
};

type UpdateRecordOptions = {
  request: Request;
  table: string;
  requiredFields: string[];
  filterColumn?: "id" | "slug";
  mapPayload: (payload: AdminFormPayload) => Record<string, unknown> | Promise<Record<string, unknown>>;
  activity?: {
    entityType: AdminEntityType;
    entityName: (payload: AdminFormPayload, record?: unknown) => string;
  };
};

type AdminSaveContext = {
  operation: "create" | "update";
  table: string;
  payloadKeys?: string[];
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

function migrationHintForError(error: string, table: string) {
  const lower = error.toLowerCase();
  const columnMatches = [
    { column: "owner_type", migration: "014_marketplace_listing_ownership.sql" },
    { column: "owner_id", migration: "014_marketplace_listing_ownership.sql" },
    { column: "owner_name", migration: "014_marketplace_listing_ownership.sql" },
    { column: "internal_operations_notes", migration: "026_marketplace_listing_internal_notes.sql" },
    { column: "image_urls", migration: "027_marketplace_listing_gallery.sql" },
    { column: "selling_method", migration: "031_marketplace_trade_fields.sql" },
    { column: "selling_unit", migration: "031_marketplace_trade_fields.sql" },
    { column: "custom_unit_label", migration: "031_marketplace_trade_fields.sql" },
    { column: "custom_unit_reviewed", migration: "031_marketplace_trade_fields.sql" },
    { column: "unit_size_value", migration: "031_marketplace_trade_fields.sql" },
    { column: "unit_size_measure", migration: "031_marketplace_trade_fields.sql" },
    { column: "unit_size_approximate", migration: "031_marketplace_trade_fields.sql" },
    { column: "price_amount", migration: "031_marketplace_trade_fields.sql" },
    { column: "price_currency", migration: "031_marketplace_trade_fields.sql" },
    { column: "price_basis", migration: "031_marketplace_trade_fields.sql" },
    { column: "units_available", migration: "031_marketplace_trade_fields.sql" },
    { column: "total_quantity_value", migration: "031_marketplace_trade_fields.sql" },
    { column: "total_quantity_measure", migration: "031_marketplace_trade_fields.sql" },
    { column: "minimum_order_value", migration: "031_marketplace_trade_fields.sql" },
    { column: "minimum_order_unit", migration: "031_marketplace_trade_fields.sql" },
    { column: "supply_frequency", migration: "031_marketplace_trade_fields.sql" },
    { column: "available_from_date", migration: "031_marketplace_trade_fields.sql" },
    { column: "grade_description", migration: "031_marketplace_trade_fields.sql" },
    { column: "delivery_details", migration: "031_marketplace_trade_fields.sql" },
    { column: "record_source", migration: "031_marketplace_trade_fields.sql" },
    { column: "is_featured", migration: "018_featured_memberships.sql" },
    { column: "featured_until", migration: "018_featured_memberships.sql" },
    { column: "featured_note", migration: "018_featured_memberships.sql" },
    { column: "farm_photo_urls", migration: "028_farmer_tally_media_fields.sql" },
    { column: "produce_photo_urls", migration: "028_farmer_tally_media_fields.sql" },
    { column: "document_urls", migration: "028_farmer_tally_media_fields.sql" },
    { column: "tally_file_references", migration: "028_farmer_tally_media_fields.sql" }
  ];
  const match = columnMatches.find((item) => lower.includes(item.column));

  if (!match) {
    return "";
  }

  return `Apply migration ${match.migration}${table ? ` for ${table}` : ""}.`;
}

function classifyAdminSaveError(error: string, status: number, context: AdminSaveContext) {
  const lower = error.toLowerCase();
  const migrationHint = migrationHintForError(error, context.table);

  if (lower.includes("supabase is not configured")) {
    return {
      category: "Supabase unavailable",
      message: error,
      diagnostic: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY on the server."
    };
  }

  if (
    lower.includes("could not find") && lower.includes("column") ||
    lower.includes("column") && lower.includes("does not exist") ||
    lower.includes("schema cache")
  ) {
    return {
      category: "Database migration missing",
      message: `Database migration missing. ${migrationHint || "A required database column is missing."}`,
      diagnostic: error
    };
  }

  if (lower.includes("relation") && lower.includes("does not exist")) {
    return {
      category: "Database migration missing",
      message: "Database migration missing. The required table does not exist in Supabase.",
      diagnostic: error
    };
  }

  if (lower.includes("permission denied") || lower.includes("row-level") || lower.includes("rls") || lower.includes("policy")) {
    return {
      category: "Permission denied",
      message: "Permission denied. Check Supabase table permissions, RLS policies, and service role configuration.",
      diagnostic: error
    };
  }

  if (lower.includes("violates") || lower.includes("constraint") || lower.includes("duplicate")) {
    return {
      category: "Validation failed",
      message: "Could not save this record because one of its fields conflicts with an existing record.",
      diagnostic: error
    };
  }

  if (status >= 500) {
    return {
      category: "Unknown server error",
      message: "Unknown server error while saving this record.",
      diagnostic: error || `Supabase returned HTTP ${status}.`
    };
  }

  return {
    category: "Supabase save failed",
    message: "Could not save this record.",
    diagnostic: error || `Supabase returned HTTP ${status}.`
  };
}

function adminSaveErrorResponse(error: string, status: number, context: AdminSaveContext) {
  const classified = classifyAdminSaveError(error, status, context);

  console.error("[Admin Save Error]", {
    ...context,
    status,
    category: classified.category,
    error
  });

  return NextResponse.json(
    {
      error: classified.message,
      category: classified.category,
      diagnostic: classified.diagnostic,
      table: context.table,
      operation: context.operation
    },
    { status }
  );
}

function recordIdentifier(record: unknown, fallback?: unknown) {
  if (record && typeof record === "object") {
    const values = record as Record<string, unknown>;
    const slug = values.slug;
    const id = values.id;

    if (typeof slug === "string" && slug) {
      return slug;
    }

    if (typeof id === "string" && id) {
      return id;
    }
  }

  return typeof fallback === "string" ? fallback : null;
}

async function writeActivity({
  adminEmail,
  actionType,
  activity,
  payload,
  record,
  fallbackId
}: {
  adminEmail: string;
  actionType: "Create" | "Edit";
  activity?: CreateRecordOptions["activity"];
  payload: AdminFormPayload;
  record?: unknown;
  fallbackId?: unknown;
}) {
  if (!activity) {
    return;
  }

  await logAdminActivity({
    adminEmail,
    actionType,
    entityType: activity.entityType,
    entityId: recordIdentifier(record, fallbackId),
    entityName: activity.entityName(payload, record)
  });
}

export async function createRecord({ request, table, requiredFields, mapPayload, activity }: CreateRecordOptions) {
  const adminUser = await requireAdminUser(request);

  if (!adminUser) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => ({}))) as AdminFormPayload;
  const missingField = requiredFields.find((field) => !payload[field]?.trim());

  if (missingField) {
    return NextResponse.json(
      {
        error: `${missingField} is required.`,
        category: "Required field missing",
        diagnostic: `Required payload field "${missingField}" was empty.`,
        table,
        operation: "create"
      },
      { status: 400 }
    );
  }

  let recordPayload: Record<string, unknown>;

  try {
    recordPayload = await mapPayload(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not prepare the record for saving.";
    return adminSaveErrorResponse(message, 500, {
      operation: "create",
      table,
      payloadKeys: Object.keys(payload)
    });
  }
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
        await writeActivity({
          adminEmail: adminUser.email,
          actionType: "Create",
          activity,
          payload,
          record: retryInsert.data,
          fallbackId: uniqueSlug.slug
        });

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

      return adminSaveErrorResponse(retryInsert.error, retryInsert.status, {
        operation: "create",
        table,
        payloadKeys: Object.keys(recordPayload)
      });
    }

    if (isDuplicateSlugError(insert.error)) {
      return NextResponse.json(
        { error: "A record with this URL already exists. Please try saving again." },
        { status: 409 }
      );
    }

    return adminSaveErrorResponse(insert.error, insert.status, {
      operation: "create",
      table,
      payloadKeys: Object.keys(recordPayload)
    });
  }

  await writeActivity({
    adminEmail: adminUser.email,
    actionType: "Create",
    activity,
    payload,
    record: insert.data,
    fallbackId: recordPayload.slug
  });

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

export async function updateRecord({ request, table, requiredFields, filterColumn = "id", mapPayload, activity }: UpdateRecordOptions) {
  const adminUser = await requireAdminUser(request);

  if (!adminUser) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => ({}))) as AdminFormPayload;
  const recordId = payload.recordId?.trim();

  if (!recordId) {
    return NextResponse.json({ error: "Record ID is required." }, { status: 400 });
  }

  const missingField = requiredFields.find((field) => !payload[field]?.trim());

  if (missingField) {
    return NextResponse.json(
      {
        error: `${missingField} is required.`,
        category: "Required field missing",
        diagnostic: `Required payload field "${missingField}" was empty.`,
        table,
        operation: "update"
      },
      { status: 400 }
    );
  }

  let recordPayload: Record<string, unknown>;

  try {
    recordPayload = await mapPayload(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not prepare the record for saving.";
    return adminSaveErrorResponse(message, 500, {
      operation: "update",
      table,
      payloadKeys: Object.keys(payload)
    });
  }
  const adminError = typeof recordPayload.__adminError === "string" ? recordPayload.__adminError : undefined;
  const adminStatus = typeof recordPayload.__adminStatus === "number" ? recordPayload.__adminStatus : 500;
  delete recordPayload.__adminError;
  delete recordPayload.__adminStatus;

  if (adminError) {
    return NextResponse.json({ error: adminError }, { status: adminStatus });
  }

  const update = await updateSupabaseRecord(table, recordFilter(recordId, filterColumn), recordPayload);

  if (update.error) {
    return adminSaveErrorResponse(update.error, update.status, {
      operation: "update",
      table,
      payloadKeys: Object.keys(recordPayload)
    });
  }

  await writeActivity({
    adminEmail: adminUser.email,
    actionType: "Edit",
    activity,
    payload,
    record: update.data,
    fallbackId: recordId
  });

  return NextResponse.json({ ok: true, record: update.data }, { status: 200 });
}
