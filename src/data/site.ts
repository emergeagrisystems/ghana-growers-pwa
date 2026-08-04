import type { NavigationItem } from "@/types";

export const siteConfig = {
  name: "Ghana Growers",
  url: "https://www.ghana-growers.com",
  description:
    "Ghana Growers connects buyers, farmers and agricultural suppliers through a practical marketplace, public farmer profiles and smart farming tools.",
  email: "hello@ghanagrowers.com",
  location: "Accra, Ghana"
};

// Edit this number when Ghana Growers is ready to use its official WhatsApp contact.
// Use international format without plus signs, spaces, or dashes.
export const WHATSAPP_NUMBER = "233000000000";

export const navigation: NavigationItem[] = [
  { title: "Buy", href: "/marketplace" },
  { title: "Sell", href: "/sell" },
  { title: "Directory", href: "/directory" },
  {
    title: "GG FarmMate",
    href: "/farmer-hub"
  },
  { title: "Learn", href: "/learn" },
];
