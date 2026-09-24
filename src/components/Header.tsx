"use client";

import Link from "next/link";
import { PublicHeader } from "@/components/homepage/PublicShell";
import { usePathname } from "next/navigation";
import { GhanaGrowersLogo } from "@/components/GhanaGrowersLogo";
import { isPublicFarmMatePilotPage } from "@/lib/farmmate/pilot-access";

function PilotHeader() {
  return (
    <header data-legacy-shell className="brand-surface-dark sticky top-0 z-50 border-b border-earth-100/15 backdrop-blur">
      <nav aria-label="Ask Mama G pilot" className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-3 py-2 sm:px-6 lg:px-8 lg:py-2.5">
        <Link href="/farmer-hub" className="focus-ring flex min-w-0 items-center rounded-md">
          <GhanaGrowersLogo layout="horizontal" tone="reverse" className="h-9 w-auto sm:h-10" priority />
        </Link>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link href="/farmer-hub" className="focus-ring rounded-md px-2.5 py-2 text-sm font-bold text-earth-100 transition hover:bg-earth-50/10 hover:text-earth-50 sm:px-3">
            Ask Mama G
          </Link>
          <span className="px-3 py-2 text-sm">Feedback unavailable</span>
        </div>
      </nav>
    </header>
  );
}

export function Header({ showFullNavigation = true }: { showFullNavigation?: boolean }) {
  const pathname = usePathname();

  if (pathname.startsWith("/admin/profiles/")) {
    return null;
  }

  if (isPublicFarmMatePilotPage(pathname) && !showFullNavigation) {
    return <PilotHeader />;
  }

  return showFullNavigation ? <PublicHeader /> : null;
}
