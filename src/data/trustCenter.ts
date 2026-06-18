export type FaqCategory = "Farmers" | "Buyers" | "Suppliers" | "Trust & Safety";

export type FaqItem = {
  question: string;
  answer: string;
  category: FaqCategory;
};

export const faqCategories: FaqCategory[] = ["Farmers", "Buyers", "Suppliers", "Trust & Safety"];

export const faqItems: FaqItem[] = [
  {
    category: "Farmers",
    question: "How do farmers join Ghana Growers?",
    answer:
      "Farmers can join by completing the farmer registration form with their name, farm name, phone number, WhatsApp number, region, district, products, farm size, and any useful harvest or supply notes. Ghana Growers reviews submissions before profiles are published."
  },
  {
    category: "Farmers",
    question: "How does farmer verification work?",
    answer:
      "Ghana Growers reviews contact details, location, products, profile completeness, and any submitted farmer photo or supporting information. A farmer is shown as verified only after review. Verification helps buyers understand that the profile has been checked, but buyers should still confirm quantity, quality, price, and delivery details before committing."
  },
  {
    category: "Farmers",
    question: "How do buyers contact farmers?",
    answer:
      "During the early launch phase, buyers request a connection through Ghana Growers instead of contacting farmers directly from every public page. This helps Ghana Growers track interest, protect farmer details, and support follow-up between serious buyers and relevant farmers."
  },
  {
    category: "Farmers",
    question: "Can farmers list produce in the marketplace?",
    answer:
      "Yes. Farmer-owned marketplace listings can show what a farmer is actively selling, including product, region, quantity, availability, and related profile information. Listings are reviewed before they appear publicly."
  },
  {
    category: "Buyers",
    question: "How can buyers find farmers?",
    answer:
      "Buyers can browse farmer profiles by product, region, district, and farm type when the public directory is open. They can also use marketplace listings and buyer request submissions to help Ghana Growers identify matching supply."
  },
  {
    category: "Buyers",
    question: "What is a buyer request?",
    answer:
      "A buyer request is a demand record showing what a buyer needs, the quantity, location, deadline, and any delivery or quality notes. Ghana Growers reviews requests before publishing or matching them with farmers, suppliers, or marketplace listings."
  },
  {
    category: "Buyers",
    question: "What happens after I submit a lead or request connection?",
    answer:
      "Ghana Growers receives the request, reviews the product or service needed, and checks which farmer, supplier, or listing is relevant. The team can then follow up with the requester and the appropriate platform member."
  },
  {
    category: "Buyers",
    question: "Does verification guarantee product quality?",
    answer:
      "No. Verification means Ghana Growers has reviewed a profile or contact record. It does not guarantee stock, price, grade, delivery, payment terms, or product quality. Buyers should confirm all transaction details before making a purchase."
  },
  {
    category: "Suppliers",
    question: "How do suppliers register?",
    answer:
      "Suppliers can register through the supplier registration page by providing contact person, company name if available, phone, WhatsApp number, region, district, supplier category, products or services, delivery coverage, and optional website or logo."
  },
  {
    category: "Suppliers",
    question: "What are featured placements?",
    answer:
      "Featured placements are visibility opportunities for selected farmers, suppliers, or listings. Ghana Growers can mark a record as featured for extra visibility in directories or marketplace sections. Payments are not required inside the platform yet; interested members can submit an enquiry for review."
  },
  {
    category: "Suppliers",
    question: "How can suppliers get more visibility?",
    answer:
      "Suppliers can improve visibility by submitting complete information, clear service coverage, accurate categories, useful product or service descriptions, and a real logo or image. Suppliers may also request featured placement when that option is available."
  },
  {
    category: "Trust & Safety",
    question: "What does Verified by Ghana Growers mean?",
    answer:
      "It means Ghana Growers has reviewed the profile or request and found enough contact, identity, location, or business information to show a public verification signal. It is a trust indicator, not a legal guarantee or product certification."
  },
  {
    category: "Trust & Safety",
    question: "How does Ghana Growers handle data privacy?",
    answer:
      "Ghana Growers collects information needed to review profiles, manage requests, and connect agricultural participants. Public pages should only show appropriate profile and listing information. Sensitive admin review details are kept inside protected admin workflows."
  },
  {
    category: "Trust & Safety",
    question: "What contact methods does Ghana Growers use?",
    answer:
      "Ghana Growers uses registration forms, buyer request forms, lead request forms, phone, WhatsApp, and admin review workflows. During early launch, public pages may use Request Connection forms instead of exposing direct contacts everywhere."
  },
  {
    category: "Trust & Safety",
    question: "How can users report an issue?",
    answer:
      "Users should contact Ghana Growers if a profile appears inaccurate, a request looks suspicious, a contact does not respond as expected, or a listing needs correction. The team can review the record and update, archive, or follow up where necessary."
  }
];

export const verificationSteps = [
  {
    title: "Submission received",
    description:
      "A farmer, buyer, or supplier submits a registration form, buyer request, listing, or featured placement enquiry."
  },
  {
    title: "Profile completeness review",
    description:
      "Ghana Growers checks whether the submission includes useful contact details, location, products or services, and enough information for public display or follow-up."
  },
  {
    title: "Contact and identity checks",
    description:
      "The team may review phone, WhatsApp, identity, business, or organization information depending on the record type and intended public visibility."
  },
  {
    title: "Verification decision",
    description:
      "Records can remain pending, move under review, be verified, rejected, archived, or marked for follow-up if important details are missing."
  },
  {
    title: "Public trust signal",
    description:
      "Only verified records show a public verification badge or text such as Verified by Ghana Growers."
  }
];
