import { Handshake, ShoppingBasket, Sprout } from "lucide-react";

// Edit these WhatsApp community invite links when official Ghana Growers groups are ready.
// Use full WhatsApp invite URLs such as: https://chat.whatsapp.com/xxxxxxxxxxxxxxxxxxxxxx
export const whatsappCommunityInviteLinks = {
  farmers: "https://chat.whatsapp.com/REPLACE_FARMERS_INVITE",
  buyers: "https://chat.whatsapp.com/REPLACE_BUYERS_INVITE",
  suppliers: "https://chat.whatsapp.com/REPLACE_SUPPLIERS_INVITE"
};

export const whatsappCommunities = [
  {
    title: "Farmers Community",
    audience: "For crop, livestock, and mixed farmers",
    description:
      "A practical space for Ghanaian farmers to share harvest updates, ask questions, learn from each other, and connect with buyer demand.",
    benefits: [
      "Share available produce and expected harvest periods",
      "Receive farming tips, weather prompts, and market updates",
      "Discover buyer requests and supplier support opportunities"
    ],
    rules: [
      "Post only agriculture-related updates and questions",
      "Be honest about product quality, location, and availability",
      "Respect other members and avoid spam or unrelated promotions"
    ],
    inviteUrl: whatsappCommunityInviteLinks.farmers,
    icon: Sprout
  },
  {
    title: "Buyers Community",
    audience: "For market women, restaurants, hotels, caterers, shops, processors, and households",
    description:
      "A direct channel for buyers to discover fresh produce, ask about supply, post demand, and connect with farmers through Ghana Growers.",
    benefits: [
      "Find farmers and produce leads faster",
      "Post bulk demand and urgent sourcing needs",
      "Get updates on marketplace listings and seasonal supply"
    ],
    rules: [
      "State product, quantity, location, and deadline clearly",
      "Confirm price, quality, and delivery terms before trading",
      "Do not share misleading offers or off-topic adverts"
    ],
    inviteUrl: whatsappCommunityInviteLinks.buyers,
    icon: ShoppingBasket
  },
  {
    title: "Suppliers Community",
    audience: "For input sellers, logistics providers, packaging, storage, finance, and support services",
    description:
      "A professional network for agricultural suppliers to share useful offers, support farmers and buyers, and build trusted partnerships.",
    benefits: [
      "Promote farm inputs, equipment, packaging, logistics, and advisory services",
      "Reach farmers and buyers looking for practical support",
      "Explore partnerships with agribusinesses and community groups"
    ],
    rules: [
      "Share clear product or service details with location and contact information",
      "Avoid exaggerated claims and unsafe product advice",
      "Keep conversations respectful, helpful, and agriculture-focused"
    ],
    inviteUrl: whatsappCommunityInviteLinks.suppliers,
    icon: Handshake
  }
];
