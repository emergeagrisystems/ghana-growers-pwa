import "server-only";
import { getHomepagePreviewFixtures } from "../amended-homepage/fixtures";
import type { FarmerFixture } from "@/lib/farmer-preview";
// Only 13 synthetic records: existing four homepage farmers + nine to exercise page 2.
// These are vocabulary/layout fixtures, never real identities or agricultural evidence.
export function getFarmerFixtures():FarmerFixture[] {
 if(process.env.VERCEL_ENV==="production")throw new Error("Farmer fixtures unavailable in Production");
 const existing=getHomepagePreviewFixtures(undefined).directory.items.filter(i=>i.kind==="farmer").map((i,index)=>({id:i.id,name:i.name,region:i.region,district:`Preview District ${String.fromCharCode(65+index)}`,products:i.products.filter(p=>!["Vegetables","Fruits","Livestock"].includes(p)),categories:i.products.filter(p=>["Vegetables","Fruits","Livestock"].includes(p)),farmType:index===2?"Livestock":"Crop"}));
 const groups=[{products:["Maize"],category:"Cereals"},{products:["Cassava"],category:"Tubers"},{products:["Tomatoes","Peppers","Okra","Cucumber","Onion","Cabbage","Carrots"],category:"Vegetables"}];
 return [...existing,...Array.from({length:9},(_,i)=>{const group=groups[i%3],base=existing[i%4];return {id:`p09-preview-farmer-${String(i+5).padStart(2,"0")}`,name:`Preview Farmer ${String(i+5).padStart(2,"0")}`,region:base.region,district:base.district,products:group.products,categories:[group.category],farmType:i===8?"Mixed":"Crop"};})];
}
