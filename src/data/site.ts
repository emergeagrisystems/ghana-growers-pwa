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
  {
    title: "Farmer Hub",
    href: "/smart-solutions"
  },
  { title: "Marketplace", href: "/marketplace" },
  {
    title: "Network",
    href: "/farmer-directory",
    children: [
      { title: "Find Farmers", href: "/farmer-directory" },
      { title: "Find Suppliers", href: "/supplier-directory" }
    ]
  },
  {
    title: "Services",
    href: "/services",
    children: [
      { title: "Sell", href: "/services/farmers" },
      { title: "Buy", href: "/services/buy" }
    ]
  },
  { title: "Learn", href: "/learn" },
  {
    title: "About",
    href: "/about",
    children: [
      { title: "Who We Are", href: "/about" },
      { title: "Partner With Us", href: "/about/partner-with-us" },
      { title: "Job Listings", href: "/about/careers" },
      { title: "Verification Process", href: "/verification-process" },
      { title: "Contact Us", href: "/contact" }
    ]
  }
];
