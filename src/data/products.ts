import type { Product, ProductCategory } from "@/types";

// Edit marketplace categories here. These can later come from a database table.
export const productCategories: ProductCategory[] = [
  {
    slug: "vegetables",
    name: "Vegetables",
    description: "Tomatoes, onions, peppers, okra, garden eggs, and leafy greens.",
    image: "/images/crops/tomatoes.jpg"
  },
  {
    slug: "fruits",
    name: "Fruits",
    description: "Pineapple, mango, orange, watermelon, banana, and pawpaw.",
    image: "/images/crops/pineapple.jpg"
  },
  {
    slug: "cereals",
    name: "Cereals",
    description: "Maize, rice, sorghum, millet, and grain aggregation opportunities.",
    image: "/images/marketplace/farm-activity-1.jpg"
  },
  {
    slug: "tubers",
    name: "Tubers",
    description: "Yam, cassava, cocoyam, sweet potato, and processed options.",
    image: "/images/crops/yam.jpg"
  },
  {
    slug: "livestock",
    name: "Livestock",
    description: "Poultry, goats, sheep, pigs, and livestock support services.",
    image: "/images/crops/poultry.jpg"
  },
  {
    slug: "dairy-products",
    name: "Dairy Products",
    description: "Milk, yoghurt, cheese, and other fresh dairy supply leads.",
    image: "/images/crops/eggs.jpg"
  },
  {
    slug: "farm-inputs",
    name: "Farm Inputs",
    description: "Seeds, fertilizers, organic inputs, tools, and equipment.",
    image: "/images/crops/inputs.jpg"
  },
  {
    slug: "packaging",
    name: "Packaging",
    description: "Crates, cartons, sacks, labels, storage bags, and branding materials.",
    image: "/images/crops/packaging.jpg"
  },
  {
    slug: "logistics-services",
    name: "Logistics Services",
    description: "Transport, cold storage, aggregation, warehousing, and delivery support.",
    image: "/images/crops/logistics.jpg"
  }
];

// Edit marketplace listings here. Replace these records or connect this array to an API later.
export const products: Product[] = [
  {
    id: "tomatoes-akumadan",
    name: "Fresh Tomatoes",
    category: "Vegetables",
    location: "Akumadan, Offinso North",
    region: "Ashanti Region",
    seller: "Akumadan Growers Group",
    description: "Fresh table tomatoes aggregated from farmer groups around Akumadan for restaurants, market traders, and bulk buyers.",
    quantity: "420",
    unit: "crates",
    image: "/images/marketplace/fresh-tomatoes.jpg",
    available: "Available now",
    datePosted: "2026-06-06",
    verified: true,
    featured: true,
    whatsappNumber: "233000000000",
    farmerSlug: "akumadan-growers-group"
  },
  {
    id: "onions-bawku",
    name: "Red Onions",
    category: "Vegetables",
    location: "Bawku Municipal",
    region: "Upper East Region",
    seller: "Bawku Onion Aggregators",
    description: "Bulk red onions suitable for wholesalers, processors, restaurants, and traders sourcing northern Ghana supply.",
    quantity: "18",
    unit: "tonnes",
    image: "/images/marketplace/ghana-market-2.jpg",
    available: "Bulk orders",
    datePosted: "2026-06-05",
    verified: true,
    featured: true,
    whatsappNumber: "233000000000",
    farmerSlug: "upper-east-onion-growers"
  },
  {
    id: "maize-techiman",
    name: "Yellow Maize",
    category: "Cereals",
    location: "Techiman",
    region: "Bono East Region",
    seller: "Techiman Grain Cooperative",
    description: "Clean yellow maize available for animal feed, processors, aggregators, and bulk food buyers.",
    quantity: "650",
    unit: "bags",
    image: "/images/marketplace/farm-activity-1.jpg",
    available: "Available now",
    datePosted: "2026-06-04",
    verified: true,
    featured: true,
    whatsappNumber: "233000000000",
    farmerSlug: "techiman-maize-and-beans-farm"
  },
  {
    id: "cassava-kintampo",
    name: "Fresh Cassava",
    category: "Tubers",
    location: "Kintampo North",
    region: "Bono East Region",
    seller: "Northern Root Crops Network",
    description: "Fresh cassava for gari processors, starch users, food vendors, and local market aggregators.",
    quantity: "35",
    unit: "tonnes",
    image: "/images/marketplace/yam-cassava.jpg",
    available: "Harvesting this week",
    datePosted: "2026-06-04",
    verified: false,
    whatsappNumber: "233000000000",
    farmerSlug: "northern-root-crops-network"
  },
  {
    id: "yam-tamale",
    name: "Pona Yam",
    category: "Tubers",
    location: "Tamale Metropolitan",
    region: "Northern Region",
    seller: "Savelugu Yam Producers",
    description: "Pona yam supply from northern farmer groups for traders, restaurants, exporters, and institutional buyers.",
    quantity: "1,200",
    unit: "tubers",
    image: "/images/marketplace/yam-cassava.jpg",
    available: "Seasonal supply",
    datePosted: "2026-06-03",
    verified: true,
    whatsappNumber: "233000000000",
    farmerSlug: "northern-root-crops-network"
  },
  {
    id: "plantain-asamankese",
    name: "Mature Plantain",
    category: "Fruits",
    location: "Asamankese",
    region: "Eastern Region",
    seller: "West Akim Plantain Farmers",
    description: "Mature plantain bunches ready for market women, chop bars, restaurants, caterers, and bulk produce buyers.",
    quantity: "260",
    unit: "bunches",
    image: "/images/marketplace/pineapple-field.jpg",
    available: "Available now",
    datePosted: "2026-06-02",
    verified: true,
    featured: true,
    whatsappNumber: "233000000000",
    farmerSlug: "western-cocoa-and-plantain-farm"
  },
  {
    id: "pepper-ada",
    name: "Fresh Pepper",
    category: "Vegetables",
    location: "Ada East",
    region: "Greater Accra Region",
    seller: "Ada Vegetable Farmers",
    description: "Fresh pepper supply from irrigated vegetable farms for market traders, restaurants, and processors.",
    quantity: "180",
    unit: "crates",
    image: "/images/crops/tomatoes.jpg",
    available: "Available now",
    datePosted: "2026-06-02",
    verified: false,
    whatsappNumber: "233000000000",
    farmerSlug: "ada-vegetable-cooperative"
  },
  {
    id: "rice-avaime",
    name: "Local Rice",
    category: "Cereals",
    location: "Aveyime",
    region: "Volta Region",
    seller: "Aveyime Rice Growers",
    description: "Local rice packed in 50kg bags for retailers, food service buyers, wholesalers, and institutions.",
    quantity: "320",
    unit: "50kg bags",
    image: "/images/marketplace/river-supply-chain.jpg",
    available: "Bulk orders",
    datePosted: "2026-06-01",
    verified: true,
    whatsappNumber: "233000000000",
    farmerSlug: "volta-rice-and-fish-farm"
  },
  {
    id: "eggs-kumasi",
    name: "Fresh Eggs",
    category: "Livestock",
    location: "Ejisu",
    region: "Ashanti Region",
    seller: "Ejisu Poultry Farm",
    description: "Fresh eggs available for retailers, bakeries, caterers, restaurants, and wholesale distributors.",
    quantity: "900",
    unit: "crates",
    image: "/images/crops/eggs.jpg",
    available: "Daily supply",
    datePosted: "2026-05-31",
    verified: true,
    whatsappNumber: "233000000000",
    farmerSlug: "cape-coast-poultry-unit"
  },
  {
    id: "poultry-dawhenya",
    name: "Live Broilers",
    category: "Livestock",
    location: "Dawhenya",
    region: "Greater Accra Region",
    seller: "Dawhenya Poultry Producers",
    description: "Live broilers for poultry traders, restaurants, processors, cold stores, and bulk buyers.",
    quantity: "1,500",
    unit: "birds",
    image: "/images/crops/poultry.jpg",
    available: "Pre-order",
    datePosted: "2026-05-30",
    verified: true,
    featured: true,
    whatsappNumber: "233000000000",
    farmerSlug: "cape-coast-poultry-unit"
  }
];
