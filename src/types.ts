export type NavigationItem = {
  title: string;
  href: string;
  children?: NavigationItem[];
};

export type ProductCategory = {
  slug: string;
  name: string;
  description: string;
  image: string;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  location: string;
  region: string;
  seller: string;
  description: string;
  quantity: string;
  unit: string;
  priceRange?: string;
  image: string;
  images?: string[];
  available: string;
  datePosted: string;
  verified?: boolean;
  featured?: boolean;
  featuredUntil?: string;
  featuredNote?: string;
  whatsappNumber?: string;
  farmerSlug?: string;
  ownerType?: "Farmer" | "Supplier" | "Admin";
  ownerId?: string;
  ownerName?: string;
  internalOperationsNotes?: string;
};

export type BlogPost = {
  slug: string;
  title: string;
  category:
    | "Crops"
    | "Livestock"
    | "Home Gardening"
    | "Agribusiness"
    | "Seasonal Farming"
    | "Video Library";
  excerpt: string;
  readTime: string;
  date: string;
  audience?: string;
  keyPoints?: string[];
  sections?: {
    heading: string;
    body: string;
  }[];
};

export type SuccessStory = {
  id: string;
  slug: string;
  title: string;
  category: "Farmers" | "Buyers" | "Suppliers";
  personBusinessName: string;
  region: string;
  summary: string;
  outcome: string;
  date: string;
  image?: string;
  status: "Draft" | "Published" | "Archived";
};

export type VerificationWorkflowStatus = "Pending" | "Under Review" | "Verified" | "Rejected";
export type TrustStatus = VerificationWorkflowStatus | "Pending Verification" | "Premium Member";

export type VerificationRequirements = {
  phoneVerified: boolean;
  whatsappVerified: boolean;
  identitySubmitted: boolean;
  businessRegistration: boolean;
};

export type TrustScore = {
  profileCompleteness: number;
  verificationLevel: number;
  activityLevel: number;
};

export type TrustProfile = {
  status: TrustStatus;
  requirements: VerificationRequirements;
  score: TrustScore;
};

export type GGStandardStatus = "Pending" | "Member" | "Suspended";

export type FarmerProfile = {
  id?: string;
  slug: string;
  farmName: string;
  contactName: string;
  region: string;
  district: string;
  products: string[];
  farmType: "Crop" | "Livestock" | "Mixed";
  farmSize: string;
  yearsFarming?: string;
  availabilityStatus: string;
  description: string;
  harvestSeason: string;
  capacityVolume: string;
  availableQuantities?: string;
  deliveryOptions?: string[];
  paymentPreference?: string;
  photos: string[];
  hasRealPhoto?: boolean;
  photoNeedsImport?: boolean;
  verificationStatus: string;
  verificationDate?: string;
  verifiedBy?: string;
  verificationNotes?: string;
  ggStandardStatus?: GGStandardStatus | string;
  source?: string;
  isFeatured?: boolean;
  featuredUntil?: string;
  featuredNote?: string;
  trust?: TrustProfile;
  whatsappMessage: string;
};

export type SupplierProfile = {
  id?: string;
  slug: string;
  companyName: string;
  contactPerson: string;
  supplierCategory:
    | "Seeds"
    | "Fertilizers"
    | "Agrochemicals"
    | "Farm Equipment"
    | "Irrigation Systems"
    | "Packaging"
    | "Logistics"
    | "Storage"
    | "Financial Services"
    | "Agricultural Consulting";
  region: string;
  district: string;
  productsServices: string[];
  shortDescription: string;
  companyOverview: string;
  serviceCoverageArea: string;
  photos: string[];
  website?: string;
  socialLink?: string;
  phone: string;
  verificationStatus: string;
  verificationDate?: string;
  verifiedBy?: string;
  verificationNotes?: string;
  ggStandardStatus?: GGStandardStatus | string;
  isFeatured?: boolean;
  featuredUntil?: string;
  featuredNote?: string;
  trust?: TrustProfile;
  whatsappMessage: string;
};
