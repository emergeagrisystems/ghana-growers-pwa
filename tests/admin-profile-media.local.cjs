// Exercise the real profile Save and promotion functions with in-memory storage and a versioned row.
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),Module=require("node:module"),ts=require("typescript");
const originalLoad=Module._load;
const id="01234567-89ab-4123-8123-123456789abc", staged="editor-staging/"+id+"/fixture.png";
const data=new Uint8Array([7,12,16]).buffer;
let profile, objects, unknown=false;
const storageKey=(bucket,key)=>bucket+"/"+key;
const io={
  async selectSupabaseRecords(table,query){return {status:200,data:query.includes("id=neq.")||table.endsWith("applications")?[]:[structuredClone(profile)]}},
  async updateSupabaseRecord(table,filter,patch){
    assert.ok(filter.includes("&updated_at=eq."));if(!filter.endsWith("=eq."+encodeURIComponent(profile.updated_at)))return {status:200};
    profile={...profile,...patch,updated_at:"2026-11-09T10:05:00.000Z"};
    return unknown?{status:503,error:"ack unavailable"}:{status:200,data:{...profile}};
  },
  async insertSupabaseRecord(){return {status:404,error:"audit unavailable"}},
  async uploadSupabaseStorageObject({bucket,path,body,overwrite}){assert.equal(overwrite,false);const key=storageKey(bucket,path);assert.ok(!objects.has(key));objects.set(key,body);return {path,publicUrl:"https://fixture.invalid/"+key,status:201}},
  async downloadSupabaseStorageObject({bucket,path}){const body=objects.get(storageKey(bucket,path));return body?{status:200,body,contentType:"image/png"}:{status:404,error:"missing"}},
  async deleteSupabaseStorageObject({bucket,path}){objects.delete(storageKey(bucket,path));return {status:200}}
};
Module._load=function(name,parent,isMain){
  if(name==="server-only")return {};
  if(name==="@/lib/supabase/admin")return io;
  if(name==="@/lib/supabase/publicData")return {mapFarmerPublicProfile:r=>({name:r.farm_name}),mapSupplierPublicProfile:r=>({name:r.company_name})};
  if(name.startsWith("@/"))name=path.resolve("src",name.slice(2))+".ts";
  return originalLoad.call(this,name,parent,isMain);
};
require.extensions[".ts"]=function(mod,file){const source=fs.readFileSync(file,"utf8");mod._compile(ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText,file)};
global.fetch=()=>{throw Error("Network prohibited in profile test")};
const {saveAdminProfile}=require("../src/lib/adminProfileEditor.ts");
const {logAdminActivity}=require("../src/lib/adminActivity.ts");
const base="2026-11-09T10:00:00.000Z";
function reset(){unknown=false;objects=new Map([[storageKey("farmer-application-media",staged),data]]);
  profile={id,updated_at:base,created_at:base,slug:null,farm_name:"Fixture",farmer_name:"Fixture",region:"Central",district:"Test",products:[],farm_photo_urls:[],produce_photo_urls:[],launch_checklist:{},status:"Pending",verification_status:"Pending"};}
function save(){return saveAdminProfile({kind:"farmer",recordKey:id,version:base,changes:{},stagedMedia:[{target:"farm_photo_urls",path:staged,position:0}],adminEmail:"fixture@example.invalid"})}
(async()=>{
  reset();
  const results=await Promise.all([save(),save()]);assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
  assert.equal(profile.farm_photo_urls.length,1);assert.equal(objects.size,1);
  assert.ok(objects.has(profile.farm_photo_urls[0].replace("https://fixture.invalid/","")));
  reset();unknown=true;
  const lost=await save();assert.equal(lost.status,503);assert.ok(objects.has(profile.farm_photo_urls[0].replace("https://fixture.invalid/","")));
  assert.ok(objects.has(storageKey("farmer-application-media",staged)));
  assert.equal((await save()).status,409);
  const result=await logAdminActivity({adminEmail:"fixture@example.invalid",actionType:"Edit",entityType:"Farmer",entityName:"Fixture"});
  assert.equal(result.ok,false);
  const stale=await saveAdminProfile({kind:"supplier",recordKey:id,version:base,changes:{district:"Test"},adminEmail:"fixture@example.invalid"});
  assert.equal(stale.status,409);
  console.log("PASS concurrent farmer Save, winner image preserved, lost acknowledgement, safe retry, supplier version and missing audit");
})().catch(error=>{console.error(error);process.exitCode=1});
