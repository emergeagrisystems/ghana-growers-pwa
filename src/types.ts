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

export type MarketplaceNumericValue = string | number;

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
  sellingMethod?: "packaged_unit" | "weight" | "count" | "livestock" | "volume";
  sellingUnit?: string;
  customUnitLabel?: string;
  customUnitReviewed?: boolean;
  unitSizeValue?: MarketplaceNumericValue;
  unitSizeMeasure?: string;
  unitSizeApproximate?: boolean;
  priceAmount?: MarketplaceNumericValue;
  priceCurrency?: string;
  priceBasis?: string;
  unitsAvailable?: MarketplaceNumericValue;
  totalQuantityValue?: MarketplaceNumericValue;
  totalQuantityMeasure?: string;
  minimumOrderValue?: MarketplaceNumericValue;
  minimumOrderUnit?: string;
  supplyFrequency?: string;
  availableFromDate?: string;
  gradeDescription?: string;
  deliveryDetails?: string;
  recordSource?: string;
  sourceSubmissionId?: string;
  sourceSubmissionStatus?: string;
  image: string;
  images?: string[];
  available: string;
  datePosted: string;
  verified?: boolean;
  verificationStatus?: string;
  status?: string;
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
    | "Soil & Compost"
    | "Crop Care"
    | "Pests & Diseases"
    | "Harvest & Storage"
    | "FarmMate Guides"
    | "Video Lessons";
  level?: "Basic Skill" | "Better Practice" | "Advanced Practice";
  excerpt: string;
  readTime: string;
  date: string;
  difficulty?: string;
  cost?: string;
  relatedLessons?: string[];
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
  status?: string;
  launchReady?: boolean;
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
  status?: string;
  source?: string;
  isFeatured?: boolean;
  featuredUntil?: string;
  featuredNote?: string;
  trust?: TrustProfile;
  whatsappMessage: string;
};

export type PublicFarmerProfile = {
  id?: string;
  slug: string;
  farmName: string;
  farmerName?: string;
  region: string;
  district: string;
  publicLocation?: string;
  products: string[];
  farmType: "Crop" | "Livestock" | "Mixed";
  farmSize: string;
  availabilityStatus: string;
  description: string;
  harvestSeason: string;
  capacityVolume: string;
  availableQuantities?: string;
  deliveryOptions?: string[];
  paymentPreference?: string;
  mainImage?: string;
  farmPhotos?: string[];
  producePhotos?: string[];
  hasRealPhoto?: boolean;
  photoNeedsImport?: boolean;
  verificationStatus: string;
  status?: string;
  launchReady?: boolean;
  verificationDate?: string;
  ggStandardStatus?: GGStandardStatus | string;
  isFeatured?: boolean;
  featuredUntil?: string;
};

export type PublicSupplierProfile = {
  id?: string;
  slug: string;
  companyName: string;
  supplierCategory: SupplierProfile["supplierCategory"];
  region: string;
  district: string;
  productsServices: string[];
  shortDescription: string;
  companyOverview: string;
  serviceCoverageArea: string;
  photos: string[];
  website?: string;
  verificationStatus: string;
  status?: string;
  verificationDate?: string;
  ggStandardStatus?: GGStandardStatus | string;
  isFeatured?: boolean;
  featuredUntil?: string;
};
