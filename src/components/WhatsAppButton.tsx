"use client";

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

export function WhatsAppButton({
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
      className={`focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-leaf-600 px-4 py-3 text-sm font-bold text-white shadow-soft transition hover:bg-leaf-700 ${className}`}
    >
      <MessageCircle size={18} aria-hidden="true" />
      {label}
    </a>
  );
}
