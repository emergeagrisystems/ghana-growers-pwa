import { Boxes, GraduationCap, Handshake, ShoppingBasket, Sprout, Truck } from "lucide-react";

export const serviceAudiences = [
  {
    title: "For Farmers",
    href: "/services/farmers",
    icon: Sprout,
    description: "Sell produce, join a farmer network, access buyers, learn best practices, and find suppliers."
  },
  {
    title: "For Buyers",
    href: "/services/buyers",
    icon: ShoppingBasket,
    description: "Find trusted farmers, buy fresh produce, request bulk support, and send WhatsApp inquiries."
  },
  {
    title: "For Suppliers",
    href: "/services/suppliers",
    icon: Boxes,
    description: "List inputs, tools, equipment, packaging, transport, cold storage, and support services."
  }
];

export const howItWorks = [
  {
    title: "Join the network",
    description: "Farmers, buyers, and suppliers register interest with their location, needs, and offering.",
    icon: Handshake
  },
  {
    title: "Discover opportunities",
    description: "Browse produce categories, supplier services, farmer directory structures, and learning content.",
    icon: GraduationCap
  },
  {
    title: "Connect directly",
    description: "Use WhatsApp inquiries for orders, introductions, supplier conversations, and next steps.",
    icon: Truck
  }
];
