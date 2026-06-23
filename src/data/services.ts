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
    description: "Find trusted farmers, browse produce, submit buyer demand, and request reviewed connections."
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
    description: "Request a connection so Ghana Growers can help route serious enquiries to the right farmer, buyer, or supplier.",
    icon: Truck
  }
];
