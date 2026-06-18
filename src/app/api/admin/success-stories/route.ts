import { createRecord, slugify, updateRecord } from "@/app/api/admin/records";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requiredFields = ["title", "category", "personBusinessName", "region", "summary", "outcome", "date", "status"];

function mapPayload(payload: Record<string, string>) {
  return {
    slug: slugify(payload.title),
    title: payload.title,
    category: payload.category,
    person_business_name: payload.personBusinessName,
    region: payload.region,
    summary: payload.summary,
    outcome: payload.outcome,
    story_date: payload.date,
    image_url: payload.imageUrl || null,
    status: payload.status,
    __slugBaseValue: payload.title
  };
}

export async function POST(request: Request) {
  return createRecord({
    request,
    table: "success_stories",
    requiredFields,
    mapPayload,
    activity: {
      entityType: "Success Story",
      entityName: (payload) => payload.title
    }
  });
}

export async function PATCH(request: Request) {
  return updateRecord({
    request,
    table: "success_stories",
    requiredFields,
    filterColumn: "slug",
    mapPayload,
    activity: {
      entityType: "Success Story",
      entityName: (payload) => payload.title
    }
  });
}
