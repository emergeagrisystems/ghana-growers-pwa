"use client";
import { usePathname } from "next/navigation";
import { Stage1PublicFooter } from "@/components/homepage/Stage1PublicShell";
export function Footer(){
  const pathname=usePathname();
  return pathname.startsWith("/admin/profiles/") ? null : <Stage1PublicFooter />;
}
