/** Calendar coverage must have been reviewed against Ghana Ministry of the Interior notices,
 * including substituted and one-off holidays. An empty or expired calendar is unknown. */
export type GhanaCalendar = { from: string; through: string; holidays: readonly string[] };
export type ReplyEvidence = { recipient: "buyer" | "farmer" | "supplier"; confirmed: boolean; occurredAt: string };
export type ReplyState = "awaiting" | "reminder" | "overdue" | "recorded" | "unavailable";

export function firstReplyWindow(receivedAt: string, calendar?: GhanaCalendar) {
  const received = new Date(receivedAt);
  if (!calendar || !Number.isFinite(received.getTime())) return null;
  // Ghana uses GMT. Receipt day is day zero, even for an after-close or holiday receipt.
  const date = received.toISOString().slice(0, 10);
  if (date < calendar.from || date > calendar.through) return null;
  const cursor = new Date(date + "T00:00:00Z");
  const businessDays: string[] = [];
  while (businessDays.length < 2) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    const key = cursor.toISOString().slice(0, 10);
    if (key > calendar.through) return null;
    if (cursor.getUTCDay() !== 0 && cursor.getUTCDay() !== 6 && !calendar.holidays.includes(key)) businessDays.push(key);
  }
  return { reminder: businessDays[0] + "T09:00:00.000Z", deadline: businessDays[1] + "T17:00:00.000Z" };
}

export function firstReplyState(receivedAt: string, now: Date, calendar: GhanaCalendar | undefined, events: readonly ReplyEvidence[] | null): ReplyState {
  if (!Number.isFinite(now.getTime()) || !Number.isFinite(Date.parse(receivedAt)) || events === null) return "unavailable";
  if (events.some(e => e.recipient === "buyer" && e.confirmed && Date.parse(e.occurredAt) >= Date.parse(receivedAt) && Date.parse(e.occurredAt) <= now.getTime())) return "recorded";
  const window = firstReplyWindow(receivedAt, calendar);
  if (!window) return "unavailable";
  if (now.getTime() > Date.parse(window.deadline)) return "overdue";
  return now.getTime() >= Date.parse(window.reminder) ? "reminder" : "awaiting";
}

/** Only the intended record's own number is accepted. A bare national number is Ghana-only. */
export function contactNumber(raw?: string | null): string | null {
  const input = raw?.trim();
  if (!input || !/^[+\d][\d ()-]*$/.test(input)) return null;
  let number = input.replace(/[ ()-]/g, "");
  if (/^0[235]\d{8}$/.test(number)) number = "+233" + number.slice(1);
  else if (number.startsWith("00")) number = "+" + number.slice(2);
  else if (/^233[235]\d{8}$/.test(number)) number = "+" + number;
  if (!/^\+[1-9]\d{7,14}$/.test(number)) return null;
  if (number.startsWith("+233") && !/^\+233[235]\d{8}$/.test(number)) return null;
  return number;
}

export function contactHref(raw: string | null | undefined, checked: boolean, channel: "wa" | "phone", message = "") {
  const number = checked ? contactNumber(raw) : null;
  if (!number) return undefined;
  return channel === "phone" ? "tel:" + number : "https://wa.me/" + number.slice(1) + "?text=" + encodeURIComponent(message);
}

export const crmPersistenceNotice = "Shared case records are not available yet. No contact, claim or handover can be recorded.";
export type CaseEventKind = "claim" | "handover" | "buyer_contact" | "seller_contact" | "link" | "unlink" | "status" | "follow_up_completed";
export type CaseEvent = {
  id: string; requestId: string; kind: CaseEventKind; actorId: string;
  occurredAt: string; recordedAt: string; version: number; operationId: string;
};
export type CaseHandover = { requestId: string; ownerId: string | null; version: number; nextAction: string | null; dueAt: string | null };
export type ConfirmedBuyerLink = { buyerId: string; requestId: string; confirmedBy: string; confirmedAt: string; unlinkedAt: string | null };
export function leadReference(id: string) { return "BR-" + id.replace(/-/g, "").slice(0, 10).toUpperCase(); }
