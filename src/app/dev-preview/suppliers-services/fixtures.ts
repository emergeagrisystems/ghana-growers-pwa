import "server-only";
import type {Provider} from "@/lib/suppliers-preview";
import {supplierCategories as c} from "@/lib/suppliers-preview";
export function getProviderFixtures():Provider[]{
 if(process.env.VERCEL_ENV==="production")throw new Error("Protected supplier fixtures unavailable in Production");
 const data:Array<[number,string,Provider["type"],string,string[],string[],Provider["areaState"]]>=[
 [0,"Ashanti","Both","Kumasi",["Ashanti","Bono East"],["Vegetable seeds","Farm inputs"],"Participant-reported"],
 [1,"Eastern","Supplier","Koforidua",["Eastern","Ashanti"],["Fertilizers","Farm inputs"],"Participant-reported"],
 [2,"Northern","Both","Tamale",["Northern"],["Tools","Equipment services"],"Participant-reported"],
 [5,"Volta","Both","Ho",["Volta","Eastern"],["Transport services","Packaging"],"Participant-reported"],
 [3,"Bono East","Service Provider","Techiman",["Bono East","Ashanti"],["Irrigation support","Water-system planning"],"Participant-reported"],
 [4,"Ashanti","Service Provider","Kumasi",[],["Mechanisation support","Field equipment services"],"Needs confirmation"],
 [6,"Greater Accra","Supplier","Accra",["Greater Accra","Eastern"],["Packaging materials","Storage support"],"Participant-reported"],
 [7,"Western","Service Provider","Takoradi",["Western"],["Field support","Agronomy support"],"Information under review"]
 ];
 return data.map(([category,baseRegion,type,base,serves,offerings,areaState],i)=>({id:"p09-preview-supplier-"+String(i+1).padStart(2,"0"),name:"Preview Supplier "+String(i+1).padStart(2,"0"),category:c[category],type,base,baseRegion,serves,offerings,areaState,about:"Synthetic provider profile for reviewing agricultural support discovery. These example offerings do not establish any real business, capacity or availability."}));
}
