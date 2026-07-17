"use client";

import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { WHATSAPP_NUMBER } from "@/data/site";
import { whatsappUrl } from "@/lib/whatsapp";
import { trackWhatsAppLead } from "@/lib/whatsappLeadTracking";
import { isPublicFarmMatePilotPage } from "@/lib/farmmate/pilot-access";

const quietRoutes = [
  "/about",
  "/about/partner-with-us",
  "/partner-with-us",
  "/faq",
  "/verification-process",
  "/verification-requirements",
  "/privacy-policy",
  "/terms-of-use",
  "/learn",
  "/success-stories",
  "/launching-soon",
  "/dev-preview"
];

export function FloatingWhatsAppButton() {
  const pathname = usePathname();
  const shouldHide = isPublicFarmMatePilotPage(pathname) || quietRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  const hasOfficialWhatsApp = WHATSAPP_NUMBER !== "233000000000";

  if (shouldHide || !hasOfficialWhatsApp) {
    return null;
  }

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
      className="focus-ring fixed bottom-4 right-4 z-50 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-leaf-700 shadow-sm ring-1 ring-leaf-900/15 transition hover:-translate-y-0.5 hover:bg-leaf-50 sm:bottom-6 sm:right-6"
    >
      <MessageCircle size={20} aria-hidden="true" />
    </a>
  );
}
