import type { NavigationItem } from "@/types";

export const siteConfig = {
  name: "Ghana Growers",
  url: "https://www.ghana-growers.com",
  description:
    "Ghana Growers connects farmers, buyers, and agricultural suppliers in Ghana through a trusted digital platform.",
  email: "hello@ghanagrowers.com",
  location: "Accra, Ghana"
};

// Edit this number when Ghana Growers is ready to use its official WhatsApp contact.
// Use international format without plus signs, spaces, or dashes.
export const WHATSAPP_NUMBER = "233000000000";

export const navigation: NavigationItem[] = [
  { title: "Marketplace", href: "/marketplace" },
  {
    title: "Our Database",
    href: "/farmer-directory",
    children: [
      { title: "View our Farmers", href: "/farmer-directory" },
      { title: "View our Suppliers", href: "/supplier-directory" }
    ]
  },
  {
    title: "Services",
    href: "/services",
    children: [
      { title: "Sell", href: "/services" },
      { title: "Buy", href: "/services/buy" }
    ]
  },
  {
    title: "Digital Farm",
    href: "/smart-solutions"
  },
  {
    title: "About",
    href: "/about",
    children: [
      { title: "Who we are", href: "/about" },
      { title: "Partner with us", href: "/about/partner-with-us" },
      { title: "Job listing", href: "/about/careers" },
      { title: "Verification process", href: "/verification-process" },
      { title: "Contact us", href: "/contact" }
    ]
  }
];
