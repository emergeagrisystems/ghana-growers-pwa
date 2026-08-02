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
  { title: "Buy", href: "/buy" },
  { title: "Sell", href: "/sell" },
  { title: "Directory", href: "/directory" },
  {
    title: "GG FarmMate",
    href: "/farmer-hub"
  },
  { title: "Learn", href: "/learn" },
];
