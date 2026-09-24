import type { Metadata } from "next";
import { noIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...noIndexMetadata,
  title: "Admin"
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
