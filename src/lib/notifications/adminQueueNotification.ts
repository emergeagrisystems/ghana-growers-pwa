import { createHash } from "node:crypto";

export const ADMIN_QUEUE_NOTIFICATION_RECIPIENT = "enquiries@ghana-growers.com";

export type AdminQueueWorkflow = "farmer-registration" | "supplier-registration" | "managed-buyer-enquiry";

export type AdminQueueNotification = {
  workflow: AdminQueueWorkflow;
  queueRecordId: string;
  sourceLabel: string;
  queuePath: string;
};

export type AdminQueueDeliveryPayload = {
  recipient: typeof ADMIN_QUEUE_NOTIFICATION_RECIPIENT;
  subject: string;
  text: string;
  idempotencyKey: string;
};

export type AdminQueueTransportResult =
  | { status: "sent"; providerReference?: string }
  | { status: "duplicate"; providerReference?: string }
  | { status: "failed"; errorCategory: string };

export interface AdminQueueNotificationTransport {
  send(payload: AdminQueueDeliveryPayload): Promise<AdminQueueTransportResult>;
}

export type AdminQueueDeliveryRecord = {
  notificationId: string;
  workflow: AdminQueueWorkflow;
  queueRecordId: string;
  status: AdminQueueTransportResult["status"];
  recoverable: boolean;
  providerReference?: string;
  errorCategory?: string;
};

export function adminQueueNotificationId(input: Pick<AdminQueueNotification, "workflow" | "queueRecordId">) {
  return createHash("sha256").update(`ghana-growers:${input.workflow}:${input.queueRecordId}`).digest("hex");
}

export function createAdminQueueDeliveryPayload(notification: AdminQueueNotification): AdminQueueDeliveryPayload {
  const idempotencyKey = adminQueueNotificationId(notification);

  return {
    recipient: ADMIN_QUEUE_NOTIFICATION_RECIPIENT,
    subject: `[Ghana Growers] New ${notification.sourceLabel} queue item`,
    text: [
      `Workflow: ${notification.workflow}`,
      `Queue record: ${notification.queueRecordId}`,
      `Review in the protected admin queue: ${notification.queuePath}`,
      "Contact details and seller records are intentionally excluded from this notification."
    ].join("\n"),
    idempotencyKey
  };
}

export async function notifyAdminQueue(
  notification: AdminQueueNotification,
  transport: AdminQueueNotificationTransport
): Promise<AdminQueueDeliveryRecord> {
  const payload = createAdminQueueDeliveryPayload(notification);
  const result = await transport.send(payload);

  return {
    notificationId: payload.idempotencyKey,
    workflow: notification.workflow,
    queueRecordId: notification.queueRecordId,
    status: result.status,
    recoverable: result.status === "failed",
    ...(result.status === "failed" ? { errorCategory: result.errorCategory } : { providerReference: result.providerReference })
  };
}
