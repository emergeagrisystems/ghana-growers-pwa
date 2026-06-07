import type { NavigationItem } from "@/types";

export const siteConfig = {
  name: "Ghana Growers",
  url: "https://ghana-growers.example.com",
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
    title: "Services",
    href: "/services",
    children: [
      { title: "Join as a Farmer", href: "/join/farmer" },
      { title: "Join as a Buyer", href: "/join/buyer" },
      { title: "Become a Supplier", href: "/join/supplier" },
      { title: "For Farmers", href: "/services/farmers" },
      { title: "For Buyers", href: "/services/buyers" },
      { title: "For Suppliers", href: "/services/suppliers" }
    ]
  },
  {
    title: "Marketplace / Shop",
    href: "/marketplace",
    children: [
      { title: "Shop Listings", href: "/marketplace" },
      { title: "Buyer Requests", href: "/buyer-requests" }
    ]
  },
  { title: "Smart Solutions", href: "/smart-solutions" },
  { title: "Learn", href: "/learn" },
  {
    title: "About",
    href: "/about",
    children: [
      { title: "Careers", href: "/about/careers" },
      { title: "Partner With Us", href: "/about/partner-with-us" },
      { title: "Blog", href: "/about/blog" }
    ]
  }
];
