// Protected Route A destinations enabled through P09-1C.
// Operational destinations and final legal text require separate release gates.
export const previewDestinations: Record<string, string> = {
  "Farmers": "/dev-preview/farmers",
  "Marketplace": "/dev-preview/marketplace",
  "List a Product": "/dev-preview/list-a-product",
  "How Ghana Growers works": "/dev-preview/public/how-it-works",
  "How information is checked": "/dev-preview/public/how-information-is-checked",
  "About Ghana Growers": "/dev-preview/public/about",
  "Contact": "/dev-preview/public/contact"
};
export const publicPreviewPages = {
  "how-it-works": {
    title: "How Ghana Growers works",
    intro: "Ghana Growers brings agricultural information and connection support together, helping buyers, farmers and suppliers start conversations with better context.",
    sections: [
      { title: "Discover relevant information", text: "Farm profiles, produce listings and supplier information help people understand who produces what and where supply or support may be relevant. Availability and details still need confirmation." },
      { title: "Explain what you need", text: "A sourcing enquiry gives context such as the product, quantity, location and timing. Ghana Growers’ role is to help coordinate a relevant connection, not to promise a match or supply." },
      { title: "Confirm before agreeing", text: "The people involved need to confirm identity, availability, quality, price, payment, delivery and timing before making an agreement. Information on the platform does not replace these checks." },
      { title: "Keep responsibilities clear", text: "Ghana Growers does not own the farms shown on the platform or guarantee transactions. A connection does not mean every participant has been personally inspected or that Ghana Growers controls logistics." }
    ]
  },
  "how-information-is-checked": {
    title: "How information is checked",
    intro: "Proof Before Promise. Information should make clear what has been checked, what someone has reported and what still needs confirmation.",
    sections: [
      { title: "Checked by Ghana Growers", text: "This describes a specific information check, with its source, scope and date. It is not a blanket approval of a person, farm, listing or transaction, and it does not guarantee current availability." },
      { title: "Farmer-reported", text: "The information was supplied by the farmer. It should not be read as independently checked by Ghana Growers." },
      { title: "Needs confirmation", text: "A detail still needs to be confirmed before it can be relied on. Ask for current information before making a decision." },
      { title: "Unavailable", text: "The relevant information is not available. This is not evidence that a product, farmer or service does not exist." },
      { title: "Information under review", text: "Information is being assessed or reconciled. Do not treat it as a completed check." },
      { title: "Read the evidence, not the branding", text: "A logo, colour or illustration is not a verification badge. Generated imagery is illustrative only; it does not establish ownership, identity, facilities, supply or completed transactions." }
    ]
  },
  "about": {
    title: "About Ghana Growers",
    intro: "Ghana Growers is a practical agricultural marketplace and support platform for Ghana, bringing together farmers, buyers, agricultural suppliers and services.",
    sections: [
      { title: "For farmers and growers", text: "A clearer way to present farm and product information, helping buyers understand what is grown and where supply may be relevant." },
      { title: "For produce buyers", text: "A place to discover agricultural information, describe sourcing needs and seek relevant connections. Supply, prices and arrangements must be confirmed with the people involved." },
      { title: "For suppliers and service providers", text: "A place for agricultural inputs, equipment and service information alongside farmer and buyer needs. Appearance on the platform is not an endorsement or a promise of coverage." },
      { title: "Practical coordination and farming support", text: "Profiles, listings and sourcing enquiries support agricultural connections. Farming tools and learning resources form the support side of the platform, with their own content and operating boundaries." }
    ]
  },
  "contact": {
    title: "Contact Ghana Growers",
    intro: "Questions about farmer information, sourcing, suppliers or an information correction belong with Ghana Growers.",
    sections: [
      { title: "Contact is not yet active in this Preview", text: "An approved contact route is not enabled here. This page does not send messages or collect contact details." },
      { title: "Information corrections", text: "If information needs correcting, the relevant page and the detail in question provide useful context. The public correction contact route remains unavailable in this Preview." }
    ]
  }
} as const;
