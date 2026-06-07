import { MessageCircle } from "lucide-react";
import { whatsappUrl } from "@/lib/whatsapp";

type WhatsAppButtonProps = {
  message: string;
  label?: string;
  className?: string;
};

export function WhatsAppButton({
  message,
  label = "Contact on WhatsApp",
  className = ""
}: WhatsAppButtonProps) {
  return (
    <a
      href={whatsappUrl(message)}
      target="_blank"
      rel="noreferrer"
      className={`focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-leaf-600 px-4 py-3 text-sm font-bold text-white shadow-soft transition hover:bg-leaf-700 ${className}`}
    >
      <MessageCircle size={18} aria-hidden="true" />
      {label}
    </a>
  );
}
