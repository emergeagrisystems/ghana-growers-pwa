export const marketplacePath = "/dev-preview/marketplace";
export const requestProducePath = "/dev-preview/request-produce";
export const marketplaceCategories = ["All", "Fresh Produce", "Farm Inputs", "Livestock", "Tools & Equipment"] as const;
export type MarketplaceFixture = { id:string; title:string; product:string; category:string; subcategory:string; seller:string; region:string; farmerId?:string; farmerName?:string; image?:{crop:string;src:string} };
export type MarketplaceState = { q:string; category:string; region:string; page:number; fixture:string };
export const blankMarketplace:MarketplaceState = {q:"",category:"",region:"",page:1,fixture:""};
const normal=(s:string)=>s.normalize("NFKC").trim().toLowerCase();
export function matchingListings(items:MarketplaceFixture[],state:MarketplaceState) {
 const terms=normal(state.q).split(/\s+/).filter(Boolean);
 return items.filter(i=>(!state.category||i.category===state.category)&&(!state.region||i.region===state.region)&&terms.every(t=>normal([i.title,i.product,i.category,i.subcategory,i.seller,i.region].join(" ")).includes(t))).sort((a,b)=>a.title.localeCompare(b.title,"en")||a.id.localeCompare(b.id));
}
export function marketplaceQuery(s:MarketplaceState) {const p=new URLSearchParams();for(const k of ["q","category","region","fixture"] as const)if(s[k])p.set(k,s[k]);if(s.page>1)p.set("page",String(s.page));return p.toString();}
export function marketplaceUrl(s:MarketplaceState) {const q=marketplaceQuery(s);return marketplacePath+(q?"?"+q:"");}
export function readMarketplace(p:URLSearchParams,items:MarketplaceFixture[]):MarketplaceState {
 const pick=(key:string,choices:string[])=>choices.find(c=>normal(c)===normal(p.get(key)||""))||"";
 const s={q:(p.get("q")||"").trim().slice(0,120),category:pick("category",[...marketplaceCategories.slice(1)]),region:pick("region",Array.from(new Set(items.map(i=>i.region)))),page:Math.max(1,Math.floor(Number(p.get("page"))||1)),fixture:pick("fixture",["empty","unavailable"])};
 s.page=Math.min(s.page,Math.max(1,Math.ceil(matchingListings(items,s).length/12)));return s;
}
export function safeMarketplaceReturn(raw:string|undefined,items:MarketplaceFixture[]) {
 try{const u=new URL(raw||marketplacePath,"https://preview.invalid");if(u.origin!=="https://preview.invalid"||u.pathname!==marketplacePath)return marketplacePath;const hash=/^#listing-p09-preview-listing-[0-3]-[0-3]$/.test(u.hash)?u.hash:"";return marketplaceUrl(readMarketplace(u.searchParams,items))+hash;}catch{return marketplacePath;}
}
export function listingUrl(id:string,back?:string) {return marketplacePath+"/"+encodeURIComponent(id)+(back?"?from="+encodeURIComponent(back):"");}
export function sourcingUrl(kind:"listing"|"farmer",id:string,back?:string) {const p=new URLSearchParams({[kind]:id});if(back)p.set("from",back);return requestProducePath+"?"+p;}
