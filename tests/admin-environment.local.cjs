// Actual built Next routes, loopback backend only, no hosted credentials or records.
const assert=require('node:assert/strict'),http=require('node:http'),path=require('node:path');
const {spawn}=require('node:child_process'),{once}=require('node:events');
const prod='https://bfasogvmesswweribsji.supabase.co',stage='https://ecluxmyxqofkbzcyurlf.supabase.co';
async function listen(server){server.listen(0,'127.0.0.1');await once(server,'listening');return server.address().port;}
(async()=>{
 let calls=0;const backend=http.createServer((req,res)=>{calls++;res.writeHead(500);res.end()});const db=await listen(backend);
 try{
 for(const [label,environment,url,flag,ready,expected] of [
  ['Production rejects staging','production',stage,'false','false',404],
  ['Production rejects Preview marker','production',prod,'true','false',404],
  ['Production needs no staging readiness','production',prod,'false','',401],
  ['Preview rejects Production','preview',prod,'true','true',503],
  ['Preview rejects missing readiness','preview',stage,'true','',503],
  ['Preview accepts isolated staging','preview',stage,'true','true',401],
  ['Unknown runtime rejects CRM','unknown',stage,'true','true',404]
 ]){
  const reservation=http.createServer(),port=await listen(reservation);await new Promise(r=>reservation.close(r));
  const app=spawn(process.execPath,['--require',path.resolve('tests/staging/loopback-fetch.cjs'),'node_modules/next/dist/bin/next','start','-H','127.0.0.1','-p',String(port)],{env:{...process.env,GG_TEST_ORIGIN:'http://127.0.0.1:'+db,VERCEL_ENV:environment,NEXT_PUBLIC_SUPABASE_URL:url,NEXT_PUBLIC_RC1_PREVIEW:flag,RC1_STAGING_READY:ready,SUPABASE_SERVICE_ROLE_KEY:'fictional-service',NEXT_PUBLIC_SUPABASE_ANON_KEY:'fictional-anon',SITE_PRELAUNCH:'false',NEXT_TELEMETRY_DISABLED:'1'},stdio:['ignore','pipe','pipe']});
  app.stdout.resume();app.stderr.resume();
  try{
   let response;for(let i=0;i<60;i++){try{response=await fetch(`http://127.0.0.1:${port}/api/admin/case-work`);break}catch{await new Promise(r=>setTimeout(r,200))}}
   assert.equal(response?.status,expected,label);assert.equal(calls,0,'No backend request without a valid runtime and authenticated session');console.log('PASS '+label);
  }finally{app.kill();await once(app,'exit');}
 }
 }finally{backend.closeAllConnections();backend.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
