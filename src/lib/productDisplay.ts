const PRODUCT_IMAGE_MAP: Record<string, string> = {
  maize: "/images/products/cereals.jpg",
  maise: "/images/products/cereals.jpg",
  corn: "/images/products/cereals.jpg",
  onion: "/images/products/onions.jpg",
  onions: "/images/products/onions.jpg",
  tomato: "/images/products/tomatoes.jpg",
  tomatoes: "/images/products/tomatoes.jpg",
  pepper: "/images/products/pepper.jpg",
  peppers: "/images/products/pepper.jpg",
  chilli: "/images/products/pepper.jpg",
  "chilli pepper": "/images/products/pepper.jpg",
  okra: "/images/products/vegetables.jpg",
  "garden egg": "/images/products/vegetables.jpg",
  "garden eggs": "/images/products/vegetables.jpg",
  cabbage: "/images/products/vegetables.jpg",
  carrot: "/images/products/vegetables.jpg",
  carrots: "/images/products/vegetables.jpg",
  "leafy greens": "/images/products/vegetables.jpg",
  cassava: "/images/products/tubers.jpg",
  yam: "/images/products/yam.jpg",
  yams: "/images/products/yam.jpg",
  cocoyam: "/images/products/tubers.jpg",
  cocoyams: "/images/products/tubers.jpg",
  kokoyam: "/images/products/tubers.jpg",
  kokoyams: "/images/products/tubers.jpg",
  taro: "/images/products/tubers.jpg",
  "sweet potato": "/images/products/tubers.jpg",
  "sweet potatoes": "/images/products/tubers.jpg",
  plantain: "/images/products/fruits.jpg",
  plantains: "/images/products/fruits.jpg",
  rice: "/images/products/rice.jpg",
  beans: "/images/products/legumes.jpg",
  soybean: "/images/products/legumes.jpg",
  soybeans: "/images/products/legumes.jpg",
  soyabean: "/images/products/legumes.jpg",
  soyabeans: "/images/products/legumes.jpg",
  "soya bean": "/images/products/legumes.jpg",
  "soya beans": "/images/products/legumes.jpg",
  cowpea: "/images/products/legumes.jpg",
  cowpeas: "/images/products/legumes.jpg",
  groundnut: "/images/products/legumes.jpg",
  groundnuts: "/images/products/legumes.jpg",
  granut: "/images/products/legumes.jpg",
  granuts: "/images/products/legumes.jpg",
  peanut: "/images/products/legumes.jpg",
  peanuts: "/images/products/legumes.jpg",
  goat: "/images/products/livestock.jpg",
  goats: "/images/products/livestock.jpg",
  poultry: "/images/products/poultry.jpg",
  fowl: "/images/products/poultry.jpg",
  fowls: "/images/products/poultry.jpg",
  fish: "/images/products/fish.jpg",
  catfish: "/images/products/fish.jpg",
  cattle: "/images/products/livestock.jpg",
  cow: "/images/products/livestock.jpg",
  cows: "/images/products/livestock.jpg",
  sheep: "/images/products/livestock.jpg",
  egg: "/images/products/eggs.jpg",
  eggs: "/images/products/eggs.jpg",
  pineapple: "/images/products/fruits.jpg",
  mango: "/images/products/fruits.jpg",
  orange: "/images/products/fruits.jpg",
  watermelon: "/images/products/fruits.jpg",
  banana: "/images/products/fruits.jpg",
  pawpaw: "/images/products/fruits.jpg",
  coconut: "/images/products/fruits.jpg",
  avocado: "/images/products/fruits.jpg",
  vegetables: "/images/products/vegetables.jpg",
  fruits: "/images/products/fruits.jpg",
  tubers: "/images/products/tubers.jpg",
  cereals: "/images/products/cereals.jpg",
  legumes: "/images/products/legumes.jpg",
  livestock: "/images/products/livestock.jpg",
  seeds: "/images/products/farm-inputs.jpg",
  fertilizer: "/images/products/farm-inputs.jpg",
  fertilizers: "/images/products/farm-inputs.jpg",
  "agro chemicals": "/images/products/farm-inputs.jpg",
  agrochemicals: "/images/products/farm-inputs.jpg",
  pesticide: "/images/products/farm-inputs.jpg",
  pesticides: "/images/products/farm-inputs.jpg",
  herbicide: "/images/products/farm-inputs.jpg",
  herbicides: "/images/products/farm-inputs.jpg",
  "organic compost": "/images/products/farm-inputs.jpg",
  compost: "/images/products/farm-inputs.jpg",
  "soil conditioner": "/images/products/farm-inputs.jpg",
  "animal feed": "/images/products/farm-inputs.jpg",
  "veterinary products": "/images/products/farm-inputs.jpg",
  "farm equipment": "/images/marketplace/farm-activity-2.jpg",
  "farm tools": "/images/marketplace/farm-inputs.jpg",
  tools: "/images/marketplace/farm-inputs.jpg",
  tractor: "/images/marketplace/farm-activity-2.jpg",
  "tractor services": "/images/marketplace/farm-activity-2.jpg",
  irrigation: "/images/marketplace/river-supply-chain.jpg",
  "irrigation supplies": "/images/marketplace/river-supply-chain.jpg",
  crates: "/images/marketplace/produce-packaging.jpg",
  packaging: "/images/marketplace/produce-packaging.jpg",
  sacks: "/images/marketplace/produce-packaging.jpg",
  labels: "/images/marketplace/produce-packaging.jpg",
  "storage bags": "/images/marketplace/produce-packaging.jpg",
  transport: "/images/marketplace/logistics-truck.jpg",
  logistics: "/images/marketplace/logistics-truck.jpg",
  delivery: "/images/marketplace/logistics-truck.jpg",
  "cold storage": "/images/marketplace/logistics-truck.jpg",
  storage: "/images/marketplace/logistics-truck.jpg",
  consulting: "/images/marketplace/farm-activity-2.jpg",
  advisory: "/images/marketplace/farm-activity-2.jpg",
  finance: "/images/suppliers/supplier-10.jpg",
  credit: "/images/suppliers/supplier-10.jpg"
};

const CATEGORY_IMAGE_MAP: Record<string, string> = {
  vegetables: "/images/products/vegetables.jpg",
  fruits: "/images/products/fruits.jpg",
  tubers: "/images/products/tubers.jpg",
  cereals: "/images/products/cereals.jpg",
  legumes: "/images/products/legumes.jpg",
  livestock: "/images/products/livestock.jpg",
  "farm inputs": "/images/products/farm-inputs.jpg",
  inputs: "/images/products/farm-inputs.jpg",
  packaging: "/images/marketplace/produce-packaging.jpg",
  logistics: "/images/marketplace/logistics-truck.jpg",
  services: "/images/marketplace/farm-activity-2.jpg"
};

const DISPLAY_NAME_MAP: Record<string, string> = {
  maize: "Maize",
  maise: "Maize",
  corn: "Maize",
  onion: "Onions",
  onions: "Onions",
  tomato: "Tomatoes",
  tomatoes: "Tomatoes",
  pepper: "Pepper",
  peppers: "Pepper",
  okra: "Okra",
  "garden egg": "Garden Eggs",
  "garden eggs": "Garden Eggs",
  cabbage: "Cabbage",
  carrot: "Carrot",
  carrots: "Carrot",
  "leafy greens": "Leafy Greens",
  cassava: "Cassava",
  yam: "Yam",
  yams: "Yam",
  cocoyam: "Cocoyam",
  cocoyams: "Cocoyam",
  kokoyam: "Cocoyam",
  kokoyams: "Cocoyam",
  taro: "Cocoyam",
  "sweet potato": "Sweet Potato",
  "sweet potatoes": "Sweet Potato",
  plantain: "Plantain",
  plantains: "Plantain",
  rice: "Rice",
  beans: "Beans",
  soybean: "Soybeans",
  soybeans: "Soybeans",
  soyabean: "Soybeans",
  soyabeans: "Soybeans",
  "soya bean": "Soybeans",
  "soya beans": "Soybeans",
  cowpea: "Cowpea",
  cowpeas: "Cowpea",
  groundnut: "Groundnut",
  groundnuts: "Groundnut",
  granut: "Groundnut",
  granuts: "Groundnut",
  peanut: "Groundnut",
  peanuts: "Groundnut",
  goat: "Goats",
  goats: "Goats",
  poultry: "Poultry",
  fowl: "Poultry",
  fowls: "Poultry",
  fish: "Fish",
  catfish: "Catfish",
  cattle: "Cattle",
  sheep: "Sheep",
  egg: "Eggs",
  eggs: "Eggs",
  vegetables: "Vegetables",
  fruits: "Fruits",
  livestock: "Livestock"
};

const SUPPLIER_CATEGORY_IMAGE_MAP: Record<string, string> = {
  seeds: "/images/marketplace/farm-inputs.jpg",
  fertilizers: "/images/marketplace/farm-inputs.jpg",
  agrochemicals: "/images/marketplace/farm-inputs.jpg",
  "farm equipment": "/images/marketplace/farm-activity-2.jpg",
  "irrigation systems": "/images/marketplace/river-supply-chain.jpg",
  packaging: "/images/marketplace/produce-packaging.jpg",
  logistics: "/images/marketplace/logistics-truck.jpg",
  storage: "/images/marketplace/logistics-truck.jpg",
  "financial services": "/images/suppliers/supplier-10.jpg",
  "agricultural consulting": "/images/marketplace/farm-activity-2.jpg"
};

function normalizeProductKey(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function titleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(" ");
}

export function productDisplayName(value: string) {
  const key = normalizeProductKey(value);
  return DISPLAY_NAME_MAP[key] ?? titleCase(key || value);
}

export function cleanProductList(products: string[]) {
  const seen = new Set<string>();

  return products
    .map(productDisplayName)
    .filter((product) => {
      const key = normalizeProductKey(product);
      if (!key || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}

export function productImageForName(product: string, category?: string) {
  const key = normalizeProductKey(product);
  const categoryKey = normalizeProductKey(category ?? "");
  const words = new Set(key.split(" ").filter(Boolean));
  const directKey = key
    ? Object.keys(PRODUCT_IMAGE_MAP)
        .sort((a, b) => b.length - a.length)
        .find((candidate) => key === candidate || key.includes(candidate) || words.has(candidate))
    : undefined;

  if (directKey) {
    return PRODUCT_IMAGE_MAP[directKey];
  }

  const categoryMatch = Object.keys(CATEGORY_IMAGE_MAP).find((candidate) => categoryKey === candidate || categoryKey.includes(candidate));

  if (categoryMatch) {
    return CATEGORY_IMAGE_MAP[categoryMatch];
  }

  return "/images/marketplace/farm-activity-1.jpg";
}

export function productImageForListing(product: string, category?: string, existingImage?: string | null) {
  const genericImages = new Set([
    "/images/marketplace/farm-activity-1.jpg",
    "/images/marketplace/farm-activity-2.jpg",
    "/images/marketplace/ghana-market-1.jpg",
    "/images/marketplace/ghana-market-2.jpg",
    "/images/marketplace/aggregation-cocoa.jpg",
    "/images/marketplace/river-supply-chain.jpg",
    "/images/marketplace/yam-cassava.jpg"
  ]);

  if (existingImage && !genericImages.has(existingImage)) {
    return existingImage;
  }

  return productImageForName(product, category);
}

export function supplierServiceImageForName(service: string, category?: string, existingImage?: string | null) {
  const categoryKey = normalizeProductKey(category ?? "");

  if (existingImage && !existingImage.includes("/images/suppliers/supplier-")) {
    return existingImage;
  }

  const serviceImage = productImageForName(service, category);

  if (serviceImage !== "/images/marketplace/farm-activity-1.jpg") {
    return serviceImage;
  }

  return SUPPLIER_CATEGORY_IMAGE_MAP[categoryKey] ?? existingImage ?? "/images/suppliers/supplier-1.jpg";
}
