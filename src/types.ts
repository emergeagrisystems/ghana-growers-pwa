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
  image: string;
  available: string;
  datePosted: string;
  verified?: boolean;
  featured?: boolean;
  whatsappNumber?: string;
  farmerSlug?: string;
};

export type BlogPost = {
  slug: string;
  title: string;
  category: "Crop Production" | "Livestock" | "Agribusiness" | "Market Prices" | "Success Stories";
  excerpt: string;
  readTime: string;
  date: string;
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

export type FarmerProfile = {
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
  photos: string[];
  verificationStatus: string;
  verificationDate?: string;
  verifiedBy?: string;
  verificationNotes?: string;
  trust?: TrustProfile;
  whatsappMessage: string;
};

export type SupplierProfile = {
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
  trust?: TrustProfile;
  whatsappMessage: string;
};
