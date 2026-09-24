"use client";
import { withPublicSubmissionGate } from "@/components/PublicSubmissionUnavailable";

import { MessageCircle } from "lucide-react";
import { WHATSAPP_NUMBER } from "@/data/site";
import { trackWhatsAppLead, type WhatsAppLeadSourceType } from "@/lib/whatsappLeadTracking";

type WhatsAppButtonProps = {
  message: string;
  label?: string;
  className?: string;
  sourceType?: WhatsAppLeadSourceType;
  sourceId?: string;
  sourceName?: string;
  phoneNumber?: string;
};

export const WhatsAppButton = withPublicSubmissionGate(WhatsAppButtonAvailable, "whatsapp-leads", "WhatsApp contact", true);

function WhatsAppButtonAvailable({
  message,
  label = "Contact on WhatsApp",
  className = "",
  sourceType,
  sourceId = "ghana-growers",
  sourceName = "Ghana Growers",
  phoneNumber = WHATSAPP_NUMBER
}: WhatsAppButtonProps) {
  return (
    <a
      href={`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`}
      target="_blank"
      rel="noreferrer"
      onClick={() => {
        if (sourceType) {
          trackWhatsAppLead({
            sourceType,
            sourceId,
            sourceName,
            phoneNumber
          });
        }
      }}
      className={`gg-button-primary gap-2 ${className}`}
    >
      <MessageCircle size={18} aria-hidden="true" />
      {label}
    </a>
  );
}
