"use client";

import { MessageCircle } from "lucide-react";
import { WHATSAPP_NUMBER } from "@/data/site";
import { whatsappUrl } from "@/lib/whatsapp";
import { trackWhatsAppLead } from "@/lib/whatsappLeadTracking";

export function FloatingWhatsAppButton() {
  return (
    <a
      href={whatsappUrl("Hello Ghana Growers, I would like to connect with your team.")}
      target="_blank"
      rel="noreferrer"
      aria-label="Contact Ghana Growers on WhatsApp"
      onClick={() =>
        trackWhatsAppLead({
          sourceType: "Floating WhatsApp",
          sourceId: "floating-whatsapp",
          sourceName: "Floating WhatsApp Button",
          phoneNumber: WHATSAPP_NUMBER
        })
      }
      className="focus-ring fixed bottom-4 right-4 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-leaf-600 text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-leaf-700 sm:bottom-6 sm:right-6 sm:w-auto sm:gap-2 sm:rounded-md sm:px-5"
    >
      <MessageCircle size={23} aria-hidden="true" />
      <span className="hidden text-sm font-black sm:inline">WhatsApp</span>
    </a>
  );
}
