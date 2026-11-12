// Exercises the real admin routes and React controls with a loopback-only Supabase fixture.
const {chromium}=require(process.env.PLAYWRIGHT_PACKAGE||"playwright");
const assert=require("node:assert/strict"),http=require("node:http"),{once}=require("node:events");
const {spawn}=require("node:child_process"),path=require("node:path"),{createHash}=require("node:crypto");
const id="8a203c01-f4aa-4000-8000-000000000001", actor="11111111-1111-4111-8111-111111111111";
const stage="https://ecluxmyxqofkbzcyurlf.supabase.co", t=n=>"2026-11-10T10:00:0"+n+"Z";
const image=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a4A0AAAAASUVORK5CYII=","base64");
const initial={id,slug:null,company_name:"Fictional Supplier",contact_person:"Fixture",region:"Central",district:"Fixture",category:"Storage",products_services:[],status:"Pending",created_at:t(0),updated_at:t(1),logo_url:null,launch_ready:false};
const receipt={id,company_name:"Fictional Buyer",requester_name:"Fictional",status:"New",created_at:"2024-01-01T00:00:00Z",phone:"0240000000",whatsapp:"0240000000",product_interest:"Peppers"};
const priorId="abcdef99-12aa-4000-8000-000000000002", buyer="bbbbbbbb-2222-4222-8222-000000000001";
const farmerId="ff002211-0000-4000-8000-000000000003";
const priorReceipt={...receipt,id:priorId,company_name:"Fictional Buyer",product_interest:"Maize",quantity_needed:"Two sacks",delivery_location:"Accra"};
receipt.updated_at="2026-11-10T09:00:00.123456+00:00";receipt.source_type="Buyer Request";receipt.source_name="Fixture";receipt.location="Accra";
priorReceipt.source_type="Buyer Request";priorReceipt.updated_at=t(0);
const follow={action:null,due:null,owner:actor};
let todayUnavailable=false,loseStatus=false;
const farmer={id:farmerId,farm_name:"Fictional Farm",region:"Central",district:"Fixture",products:[]};
let timeline=[],link=null,loseReply=false;
const objects=new Map(),attempts=[],commands=[]; let profile={...initial},job,version=1,caseNote="Previous note";
const api=http.createServer(async(req,res)=>{
  const u=new URL(req.url,"http://localhost");
  function send(data,status=200){res.writeHead(status,{"Content-Type":"application/json"});res.end(JSON.stringify(data))}
  if(u.pathname==="/auth/v1/user")return send(req.headers.authorization==="Bearer local-staff-fixture"?{id:actor,email:"fixture@example.invalid",app_metadata:{role:"admin"}}:{},req.headers.authorization==="Bearer local-staff-fixture"?200:401);
  if(u.pathname.startsWith("/storage/v1/object/")){
    const key=u.pathname.slice("/storage/v1/object/".length).replace(/^authenticated\//,"");
    if(req.method==="POST"){const parts=[];for await(const c of req)parts.push(c);if(objects.has(key))return send({error:"Duplicate"},409);objects.set(key,Buffer.concat(parts));return send({Key:key});}
    if(!objects.has(key))return send({},404);res.writeHead(200,{"Content-Type":"image/png"});return res.end(objects.get(key));
  }
  const name=u.pathname.split("/").at(-1);
  if(req.method==="GET"){
    if(name==="suppliers"||name==="farmers"){
      const seller=name==="farmers"?farmer:profile,filter=u.searchParams.get("id");
      if(filter?.startsWith("eq.")&&filter.slice(3)!==seller.id)return send([]);
      const row={...seller,name:seller.farm_name||seller.company_name};
      return send(req.headers.accept?.includes("vnd.pgrst.object")?row:[row]);
    }
    if(name==="lead_requests")return send(u.searchParams.has("id")?[priorReceipt]:[receipt,priorReceipt]);
    return send([]);
  }
  const chunks=[];for await(const c of req)chunks.push(c);const b=JSON.parse(Buffer.concat(chunks).toString()||"{}");
  const stale=()=>send({code:"PT409",message:"Reviewed conflict",details:null,hint:null},409);
  if(name==="staff_today"){
    assert.equal(b.p_actor,actor);assert.ok(Math.abs(Date.now()-Date.parse(b.p_now))<60000);
    if(todayUnavailable)return send({message:"Unavailable"},503);
    const due=follow.owner===actor && follow.due && follow.due.slice(0,10)<=b.p_now.slice(0,10);
    return send({my_follow_ups:due?[{request_id:id,next_action:follow.action,due_at:follow.due,version}]:[]});
  }
  if(name==="admin_activity_log")return send({message:"Audit unavailable"},503);
  if(name==="staff_case_read"){
    if(b.p_request===priorId)return send({request_id:priorId,buyer_id:buyer,version:1,confirmed_history:[],timeline:[]});
    const first=timeline.find(e=>e.first_buyer_reply);
    return send({request_id:id,version,status:receipt.status,lead_updated_at:receipt.updated_at,next_action:follow.action,due_at:follow.due,latest_note:{text:caseNote},owner_id:actor,first_reply:first||null,timeline,
      link_id:link,confirmed_history:link===priorId?[{request_id:priorId,received_at:priorReceipt.created_at,status:"New",sellers_contacted:[{seller_type:"farmer",seller_id:farmerId,contact_count:1}]}]:[]});
  }
  if(name==="staff_case_command"){
    commands.push(b);
    const previous=timeline.find(e=>e.id===b.p_operation);
    if(previous){
      assert.deepEqual(b,commands.find(c=>c.p_operation===b.p_operation));
      return send({operation_id:b.p_operation,event_id:previous.id,version:previous.version});
    }
    if(version!==b.p_expected_version)return stale();
    assert.equal(b.p_actor,actor);assert.equal(b.p_request,id);
    const input=b.p_input,kind=b.p_kind;
    if(kind==="status"){
      if(input.lead_updated_at!==receipt.updated_at)return stale();
      receipt.status=input.status;receipt.updated_at=new Date(Date.parse(receipt.updated_at)+1).toISOString();
    }
    if(kind==="follow_up_set"){follow.action=input.next_action;follow.due=input.due_at;}
    if(kind==="follow_up_completed"){assert.ok(follow.action);follow.action=null;follow.due=null;}
    if(kind==="note")caseNote=input.note;
    if(kind==="link")link=input.buyer_id===buyer?priorId:id;
    if(kind==="unlink"){assert.equal(input.link_id,link);link=null;}
    const first=kind==="buyer_contact"&&input.reply&&!timeline.some(e=>e.first_buyer_reply);
    if(kind.endsWith("_contact")||kind==="link"||kind==="unlink")assert.equal(input.confirmed,true);
    timeline.unshift({id:b.p_operation,version:version+1,actor_id:actor,kind,input,first_buyer_reply:first,channel:input.channel,occurred_at:input.occurred_at||t(1),
      farmer_id:input.seller_type==="farmer"?input.seller_id:null,supplier_id:input.seller_type==="supplier"?input.seller_id:null});
    version++;
    if(first&&loseReply){loseReply=false;return send({message:"Acknowledgement lost"},503);}
    if(kind==="status"&&loseStatus){loseStatus=false;return send({message:"Acknowledgement lost"},503);}
    return send({operation_id:b.p_operation,event_id:b.p_operation,version});
  }
  if(name==="staff_supplier_media_save"){
    attempts.push(b);
    if(job?.job_id===b.p_operation)return send(job.receipt);
    if(profile.updated_at!==b.p_base_version)return stale();
    const publicKey="editor-uploads/"+id+"/"+b.p_field+"/"+b.p_operation+".png";
    assert.equal(b.p_digest,createHash("sha256").update(image).digest("hex"));profile.updated_at=t(3);
    job={job_id:b.p_operation,supplier_id:id,public_key:publicKey,staged_key:b.p_staged_key,mime:"image/png",bytes:image.length,digest:b.p_digest,receipt:{job_id:b.p_operation,saved_version:t(3)}};
    // Save committed, acknowledgement lost. An explicit retry must use exactly the same intent.
    return send({message:"Acknowledgement lost"},503);
  }
  if(name==="staff_supplier_media_lease")return send({...job,result:"leased",lease_id:b.p_lease,lease_until:new Date(Date.now()+120000).toISOString()});
  if(name==="staff_supplier_media_finish"){profile.logo_url=stage+"/storage/v1/object/public/suppliers/"+job.public_key;profile.updated_at=t(4);return send({result:"attached",version:t(4)})}
  return send({},404);
});
async function port(server){server.listen(0,"127.0.0.1");await once(server,"listening");return server.address().port}
async function run(){
 const dbPort=await port(api), reserve=http.createServer(),appPort=await port(reserve);await new Promise(r=>reserve.close(r));const url="http://127.0.0.1:"+appPort;
 const app=spawn(process.execPath,["--require",path.resolve("tests/staging/loopback-fetch.cjs"),"node_modules/next/dist/bin/next","start","-H","127.0.0.1","-p",String(appPort)],{env:{...process.env,GG_TEST_ORIGIN:"http://127.0.0.1:"+dbPort,NEXT_PUBLIC_SUPABASE_URL:stage,NEXT_PUBLIC_SUPABASE_ANON_KEY:"fictional-anon",SUPABASE_SERVICE_ROLE_KEY:"fictional-service",ADMIN_EMAIL_ALLOWLIST:"",SITE_PRELAUNCH:"false",VERCEL_ENV:"preview",NEXT_PUBLIC_RC1_PREVIEW:"true",RC1_STAGING_READY:"true",VERCEL_BRANCH_URL:"ghana-growers-fixture.vercel.app",NEXT_TELEMETRY_DISABLED:"1"},stdio:["ignore","pipe","pipe"]});
 app.stdout.resume();app.stderr.on("data",data=>process.stderr.write(data));let browser;
 try{
  for(let n=0;n<65;n++){try{if((await fetch(url+"/admin",{redirect:"manual"})).status<500)break}catch{}await new Promise(r=>setTimeout(r,200))}
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined});
  const ctx=await browser.newContext({viewport:{width:390,height:844}});await ctx.addCookies([{name:"ghana_growers_admin_access_token",value:"local-staff-fixture",url}]);
  const page=await ctx.newPage();page.setDefaultTimeout(12000);
  await ctx.route("**/*",route=>{const u=new URL(route.request().url());return ["blob:","data:"].includes(u.protocol)||u.hostname==="127.0.0.1"?route.continue():route.abort()});
  const guest=await browser.newContext();
  assert.equal((await guest.request.post(url+"/api/admin/profile-editor/supplier-photo")).status(),401);
  assert.equal((await guest.request.post(url+"/api/admin/case-work")).status(),401);
  await guest.close();
  assert.equal((await ctx.request.post(url+"/api/admin/case-work",{headers:{Origin:"https://fixture.invalid"}})).status(),403);
  await page.goto(url+"/admin/profiles/supplier/"+id);
  await page.getByRole("button",{name:"Media & documents"}).click();
  await page.locator('input[type="file"]').first().setInputFiles({name:"test.png",mimeType:"image/png",buffer:image});
  const preview=page.locator('img[src^="blob:"]');await preview.waitFor();const selected=await preview.getAttribute("src");
  profile.updated_at=t(2);profile.logo_url="/fixture-winner.png";
  async function post(button,route){const response=page.waitForResponse(r=>r.url().endsWith(route)&&r.request().method()==="POST");await page.getByRole("button",{name:button,exact:true}).click();return (await response).status()}
  const photo="/api/admin/profile-editor/supplier-photo";
  assert.equal(await post("Save Changes",photo),409);await page.getByRole("button",{name:"Review latest profile"}).waitFor();
  assert.equal(await preview.getAttribute("src"),selected);assert.ok(await page.getByRole("button",{name:"Save Changes"}).isDisabled());assert.equal(attempts.length,1);assert.equal(profile.logo_url,"/fixture-winner.png");
  await page.getByRole("button",{name:"Review latest profile"}).click();await page.getByRole("link",{name:"View currently saved photo"}).waitFor();assert.equal(attempts.length,1);
  assert.equal(await post("Save Changes",photo),503);await page.getByRole("button",{name:"Retry same save"}).waitFor();assert.equal(await preview.getAttribute("src"),selected);
  assert.equal(await post("Retry same save",photo),200);await preview.waitFor({state:"detached"});
  assert.equal(attempts.length,3);assert.notEqual(attempts[0].p_operation,attempts[1].p_operation);assert.equal(attempts[1].p_base_version,t(2));assert.deepEqual(attempts[1],attempts[2]);assert.ok(profile.logo_url.endsWith(job.public_key));
  await page.goto(url+"/admin?view=find&record="+id);
  const note=page.getByRole("textbox",{name:/^Private note/});await note.fill("Fictional retained note");
  await page.getByText("Latest note · Previous note").waitFor();version++;caseNote="Newer staff note";
  assert.equal(await post("Save note or follow-up","/api/admin/case-work"),409);
  await page.getByRole("button",{name:"Review latest case"}).click();await page.getByText("Latest note · Newer staff note").waitFor();
  assert.equal(await note.inputValue(),"Fictional retained note");assert.equal(commands.length,1);
  assert.equal(await post("Save note or follow-up","/api/admin/case-work"),200);assert.equal(commands.length,2);assert.equal(commands[1].p_expected_version,2);
  console.log("PASS local HTTP routes and browser: stale photo and case return 409; file and note retained; review sends no write; deliberate reconciliation; lost Save acknowledgement reuses exact intent.");
  for(const width of [1440,390]){
    timeline=[];link=null;loseReply=true;
    await page.setViewportSize({width,height:width===390?844:900});await page.reload();
    const button=(name)=>page.getByRole("button",{name,exact:true}),caseRoute="/api/admin/case-work";
    const action=page.locator('dialog[aria-labelledby="case-action-title"]');
    const history=page.getByRole("dialog",{name:"Buyer history",exact:true});
    async function save(expected=200,label="Confirm and save"){
      const response=page.waitForResponse(r=>r.url().endsWith(caseRoute)&&r.request().method()==="POST");
      await action.getByRole("button",{name:label,exact:true}).click();
      assert.equal((await response).status(),expected);
      if(expected===200)await action.waitFor({state:"hidden"});
    }
    await page.getByText(/First reply outstanding/).first().waitFor();
    await page.getByRole("checkbox",{name:/intended buyer/}).check();
    const before=commands.length;
    // Intercept contact links locally. Exercise click handlers without contacting a real recipient.
    await page.evaluate(()=>document.addEventListener("click",e=>{if(e.target.closest?.('a[href^="tel:"],a[href^="https://wa.me/"]'))e.preventDefault()},true));
    await page.getByRole("link",{name:"Open WhatsApp"}).click();
    assert.equal(await page.getByRole("link",{name:"Call buyer"}).getAttribute("href"),"tel:+233240000000");
    await page.getByRole("link",{name:"Call buyer"}).click();await button("Copy number").click();
    assert.equal(commands.length,before);
    const bad=await ctx.request.post(url+caseRoute,{data:{id,version,operation:require("node:crypto").randomUUID(),kind:"seller_contact",
      input:{confirmed:true,channel:"phone",occurred_at:t(0),seller_type:"farmer",seller_id:actor}}});
    assert.equal(bad.status(),404);assert.equal(commands.length,before);
    for(const [type,target] of [["farmer",farmerId],["supplier",id]]){
      await button("Record seller contact").click();await action.getByLabel("Seller type").selectOption(type);
      await action.getByLabel("Seller business name").fill("Fictional");await button("Find sellers").click();
      await action.getByLabel("Matching sellers").selectOption(target);
      assert.ok(await button("Confirm and save").isDisabled());await action.getByLabel("I contacted the selected seller.").check();await save();
    }
    assert.deepEqual(timeline.map(e=>e.input.seller_id),[id,farmerId]);assert.ok(timeline.every(e=>e.first_buyer_reply===false));
    await button("Record first reply").click();await action.getByLabel("I actually replied to this buyer.").check();
    version++;await save(409);await action.getByRole("button",{name:"Review latest case"}).click();
    await action.getByText("Latest saved case",{exact:true}).waitFor();assert.ok(await button("Confirm and save").isDisabled());
    await action.getByLabel("I actually replied to this buyer.").check();await save(503);
    await save(200,"Retry same save");assert.deepEqual(commands.at(-2),commands.at(-1));
    assert.equal(timeline.filter(e=>e.first_buyer_reply).length,1);assert.equal(await button("Record first reply").count(),0);
    await button("Buyer history").click();await history.getByText(/No confirmed buyer history/).waitFor();
    await button("Establish buyer identity").click();await action.getByLabel(/Reason for confirming/).fill("Fictional buyer confirmed directly.");
    await action.getByLabel("I verified the buyer’s identity.").check();await save();await history.getByText(/No other requests/).waitFor();
    async function unlink(){
      await button("Unlink buyer").click();await action.getByLabel("Reason for unlinking").fill("Fictional correction confirmed.");
      await action.getByLabel("I confirm this request should be unlinked.").check();await save();
    }
    await unlink();
    await button("Link an earlier request").click();await action.getByLabel("Earlier BR reference").fill("BR-ABCDEF9912");await button("Check reference").click();
    await action.getByText(/BR-ABCDEF9912 · Fictional Buyer/).waitFor();
    await action.getByLabel(/Reason for confirming/).fill("Fictional buyer confirmed both references.");await action.getByLabel("I verified the buyer’s identity.").check();await save();
    await history.getByText(/Maize · Two sacks · Accra/).waitFor();await history.getByText("Sellers contacted · Fictional Farm").waitFor();
    await unlink();await history.getByText(/No confirmed buyer history/).waitFor();await button("Close history").click();
    assert.equal(timeline.filter(e=>e.kind==="seller_contact").length,2);assert.equal(timeline.filter(e=>e.kind==="unlink").length,2);
    await page.getByRole("heading",{name:"Fictional Buyer",exact:true}).waitFor();
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    console.log("PASS local CRM at "+width+"px: channel actions, checked seller selection, multiple sellers, first reply, conflict review, exact replay, confirmed history, audited unlink and return to case.");
  }
  for(const width of [1440,390]){
    await page.setViewportSize({width,height:width===390?844:900});
    const button=name=>page.getByRole("button",{name,exact:true});
    const goToday=()=>page.goto(url+"/admin");
    const goCase=()=>page.goto(url+"/admin?view=buyer&record="+id);
    const future=new Date(Date.now()+3*86400000).toISOString().slice(0,16);
    await goCase();await page.getByLabel("Next action",{exact:true}).fill("Fixture call");
    await page.getByLabel("Staff follow-up · GMT").fill(future);
    assert.equal(await post("Save note or follow-up","/api/admin/case-work"),200);
    await button("Complete follow-up").waitFor();assert.equal(follow.due.slice(0,16),future);
    await goToday();await page.getByText("No follow-ups due today or overdue.").waitFor();
    todayUnavailable=true;await goToday();await page.getByText("Follow-ups are unavailable.",{exact:false}).waitFor();todayUnavailable=false;
    follow.due=new Date().toISOString().slice(0,10)+"T23:59:59.999Z";follow.owner=farmerId;
    await goToday();await page.getByText("No follow-ups due today or overdue.").waitFor();
    follow.owner=actor;await goToday();await page.getByText("Due today",{exact:true}).waitFor();
    follow.due=new Date(Date.now()-86400000).toISOString();await goToday();
    await page.getByText("Overdue",{exact:true}).waitFor();
    await page.getByRole("link",{name:"Fictional Buyer · BR-8A203C01F4"}).click();await page.waitForURL(u=>u.searchParams.get("record")===id);
    await button("Complete follow-up").waitFor();await page.getByLabel("Private note",{exact:true}).fill("Unsaved draft");
    assert.ok(await button("Complete follow-up").isDisabled());await page.getByRole("textbox",{name:"Private note"}).fill("");
    const previouslyCompleted=timeline.filter(e=>e.kind==="follow_up_completed").length;
    version++;assert.equal(await post("Complete follow-up","/api/admin/case-work"),409);await button("Review latest case").click();
    assert.equal(await post("Complete follow-up","/api/admin/case-work"),200);await page.getByText("Follow-up completed",{exact:true}).nth(previouslyCompleted).waitFor();
    await page.reload();await page.getByText("Follow-up completed",{exact:true}).nth(previouslyCompleted).waitFor();assert.equal(await button("Complete follow-up").count(),0);
    assert.ok(timeline.some(e=>e.kind==="follow_up_set"));await goToday();await page.getByText("No follow-ups due today or overdue.").waitFor();

    await page.goto(url+"/admin?section=lead-queue");const dialog=page.getByRole("dialog",{name:"Change lead status"});
    async function start(){await button("Mark Contacted").click();await dialog.waitFor();}
    async function change(label="Save status"){
      const done=page.waitForResponse(r=>r.url().endsWith("/api/admin/lead-requests")&&r.request().method()==="PATCH");
      await dialog.getByRole("button",{name:label}).click();return (await done).status();
    }
    const original=receipt.updated_at,oldStatus=receipt.status,startCount=timeline.filter(e=>e.kind==="status").length;
    await start();receipt.updated_at=new Date(Date.parse(original)+10).toISOString();
    assert.equal(await change(),409);assert.equal(commands.at(-1).p_input.lead_updated_at,original);assert.equal(receipt.status,oldStatus);
    assert.equal(await dialog.getByLabel("Selected status").inputValue(),"Contacted");
    const calls=commands.length;await dialog.getByRole("button",{name:"Review latest lead"}).click();
    await dialog.getByText(/Latest status loaded/).waitFor();assert.equal(commands.length,calls);
    loseStatus=true;assert.equal(await change(),503);assert.equal(await change("Retry same status change"),200);await dialog.waitFor({state:"hidden"});
    assert.deepEqual(commands.at(-2),commands.at(-1));assert.equal(receipt.status,"Contacted");
    const refetched=receipt.updated_at;await start();await dialog.getByLabel("Selected status").selectOption("Negotiating");
    version++;assert.equal(await change(),409);await dialog.getByRole("button",{name:"Review latest lead"}).click();
    assert.equal(await change(),200);await dialog.waitFor({state:"hidden"});assert.equal(receipt.status,"Negotiating");
    assert.equal(commands.at(-1).p_input.lead_updated_at,refetched);
    await start();await dialog.getByLabel("Selected status").selectOption("New");assert.equal(await change(),200);await dialog.waitFor({state:"hidden"});
    assert.equal(timeline.filter(e=>e.kind==="status").length-startCount,3);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    console.log("PASS due/future/overdue, owner isolation, unavailable, completion/conflict and status stale/refetch/exact replay at "+width+"px");
  }
 }finally{if(browser)await browser.close();app.kill();api.closeAllConnections();api.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1});
