export const farmerDirectoryPath = "/dev-preview/farmers";
export const farmerEntryPath = "/dev-preview/list-your-farm";
export const categories = ["All", "Vegetables", "Cereals", "Tubers", "Fruits", "Livestock"] as const;
export type FarmerFixture = { id:string; name:string; region:string; district:string; products:string[]; categories:string[]; farmType:string };
export type DirectoryState = { q:string; region:string; district:string; product:string; farmType:string; page:number; fixture:string };
export const blankDirectory: DirectoryState = {q:"",region:"",district:"",product:"",farmType:"",page:1,fixture:""};
export function values(items:FarmerFixture[],field:"region"|"district"|"farmType") {return Array.from(new Set(items.map(item=>item[field]).filter(Boolean))).sort();}
export function productValues(items:FarmerFixture[]) {return Array.from(new Set([...categories.slice(1),...items.flatMap(item=>item.products)])).sort();}
const normal=(text:string)=>text.normalize("NFKC").trim().toLocaleLowerCase("en");
export function matchingFarmers(items:FarmerFixture[],s:DirectoryState) {
 const terms=normal(s.q).split(/\s+/).filter(Boolean);
 return items.filter(item=>terms.every(term=>normal([item.name,item.region,item.district,...item.products].join(" ")).includes(term))&&(!s.region||item.region===s.region)&&(!s.district||item.district===s.district)&&(!s.product||item.products.includes(s.product)||item.categories.includes(s.product))&&(!s.farmType||item.farmType===s.farmType)).sort((a,b)=>a.name.localeCompare(b.name,"en")||a.id.localeCompare(b.id));
}
export function readDirectory(params:URLSearchParams,items:FarmerFixture[]):DirectoryState {
 const pick=(name:string,allowed:string[])=>{const v=params.get(name)||"";return allowed.find(x=>normal(x)===normal(v))||"";};
 const region=pick("region",values(items,"region"));
 const state={q:(params.get("q")||"").trim().slice(0,120),region,district:region?pick("district",values(items.filter(i=>i.region===region),"district")):"",product:pick("product",productValues(items)),farmType:pick("farmType",values(items,"farmType")),page:Math.max(1,Math.floor(Number(params.get("page"))||1)),fixture:pick("fixture",["empty","unavailable"])};
 state.page=Math.min(state.page,Math.max(1,Math.ceil(matchingFarmers(items,state).length/12)));return state;
}
export function directoryQuery(s:DirectoryState) {const p=new URLSearchParams();for(const key of ["q","region","district","product","farmType","fixture"] as const)if(s[key])p.set(key,s[key]);if(s.page>1)p.set("page",String(s.page));return p.toString();}
export function directoryUrl(s:DirectoryState) {const q=directoryQuery(s);return farmerDirectoryPath+(q?"?"+q:"");}
export function safeDirectoryReturn(raw:string|undefined,items:FarmerFixture[]) {
 try {const u=new URL(raw||farmerDirectoryPath,"https://preview.invalid");if(u.origin!=="https://preview.invalid"||u.pathname!==farmerDirectoryPath)return farmerDirectoryPath;const hash=/^#card-p09-preview-farmer-\d{2}$/.test(u.hash)?u.hash:"";return directoryUrl(readDirectory(u.searchParams,items))+hash;}catch{return farmerDirectoryPath;}
}
