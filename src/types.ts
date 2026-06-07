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
  seller: string;
  unit: string;
  image: string;
  available: string;
};

export type BlogPost = {
  slug: string;
  title: string;
  category: "Farming Tips" | "Buyer Guides" | "Supplier Resources";
  excerpt: string;
  readTime: string;
  date: string;
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
  availabilityStatus: string;
  description: string;
  harvestSeason: string;
  capacityVolume: string;
  photos: string[];
  verificationStatus: string;
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
  whatsappMessage: string;
};
