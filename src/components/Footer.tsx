import Link from "next/link";
import { Facebook, Instagram, Linkedin, Mail, MapPin, Sprout } from "lucide-react";
import { siteConfig } from "@/data/site";

const footerGroups = [
  {
    title: "Marketplace",
    links: [
      { title: "Marketplace Listing", href: "/marketplace" },
      { title: "Buyer Request", href: "/buyer-requests" },
      { title: "View our Farmers", href: "/farmer-directory" },
      { title: "View our Suppliers", href: "/supplier-directory" }
    ]
  },
  {
    title: "Services",
    links: [
      { title: "Digital Farm", href: "/smart-solutions" },
      { title: "Sell", href: "/services" },
      { title: "Buy", href: "/services/buy" }
    ]
  },
  {
    title: "About",
    links: [
      { title: "Who we are", href: "/about" },
      { title: "Partner with us", href: "/about/partner-with-us" },
      { title: "Job listing", href: "/about/careers" },
      { title: "Verification process", href: "/verification-process" },
      { title: "Contact us", href: "/contact" },
      { title: "Privacy Policy", href: "/privacy-policy" },
      { title: "Terms of Use", href: "/terms-of-use" }
    ]
  }
];

const socialLinks = [
  { title: "Facebook", icon: Facebook },
  { title: "Instagram", icon: Instagram },
  { title: "LinkedIn", icon: Linkedin }
];

export function Footer() {
  return (
    <footer className="border-t border-leaf-900/10 bg-ink text-white">
      <div className="mx-auto grid max-w-7xl gap-7 px-4 py-9 sm:px-6 lg:grid-cols-[1fr_1.8fr] lg:px-8">
        <div>
          <Link href="/" className="flex items-center gap-2 text-xl font-black">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-earth-500 text-ink">
              <Sprout size={23} aria-hidden="true" />
            </span>
            Ghana Growers
          </Link>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-earth-500">
            A product of Emerge Agri Systems (E.A.Sy)
          </p>
          <p className="mt-3 max-w-md text-sm leading-6 text-white/70">{siteConfig.description}</p>

          <div className="mt-4 grid gap-2 text-sm text-white/75">
            <span className="flex items-center gap-2">
              <MapPin size={16} aria-hidden="true" />
              {siteConfig.location}
            </span>
            <a className="flex items-center gap-2 hover:text-earth-500" href={`mailto:${siteConfig.email}`}>
              <Mail size={16} aria-hidden="true" />
              {siteConfig.email}
            </a>
            <span className="flex items-center gap-2">
              <Sprout size={16} aria-hidden="true" />
              Preparing Ghana&apos;s agricultural network for launch
            </span>
          </div>

          <div className="mt-4 flex gap-3">
            {socialLinks.map((item) => {
              const Icon = item.icon;
              return (
                <span key={item.title} className="grid h-10 w-10 place-items-center rounded-md bg-white/10 text-white/75" title={`${item.title} channel`}>
                  <Icon size={18} aria-hidden="true" />
                </span>
              );
            })}
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {footerGroups.map((group) => (
            <div key={group.title}>
              <h2 className="font-black text-white">{group.title}</h2>
              <div className="mt-3 grid gap-2.5">
                {group.links.map((link) => (
                  <Link key={link.href} href={link.href} className="text-sm text-white/65 hover:text-earth-500">
                    {link.title}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>&copy; {new Date().getFullYear()} Ghana Growers. Built for trusted agricultural trade in Ghana.</p>
          <p>Farmers, buyers, and suppliers are reviewed before public visibility.</p>
        </div>
      </div>
    </footer>
  );
}
