const PRODUCT_IMAGE_MAP: Record<string, string> = {
  maize: "/images/marketplace/farm-activity-1.jpg",
  corn: "/images/marketplace/farm-activity-1.jpg",
  onion: "/images/marketplace/ghana-market-2.jpg",
  tomato: "/images/marketplace/fresh-tomatoes.jpg",
  pepper: "/images/crops/tomatoes.jpg",
  okra: "/images/marketplace/ghana-market-1.jpg",
  cassava: "/images/marketplace/yam-cassava.jpg",
  yam: "/images/crops/yam.jpg",
  plantain: "/images/crops/pineapple.jpg",
  rice: "/images/marketplace/river-supply-chain.jpg",
  beans: "/images/marketplace/aggregation-cocoa.jpg",
  soybeans: "/images/marketplace/farm-activity-1.jpg",
  groundnut: "/images/marketplace/aggregation-cocoa.jpg",
  peanut: "/images/marketplace/aggregation-cocoa.jpg",
  goat: "/images/marketplace/farm-activity-2.jpg",
  poultry: "/images/crops/poultry.jpg",
  fowl: "/images/crops/poultry.jpg",
  fish: "/images/marketplace/river-supply-chain.jpg",
  catfish: "/images/marketplace/river-supply-chain.jpg",
  cattle: "/images/marketplace/aggregation-cocoa.jpg",
  sheep: "/images/marketplace/farm-activity-2.jpg",
  eggs: "/images/crops/eggs.jpg",
  pineapple: "/images/crops/pineapple.jpg",
  mango: "/images/marketplace/pineapple-field.jpg",
  vegetables: "/images/marketplace/ghana-market-1.jpg",
  fruits: "/images/crops/pineapple.jpg",
  livestock: "/images/crops/poultry.jpg"
};

const CATEGORY_IMAGE_MAP: Record<string, string> = {
  vegetables: "/images/marketplace/ghana-market-1.jpg",
  fruits: "/images/crops/pineapple.jpg",
  tubers: "/images/marketplace/yam-cassava.jpg",
  cereals: "/images/marketplace/farm-activity-1.jpg",
  livestock: "/images/crops/poultry.jpg",
  "farm inputs": "/images/marketplace/farm-inputs.jpg",
  inputs: "/images/crops/inputs.jpg",
  packaging: "/images/marketplace/produce-packaging.jpg",
  logistics: "/images/marketplace/logistics-truck.jpg",
  services: "/images/marketplace/farm-activity-2.jpg"
};

const DISPLAY_NAME_MAP: Record<string, string> = {
  maize: "Maize",
  corn: "Maize",
  onion: "Onions",
  onions: "Onions",
  tomato: "Tomatoes",
  tomatoes: "Tomatoes",
  pepper: "Pepper",
  peppers: "Pepper",
  okra: "Okra",
  cassava: "Cassava",
  yam: "Yam",
  yams: "Yam",
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
  const directKey = key
    ? Object.keys(PRODUCT_IMAGE_MAP).find((candidate) => key === candidate || key.includes(candidate) || candidate.includes(key))
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
    "/images/marketplace/farm-activity-2.jpg"
  ]);

  if (existingImage && !genericImages.has(existingImage)) {
    return existingImage;
  }

  return productImageForName(product, category);
}
