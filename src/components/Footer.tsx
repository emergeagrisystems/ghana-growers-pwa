"use client";
import { usePathname } from "next/navigation";
import { PublicFooter } from "@/components/homepage/PublicShell";
export function Footer(){
  const pathname=usePathname();
  return pathname.startsWith("/admin/profiles/") ? null : <PublicFooter />;
}
