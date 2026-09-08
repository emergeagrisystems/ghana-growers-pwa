import "server-only";
import { getHomepagePreviewFixtures } from "../amended-homepage/fixtures";
import { getHomepagePreviewMedia } from "../amended-homepage/media";
import type { MarketplaceFixture } from "@/lib/marketplace-preview";
// Existing sixteen synthetic listings; only product vocabulary and four explicit
// synthetic farmer relationships added. Images are existing Family A illustrations.
export function getMarketplaceFixtures():MarketplaceFixture[] {
 if(process.env.VERCEL_ENV==="production")throw new Error("Marketplace fixtures unavailable in Production");
 const media=getHomepagePreviewMedia();
 const products:Record<string,string[]>={Vegetables:["Tomatoes","Peppers","Onions","Garden eggs"],Fruits:["Pineapple","Mango","Plantain","Pineapple"],Livestock:["Goats","Sheep","Poultry","Cattle"],"Farm inputs":["Seeds","Fertilizers","Animal feed","Packaging"]};
 const relations:Record<string,[string,string]>={"p09-preview-listing-0-0":["01","Preview Farmer 01"],"p09-preview-listing-0-1":["04","Preview Farmer 04"],"p09-preview-listing-1-0":["02","Preview Farmer 02"],"p09-preview-listing-2-0":["03","Preview Farmer 03"]};
 return getHomepagePreviewFixtures(undefined).listings.items.map(i=>{const index=Number(i.id.split("-").at(-1)),product=products[i.category][index],relation=relations[i.id];return {id:i.id,title:i.title,product,category:["Vegetables","Fruits"].includes(i.category)?"Fresh Produce":i.category==="Farm inputs"?"Farm Inputs":i.category,subcategory:i.category,seller:i.seller,region:i.location,farmerId:relation?"p09-preview-farmer-"+relation[0]:undefined,farmerName:relation?.[1],image:(media.produce as Record<string,{crop:string;src:string}>)[product.toLowerCase()]};});
}
