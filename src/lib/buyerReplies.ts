import { firstReplyState, type GhanaCalendar } from "./adminCrm";

// Observed dates within this edition only. See docs/buyer-first-replies.md.
export const ghanaCalendar = {
  version: "GH-2026-H2.1", verified: "2026-11-20",
  from: "2026-07-01", through: "2026-12-31",
  holidays: ["2026-07-03", "2026-09-21", "2026-12-04", "2026-12-25", "2026-12-28"]
} as const;

export const replyLabels = {
  outstanding: "Need a first reply", reminder: "Attention soon", overdue: "Overdue", historical: "History to review"
};
export type ReplyGroup = keyof typeof replyLabels;
export type ReplyBuckets = Record<ReplyGroup, string[]>;
export type ReplyOverview = { groups: ReplyBuckets } | { problem: string };
const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
function instant(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d\d-\d\dT(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(value)) return false;
  const day = value.slice(0, 10);
  const midnight = new Date(day + "T00:00:00Z");
  return Number.isFinite(midnight.getTime()) && midnight.toISOString().startsWith(day)
    && Number.isFinite(Date.parse(value));
}
export function unansweredState(received: string, now: Date, start: string | undefined, calendar: GhanaCalendar | undefined) {
  if (!instant(received) || !instant(start) || !Number.isFinite(now.getTime()) ||
      Date.parse(start) > now.getTime() || Date.parse(received) > now.getTime()) return "unavailable";
  if (Date.parse(received) < Date.parse(start)) return "historical";
  const today = now.toISOString().slice(0,10);
  if (!calendar || today < calendar.from || today > calendar.through) return "unavailable";
  return firstReplyState(received, now, calendar, []);
}

export function buildReplyOverview(data: unknown, buyers: {available:boolean;rows: {id:string;received:string}[]},
  now: Date, start: string | undefined, calendar: GhanaCalendar | undefined): ReplyOverview {
  const incomplete = {problem: "Reply records are incomplete. Refresh or check the buyer queue."};
  if (!buyers.available || !data || typeof data !== "object" || !("as_of" in data) ||
      !instant(data.as_of) || Date.parse(data.as_of) !== now.getTime() ||
      !("unanswered_receipts" in data) || !Array.isArray(data.unanswered_receipts)) return incomplete;
  if (!instant(start) || Date.parse(start)>now.getTime()) return {problem:"First-reply tracking has no active start date."};
  const today = now.toISOString().slice(0,10);
  if (!calendar || today < calendar.from || today > calendar.through) return {problem:"The Ghana business-day calendar does not cover today."};
  const receipts = new Map<string,number>();
  for (const row of buyers.rows) {
    if (!uuid.test(row.id) || !instant(row.received) || receipts.has(row.id)) return incomplete;
    receipts.set(row.id,Date.parse(row.received));
  }
  const seen = new Set<string>();
  const groups: ReplyBuckets = {outstanding:[],reminder:[],overdue:[],historical:[]};
  for (const row of data.unanswered_receipts) {
    if (!row || typeof row.request_id !== "string" || !instant(row.received_at) ||
        seen.has(row.request_id) || receipts.get(row.request_id) !== Date.parse(row.received_at)) return incomplete;
    seen.add(row.request_id);
    const state = unansweredState(row.received_at, now, start, calendar);
    if (state === "unavailable") return {problem:"A receipt or its deadline falls outside verified calendar coverage."};
    if (state === "historical") groups.historical.push(row.request_id);
    else {
      groups.outstanding.push(row.request_id);
      if (state === "overdue" || state === "reminder") groups[state].push(row.request_id);
    }
  }
  return {groups};
}
