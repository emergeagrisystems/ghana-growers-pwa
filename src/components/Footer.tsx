"use client";

import Link from "next/link";
import { Sprout } from "lucide-react";
import { usePathname } from "next/navigation";
import { isPublicFarmMatePilotPage } from "@/lib/farmmate/pilot-access";

const quickLinks = [
  { title: "Buy", href: "/buy" },
  { title: "Sell", href: "/sell" },
  { title: "Directory", href: "/directory" },
  { title: "GG FarmMate", href: "/farmer-hub" },
  { title: "Learn", href: "/learn" },
  { title: "Contact", href: "/contact" }
];

const legalLinks = [
  { title: "Privacy Policy", href: "/privacy-policy" },
  { title: "Terms", href: "/terms-of-use" },
  { title: "About", href: "/about" }
];

export function Footer() {
  const pathname = usePathname();

  if (isPublicFarmMatePilotPage(pathname)) {
    return null;
  }

  return (
    <footer className="brand-surface-dark border-t border-earth-100/15">
      <div className="mx-auto grid max-w-7xl gap-7 px-4 py-7 sm:px-6 lg:grid-cols-[0.95fr_1.1fr] lg:items-start lg:px-8">
        <div className="max-w-md">
          <Link href="/" className="focus-ring inline-flex items-center gap-2 rounded-md text-xl font-black">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-earth-500 text-leaf-900">
              <Sprout size={22} aria-hidden="true" />
            </span>
            Ghana Growers
          </Link>
          <p className="brand-body mt-3 text-sm leading-6">
            Connecting farmers, suppliers and buyers across Ghana.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-black uppercase tracking-[0.16em] text-earth-500">Quick Links</h2>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:max-w-lg">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="focus-ring rounded-md border border-earth-100/15 bg-earth-50/[0.04] px-3 py-2.5 text-sm font-bold text-earth-100 transition duration-200 hover:border-earth-500/45 hover:bg-earth-50/[0.08] hover:text-earth-500"
              >
                {link.title}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-earth-100/15">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3.5 text-xs text-earth-100/75 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="grid gap-1">
            <p>&copy; {new Date().getFullYear()} Ghana Growers</p>
            <p>A Product of Emerge Agri Systems (E.A.Sy.)</p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {legalLinks.map((link) => (
              <Link key={link.href} href={link.href} className="font-semibold text-earth-100/85 hover:text-earth-500">
                {link.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
