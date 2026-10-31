"use client";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { foundationFont } from "@/components/homepage-foundation/font";
import styles from "./PublicVisualScope.module.css";

// Only the explicitly authorised public presentation surfaces inherit these roles.
// Admin/Auth, Mama G tools, Learn and deferred Marketplace retain their own styles.
export function PublicVisualScope({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const scoped = ["/directory", "/farmer-directory", "/supplier-directory", "/services/suppliers", "/join", "/become-a-supplier", "/submit-listing", "/submit-buyer-request"].some(route => pathname === route || pathname.startsWith(route + "/"));
  return scoped ? <div className={styles.scope + " " + foundationFont.className}>{children}</div> : <>{children}</>;
}
