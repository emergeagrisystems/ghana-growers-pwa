import type { Product, ProductCategory } from "@/types";

// Edit marketplace categories here. These can later come from a database table.
export const productCategories: ProductCategory[] = [
  {
    slug: "vegetables",
    name: "Vegetables",
    description: "Tomatoes, onions, peppers, okra, garden eggs, and leafy greens.",
    image: "/images/category-vegetables.svg"
  },
  {
    slug: "fruits",
    name: "Fruits",
    description: "Pineapple, mango, orange, watermelon, banana, and pawpaw.",
    image: "/images/category-fruits.svg"
  },
  {
    slug: "tubers",
    name: "Tubers",
    description: "Yam, cassava, cocoyam, sweet potato, and processed options.",
    image: "/images/category-tubers.svg"
  },
  {
    slug: "livestock",
    name: "Livestock",
    description: "Poultry, goats, sheep, pigs, and livestock support services.",
    image: "/images/category-livestock.svg"
  },
  {
    slug: "dairy-products",
    name: "Dairy Products",
    description: "Milk, yoghurt, cheese, and other fresh dairy supply leads.",
    image: "/images/category-dairy.svg"
  },
  {
    slug: "farm-inputs",
    name: "Farm Inputs",
    description: "Seeds, fertilizers, organic inputs, tools, and equipment.",
    image: "/images/category-inputs.svg"
  },
  {
    slug: "packaging",
    name: "Packaging",
    description: "Crates, cartons, sacks, labels, storage bags, and branding materials.",
    image: "/images/category-packaging.svg"
  },
  {
    slug: "logistics-services",
    name: "Logistics Services",
    description: "Transport, cold storage, aggregation, warehousing, and delivery support.",
    image: "/images/category-logistics.svg"
  }
];

// Edit placeholder products here. Replace these records or connect this array to an API later.
export const products: Product[] = [
  {
    id: "tomatoes-akumadan",
    name: "Fresh Tomatoes",
    category: "Vegetables",
    location: "Akumadan, Ashanti Region",
    seller: "Akumadan Growers Group",
    unit: "Crate",
    image: "/images/category-vegetables.svg",
    available: "Weekly supply"
  },
  {
    id: "pineapple-nsawam",
    name: "Sweet Pineapple",
    category: "Fruits",
    location: "Nsawam, Eastern Region",
    seller: "Nsawam Fruit Farmers",
    unit: "Bag or truckload",
    image: "/images/category-fruits.svg",
    available: "Bulk orders"
  },
  {
    id: "yam-tamale",
    name: "Pona Yam",
    category: "Tubers",
    location: "Tamale, Northern Region",
    seller: "Northern Root Crops Network",
    unit: "100 tubers",
    image: "/images/category-tubers.svg",
    available: "Seasonal"
  },
  {
    id: "fertilizer-accra",
    name: "Organic Fertilizer",
    category: "Farm Inputs",
    location: "Accra and Kumasi",
    seller: "Green Input Supply",
    unit: "25kg bag",
    image: "/images/category-inputs.svg",
    available: "In stock"
  },
  {
    id: "crates-kumasi",
    name: "Reusable Produce Crates",
    category: "Packaging",
    location: "Kumasi, Ashanti Region",
    seller: "MarketPack Ghana",
    unit: "Bundle",
    image: "/images/category-packaging.svg",
    available: "Supplier listing"
  },
  {
    id: "cold-storage-tema",
    name: "Cold Storage Support",
    category: "Logistics Services",
    location: "Tema, Greater Accra",
    seller: "FreshChain Logistics",
    unit: "Daily or weekly plan",
    image: "/images/category-logistics.svg",
    available: "Inquiry required"
  }
];
