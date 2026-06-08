import Link from "next/link";
import { Facebook, Instagram, Linkedin, Mail, MapPin, MessageCircle, Phone, Sprout } from "lucide-react";
import { siteConfig } from "@/data/site";
import { WhatsAppButton } from "@/components/WhatsAppButton";

const footerGroups = [
  {
    title: "Quick Links",
    links: [
      { title: "Home", href: "/" },
      { title: "Learn", href: "/learn" },
      { title: "About", href: "/about" },
      { title: "Verification", href: "/verification-requirements" }
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
    title: "Marketplace",
    links: [
      { title: "Farmer Directory", href: "/farmer-directory" },
      { title: "Supplier Directory", href: "/supplier-directory" },
      { title: "Buyer Requests", href: "/buyer-requests" },
      { title: "Market Intelligence", href: "/market-intelligence" }
    ]
  },
  {
    title: "Farmer Tools",
    links: [
      { title: "Farm Help Assistant", href: "/smart-solutions#assistant" },
      { title: "Crop Health Check", href: "/smart-solutions#crop-health" },
      { title: "Weather Tools", href: "/smart-solutions#weather" },
      { title: "Market Prices", href: "/market-intelligence" }
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
              <Phone size={16} aria-hidden="true" />
              WhatsApp-first support for Ghana Growers members
            </span>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <WhatsAppButton
              message="Hello Ghana Growers, I would like to make an inquiry."
              className="bg-earth-500 text-ink hover:bg-white hover:text-ink"
            />
            <Link
              href="/whatsapp-communities"
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-white px-4 py-3 text-sm font-black text-leaf-700 hover:bg-leaf-50"
            >
              <MessageCircle size={17} aria-hidden="true" />
              WhatsApp Communities
            </Link>
          </div>

          <div className="mt-6 flex gap-3">
            {socialLinks.map((item) => {
              const Icon = item.icon;
              return (
                <span key={item.title} className="grid h-10 w-10 place-items-center rounded-md bg-white/10 text-white/75" title={`${item.title} placeholder`}>
                  <Icon size={18} aria-hidden="true" />
                </span>
              );
            })}
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
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
          <p>Social media links are placeholders until official channels are connected.</p>
        </div>
      </div>
    </footer>
  );
}
