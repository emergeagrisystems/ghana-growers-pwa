import Link from "next/link";
import { Sprout } from "lucide-react";

const quickLinks = [
  { title: "Buy", href: "/buy" },
  { title: "Sell", href: "/sell" },
  { title: "Directory", href: "/directory" },
  { title: "GG FarmMate", href: "/farmer-hub" },
  { title: "Learn", href: "/learn" },
  { title: "Contact", href: "/contact" }
];

const legalLinks = [
  { title: "Privacy Policy", href: "/privacy" },
  { title: "Terms", href: "/terms" },
  { title: "About", href: "/about" }
];

export function Footer() {
  return (
    <footer className="border-t border-leaf-900/10 bg-[#143A1F] text-[#F7F3E8]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:items-start lg:px-8">
        <div className="max-w-md">
          <Link href="/" className="focus-ring inline-flex items-center gap-2 rounded-md text-xl font-black">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-earth-500 text-[#143A1F]">
              <Sprout size={22} aria-hidden="true" />
            </span>
            Ghana Growers
          </Link>
          <p className="mt-3 text-sm leading-6 text-[#ECF2D1]/85">
            Connecting farmers, suppliers and buyers across Ghana.
          </p>

          <Link href="/join" className="focus-ring mt-5 inline-flex min-h-12 items-center justify-center rounded-md bg-[#F7F3E8] px-6 py-3 text-sm font-black text-[#143A1F] shadow-sm transition duration-200 ease-out hover:bg-[#D6A84A]">
            Join Network
          </Link>
        </div>

        <div>
          <h2 className="text-sm font-black uppercase tracking-[0.16em] text-earth-500">Quick Links</h2>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:max-w-lg">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="focus-ring rounded-md border border-[#ECF2D1]/15 bg-[#F7F3E8]/[0.04] px-3 py-2.5 text-sm font-bold text-[#ECF2D1]/85 transition duration-200 hover:border-[#D6A84A]/45 hover:bg-[#F7F3E8]/[0.08] hover:text-[#D6A84A]"
              >
                {link.title}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-[#ECF2D1]/15">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 text-xs text-[#ECF2D1]/70 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="grid gap-1">
            <p>&copy; {new Date().getFullYear()} Ghana Growers</p>
            <p>A Product of Emerge Agri Systems (E.A.Sy.)</p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {legalLinks.map((link) => (
              <Link key={link.href} href={link.href} className="font-semibold text-[#ECF2D1]/78 hover:text-[#D6A84A]">
                {link.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
