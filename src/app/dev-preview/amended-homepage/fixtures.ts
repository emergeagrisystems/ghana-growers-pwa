import "server-only";
import type { HomepageData } from "@/lib/homepage/discovery";

/** P09-2 founder-authorised synthetic display fixtures. Never import into public routes.
 * No real identities, contacts, photographs, coordinates, prices, availability,
 * verification claims, agronomic advice, database writes or operational destinations.
 * Regions and product words are search vocabulary, not claims about real businesses.
 */
export function getHomepagePreviewFixtures(scenario: string | undefined): HomepageData {
  if (process.env.VERCEL_ENV === "production") throw new Error("Preview fixtures are unavailable in Production");
  const provenance = "preview-fixture" as const;
  if (scenario === "unavailable") return { provenance, directory: {status:"unavailable",items:[]}, listings:{status:"unavailable",items:[]}, resources:{status:"unavailable",items:[]} };
  if (scenario === "empty") return { provenance, directory: {status:"ready",items:[]}, listings:{status:"ready",items:[]}, resources:{status:"unavailable",items:[]} };
  return {
    provenance,
    directory: {status:"ready",items:[
      {id:"p09-preview-farmer-01",kind:"farmer",name:"Preview Farmer 01",region:"Ashanti",products:["Tomatoes","Vegetables"]},
      {id:"p09-preview-farmer-02",kind:"farmer",name:"Preview Farmer 02",region:"Eastern",products:["Pineapple","Fruits"]},
      {id:"p09-preview-farmer-03",kind:"farmer",name:"Preview Farmer 03",region:"Northern",products:["Goats","Livestock"]},
      {id:"p09-preview-farmer-04",kind:"farmer",name:"Preview Farmer 04",region:"Volta",products:["Peppers","Vegetables"]},
      {id:"p09-preview-supplier-01",kind:"supplier",name:"Preview Supplier 01",region:"Ashanti",products:["Seeds","Farm inputs"]},
      {id:"p09-preview-supplier-02",kind:"supplier",name:"Preview Supplier 02",region:"Eastern",products:["Fertilizers","Farm inputs"]},
      {id:"p09-preview-supplier-03",kind:"supplier",name:"Preview Supplier 03",region:"Northern",products:["Tools","Equipment services"]},
      {id:"p09-preview-supplier-04",kind:"supplier",name:"Preview Supplier 04",region:"Volta",products:["Transport services","Packaging"]}
    ]},
    listings: {status:"ready",items:["Vegetables","Fruits","Livestock","Farm inputs"].flatMap((category, categoryIndex) =>
      Array.from({length:4},(_,index)=>({id:`p09-preview-listing-${categoryIndex}-${index}`,title:`Preview ${category} ${String(index+1).padStart(2,"0")}`,category,seller:`Preview Seller ${String(index+1).padStart(2,"0")}`,location:["Ashanti","Eastern","Northern","Volta"][index]})))},
    // Founder-authorised neutral layout placeholders, not reviewed editorial content.
    resources: {status:"ready",items:[
      {id:"p09-preview-resource-guide",title:"Preview guide layout",format:"Guide"},
      {id:"p09-preview-resource-visual",title:"Preview visual layout",format:"Visual Explainer"},
      {id:"p09-preview-resource-video",title:"Preview video layout",format:"Video"}
    ]}
  };
}
