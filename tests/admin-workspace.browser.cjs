// Local Next.js production build. The only backend is a disposable in-memory HTTP fixture.
const http=require("node:http");
const {spawn}=require("node:child_process");
const assert=require("node:assert/strict");
const {once}=require("node:events");
const {chromium}=require(process.env.PLAYWRIGHT_PACKAGE||"playwright");
const id="8a203c01-f4aa-4000-8000-000000000001";
const receipt={id,company_name:"North Gate Kitchen (fictional)",requester_name:"Fictional buyer",status:"New",created_at:"2026-11-05T11:00:00Z",product_interest:"Peppers",quantity_needed:"Two crates",delivery_location:"Accra",phone:"0240000000",whatsapp:"0240000000",farmer_profile_id:"22222222-2222-4222-8222-222222222222"};
let quiet=false,failedTable="",writes=0;
const api=http.createServer((req,res)=>{
 const url=new URL(req.url,"http://localhost");res.setHeader("Content-Type","application/json");
 if(req.method!=="GET"){writes++;res.writeHead(405);res.end("{}");return}
 if(url.pathname==="/auth/v1/user"){const admin=req.headers.authorization==="Bearer local-staff-fixture";res.end(JSON.stringify({id:"11111111-1111-4111-8111-111111111111",email:"fixture@example.invalid",app_metadata:admin?{role:"admin"}:{}}));return}
 const table=url.pathname.split("/").at(-1);
 if(table===failedTable){res.writeHead(503);res.end("{}");return}
 let rows=[];
 if(table==="lead_requests"&&!quiet)rows=[receipt];
 if(table==="suppliers")rows=[{id,slug:null,company_name:"Fictional Supplier",contact_person:"Fixture",region:"Central",district:"Test",category:"Storage",status:"Pending",products_services:["Storage"],created_at:receipt.created_at,updated_at:receipt.created_at}];
 if(table==="farmers")rows=[{id,slug:"fictional-farm",farm_name:"Fictional Farm",region:"Central",status:"Active",verification_status:"Verified",launch_ready:true,products:["Okra"]}];
 if(table==="farmers"&&url.searchParams.get("select")?.startsWith("name:farm_name"))rows=[{name:"Fictional Farm",phone:"0200000001",whatsapp:null}];
 res.end(JSON.stringify(rows));
});
async function listen(server){server.listen(0,"127.0.0.1");await once(server,"listening");return server.address().port}
async function run(){
 const evidence=process.env.ADMIN_TEST_SCREENSHOTS;
 if(evidence)require("node:fs").mkdirSync(evidence,{recursive:true});
 const dbPort=await listen(api);
 const reservation=http.createServer();const port=await listen(reservation);await new Promise(r=>reservation.close(r));
 const base="http://127.0.0.1:"+port;
 const app=spawn(process.execPath,["node_modules/next/dist/bin/next","start","-H","127.0.0.1","-p",String(port)],{env:{...process.env,NEXT_PUBLIC_SUPABASE_URL:"http://127.0.0.1:"+dbPort,NEXT_PUBLIC_SUPABASE_ANON_KEY:"fictional-anon",SUPABASE_SERVICE_ROLE_KEY:"fictional-service",ADMIN_EMAIL_ALLOWLIST:"",SITE_PRELAUNCH:"false",VERCEL_ENV:"",NEXT_PUBLIC_RC1_PREVIEW:"false"},stdio:["ignore","pipe","pipe"]});
 app.stdout.on("data",buf=>process.stdout.write(buf));app.stderr.on("data",buf=>process.stderr.write(buf));
 let browser;
 try{
   let ready=false,last="";for(let i=0;i<60;i++){try{const r=await fetch(base+"/admin",{redirect:"manual"});last=r.status+" "+(r.headers.get("location")||"");if(r.status===307&&last.includes("/admin/login")){ready=true;break}if(r.status===200&&(await r.text()).includes('url=/admin/login')){ready=true;break}}catch(err){last=err.cause?.code||err.message;}await new Promise(r=>setTimeout(r,400))}
   assert.ok(ready,"Anonymous admin must redirect to sign-in: "+last);
   const forbidden=await fetch(base+"/api/admin/case-seller?case="+id,{headers:{cookie:"ghana_growers_admin_access_token=ordinary-fixture"}});assert.equal(forbidden.status,401);
   browser=await chromium.launch({executablePath:process.env.CHROME_PATH||undefined,headless:true});
   for(const width of [1440,390]){
     const ctx=await browser.newContext({viewport:{width,height:width===390?844:900}});
     await ctx.route("**/*",route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
     await ctx.addCookies([{name:"ghana_growers_admin_access_token",value:"local-staff-fixture",url:base}]);
     const page=await ctx.newPage();page.setDefaultTimeout(7000);
     await page.goto(base+"/admin");await page.getByRole("heading",{name:"Today’s work"}).waitFor();
     assert.equal(await page.locator("a").filter({hasText:/waiting/}).count(),4);
     assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
     if(evidence)await page.screenshot({path:require("node:path").join(evidence,"today-"+width+".png")});
     if(width===390){await page.getByRole("button",{name:"Menu",exact:true}).click();await page.getByRole("dialog",{name:"Admin menu"}).waitFor();await page.keyboard.press("Escape");assert.equal(await page.getByRole("button",{name:"Menu",exact:true}).evaluate(e=>e===document.activeElement),true)}
     await page.goto(base+"/admin?view=find");const search=page.getByLabel("Find by reference, name or phone");await search.fill("BR-8A203C01F4");await page.getByRole("button",{name:"Open BR-8A203C01F4"}).click();
     await page.getByRole("heading",{name:receipt.company_name}).waitFor();assert.equal(await page.getByRole("link",{name:"Skip to work"}).count(),1);
     assert.equal(await page.getByRole("button",{name:"Open WhatsApp"}).isDisabled(),true);
     await page.getByRole("checkbox",{name:/I checked these numbers/}).check();assert.match(await page.getByRole("link",{name:"Open WhatsApp"}).getAttribute("href"),/^https:\/\/wa\.me\/233240000000/);
     if(evidence)await page.screenshot({path:require("node:path").join(evidence,"buyer-"+width+".png")});
     await page.getByRole("button",{name:"View linked seller contact"}).click();
     const sellerPanel=page.locator("section").filter({has:page.getByRole("heading",{name:"Check seller availability",exact:true})}).last();
     await sellerPanel.getByRole("checkbox").check();assert.equal(await sellerPanel.getByRole("link",{name:"Call seller"}).getAttribute("href"),"tel:+233200000001");assert.ok(await sellerPanel.getByRole("button",{name:"Open WhatsApp"}).isDisabled());
     await page.getByRole("button",{name:"Buyer history"}).click();await page.keyboard.press("Escape");
     await page.getByLabel("Private note · unsaved draft").fill("Call Thursday to confirm quantity.");
     assert.ok(await page.getByRole("button",{name:"Save handover"}).isDisabled());
     page.once("dialog",dialog=>dialog.accept());await page.getByRole("button",{name:"Back to results"}).click();
     await search.waitFor();assert.equal(await search.inputValue(),"BR-8A203C01F4");
     await page.goto(base+"/admin?view=profiles");await page.getByLabel("Search profiles").fill("Fictional Farm");await page.getByRole("link",{name:"Open / edit"}).waitFor();assert.ok(await page.getByRole("link",{name:"Preview",exact:true}).getAttribute("href"));
     await page.goto(base+"/admin?view=tools");await page.getByRole("heading",{name:"All admin tools"}).waitFor();assert.ok(await page.getByText("Imported Farmers Pending Review",{exact:true}).isVisible());
     await page.goto(base+"/admin/profiles/supplier/"+id);
     await page.getByRole("button",{name:"Media & documents"}).click();
     let uploads=0;page.on("request",r=>{if(r.method()!=="GET"&&r.url().includes("/api/admin/"))uploads++});
     await page.locator('input[type="file"]').first().setInputFiles({name:"fixture.png",mimeType:"image/png",buffer:Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a4A0AAAAASUVORK5CYII=","base64")});
     await page.locator('img[src^="blob:"]').waitFor();assert.equal(uploads,0);assert.ok(await page.getByRole("button",{name:"Save Changes"}).isDisabled());
     await page.getByRole("button",{name:"Reset",exact:true}).click();assert.equal(await page.locator('img[src^="blob:"]').count(),0);
     quiet=true;await page.goto(base+"/admin");await page.getByText("No waiting records").first().waitFor();
     failedTable="lead_requests";await page.reload();await page.getByText("Buyer queue unavailable.").waitFor();
     failedTable="";quiet=false;await ctx.close();console.log("PASS local admin journey at "+width+"px");
   }
   assert.equal(writes,0,"No backend mutation attempted");
 }finally{if(browser)await browser.close();app.kill();api.closeAllConnections();api.close()}
}
run().catch(err=>{console.error(err);process.exitCode=1});
