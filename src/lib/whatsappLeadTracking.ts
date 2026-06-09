export type WhatsAppLeadSourceType =
  | "Farmer"
  | "Supplier"
  | "Marketplace Listing"
  | "Buyer Request"
  | "Floating WhatsApp"
  | "Platform";

export type WhatsAppLeadPayload = {
  sourceType: WhatsAppLeadSourceType;
  sourceId: string;
  sourceName: string;
  phoneNumber: string;
  pagePath?: string;
};

export function trackWhatsAppLead(payload: WhatsAppLeadPayload) {
  if (typeof window === "undefined") {
    return;
  }

  const body = JSON.stringify({
    ...payload,
    pagePath: payload.pagePath || window.location.pathname
  });

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/whatsapp-leads", blob);
    return;
  }

  fetch("/api/whatsapp-leads", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body,
    keepalive: true
  }).catch(() => undefined);
}
