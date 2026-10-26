import assert from "node:assert/strict";
import test from "node:test";
import {
  ADMIN_QUEUE_NOTIFICATION_RECIPIENT,
  adminQueueNotificationId,
  createAdminQueueDeliveryPayload,
  notifyAdminQueue,
  type AdminQueueDeliveryPayload,
  type AdminQueueNotificationTransport
} from "../src/lib/notifications/adminQueueNotification";

const notification = {
  workflow: "managed-buyer-enquiry" as const,
  queueRecordId: "lead-123",
  sourceLabel: "managed buyer enquiry",
  queuePath: "/admin?section=lead-requests"
};

test("queue notifications use a workflow-specific deterministic identity", () => {
  assert.equal(adminQueueNotificationId(notification), adminQueueNotificationId(notification));
  assert.notEqual(adminQueueNotificationId(notification), adminQueueNotificationId({ ...notification, workflow: "farmer-registration" }));
  assert.notEqual(adminQueueNotificationId(notification), adminQueueNotificationId({ ...notification, queueRecordId: "lead-124" }));
});

test("notification payload contains a queue reference but no protected contact fields", () => {
  const payload = createAdminQueueDeliveryPayload(notification);
  assert.equal(payload.recipient, ADMIN_QUEUE_NOTIFICATION_RECIPIENT);
  assert.match(payload.text, /lead-123/);
  assert.doesNotMatch(JSON.stringify(payload), /phone|whatsapp|email address|seller contact/i);
});

test("adapter reports success and duplicate delivery without changing the queue record", async () => {
  const sent = new Set<string>();
  const transport: AdminQueueNotificationTransport = {
    async send(payload: AdminQueueDeliveryPayload) {
      if (sent.has(payload.idempotencyKey)) return { status: "duplicate" };
      sent.add(payload.idempotencyKey);
      return { status: "sent", providerReference: "mock-1" };
    }
  };

  assert.equal((await notifyAdminQueue(notification, transport)).status, "sent");
  assert.equal((await notifyAdminQueue(notification, transport)).status, "duplicate");
  assert.equal(sent.size, 1);
});

test("delivery failure is returned as recoverable for later durable recording", async () => {
  const transport: AdminQueueNotificationTransport = { async send() { return { status: "failed", errorCategory: "provider_unavailable" }; } };
  const result = await notifyAdminQueue(notification, transport);
  assert.equal(result.status, "failed");
  assert.equal(result.recoverable, true);
  assert.equal(result.errorCategory, "provider_unavailable");
});
