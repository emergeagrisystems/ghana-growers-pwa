import type { NavigationItem } from "@/types";

export const siteConfig = {
  name: "Ghana Growers",
  url: "https://ghana-growers-pwa.vercel.app",
  description:
    "Ghana Growers connects farmers, buyers, and agricultural suppliers in Ghana through a trusted digital platform.",
  email: "hello@ghanagrowers.com",
  location: "Accra, Ghana"
};

// Edit this number when Ghana Growers is ready to use its official WhatsApp contact.
// Use international format without plus signs, spaces, or dashes.
export const WHATSAPP_NUMBER = "233000000000";

export const navigation: NavigationItem[] = [
  { title: "Home", href: "/" },
  {
    title: "Directory",
    href: "/marketplace",
    children: [
      { title: "Farmers", href: "/farmer-directory" },
      { title: "Suppliers", href: "/supplier-directory" },
      { title: "Marketplace Listings", href: "/marketplace" },
      { title: "Buyer Requests", href: "/buyer-requests" }
    ]
  },
  {
    title: "Digital Farm",
    href: "/smart-solutions",
    children: [
      { title: "Market Prices", href: "/smart-solutions#market-prices" },
      { title: "Weather", href: "/smart-solutions#weather" },
      { title: "Crop Health Check", href: "/smart-solutions#crop-health" },
      { title: "My Crop Health Reports", href: "/smart-solutions#crop-health-reports" },
      { title: "Farm Assistant", href: "/smart-solutions#assistant" },
      { title: "Learn", href: "/learn" }
    ]
  },
  {
    title: "About",
    href: "/about",
    children: [
      { title: "Careers", href: "/about/careers" },
      { title: "Partner With Us", href: "/about/partner-with-us" },
      { title: "Blog", href: "/about/blog" }
    ]
  },
  {
    title: "Join",
    href: "/join",
    children: [
      { title: "Join as Farmer", href: "/join/farmer" },
      { title: "Join as Buyer", href: "/join/buyer" },
      { title: "Join as Supplier", href: "/join/supplier" }
    ]
  },
  {
    title: "Resources",
    href: "/services",
    children: [
      { title: "Services", href: "/services" },
      { title: "Verification", href: "/verification-requirements" },
      { title: "WhatsApp Communities", href: "/whatsapp-communities" }
    ]
  }
];
