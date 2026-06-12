import Link from "next/link";
import { Facebook, Instagram, Linkedin, Mail, MapPin, Sprout } from "lucide-react";
import { siteConfig } from "@/data/site";

const footerGroups = [
  {
    title: "Marketplace",
    links: [
      { title: "Marketplace Listings", href: "/marketplace" },
      { title: "Buyer Requests", href: "/buyer-requests" }
    ]
  },
  {
    title: "Our Database",
    links: [
      { title: "View our Farmers", href: "/farmer-directory" },
      { title: "View our Suppliers", href: "/supplier-directory" }
    ]
  },
  {
    title: "Services",
    links: [
      { title: "For Farmers", href: "/services/farmers" },
      { title: "For Buyers", href: "/services/buyers" },
      { title: "For Suppliers", href: "/services/suppliers" },
      { title: "Partner With Us", href: "/about/partner-with-us" }
    ]
  },
  {
    title: "Digital Farm",
    links: [
      { title: "Market Prices", href: "/smart-solutions#market-prices" },
      { title: "Weather", href: "/smart-solutions#weather" },
      { title: "Crop Health Check", href: "/smart-solutions#crop-health" },
      { title: "Farm Help Assistant", href: "/smart-solutions#assistant" }
    ]
  },
  {
    title: "About",
    links: [
      { title: "Who we are", href: "/about" },
      { title: "Partner with us", href: "/about/partner-with-us" },
      { title: "Job listing", href: "/about/careers" },
      { title: "Verification process", href: "/verification-requirements" },
      { title: "Contact Us", href: "/contact" }
    ]
  },
  {
    title: "Join Ghana Growers",
    links: [
      { title: "Choose your role", href: "/join" },
      { title: "Join as Farmer", href: "/join/farmer" },
      { title: "Join as Buyer", href: "/join/buyer" },
      { title: "Join as Supplier", href: "/supplier-registration" }
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
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_1.95fr] lg:px-8">
        <div>
          <Link href="/" className="flex items-center gap-2 text-xl font-black">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-earth-500 text-ink">
              <Sprout size={23} aria-hidden="true" />
            </span>
            Ghana Growers
          </Link>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/70">{siteConfig.description}</p>

          <div className="mt-6 grid gap-3 text-sm text-white/75">
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

          <div className="mt-6 flex gap-3">
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

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {footerGroups.map((group) => (
            <div key={group.title}>
              <h2 className="font-black text-white">{group.title}</h2>
              <div className="mt-4 grid gap-3">
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
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>&copy; {new Date().getFullYear()} Ghana Growers. Built for trusted agricultural trade in Ghana.</p>
          <p>Official social media channels will be connected before public launch.</p>
        </div>
      </div>
    </footer>
  );
}
