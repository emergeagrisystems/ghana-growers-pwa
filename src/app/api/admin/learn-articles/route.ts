import { createRecord, slugify } from "@/app/api/admin/records";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return createRecord({
    request,
    table: "learn_articles",
    requiredFields: ["title", "category", "summary", "author", "publishDate", "status"],
    mapPayload: (payload) => ({
      slug: slugify(payload.title),
      title: payload.title,
      category: payload.category,
      summary: payload.summary,
      author: payload.author,
      publish_date: payload.publishDate,
      status: payload.status
    })
  });
}
