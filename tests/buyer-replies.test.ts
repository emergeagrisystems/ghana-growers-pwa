import assert from "node:assert/strict";
import {buildReplyOverview,ghanaCalendar,unansweredState} from "../src/lib/buyerReplies";
import {readBuyerPages} from "../src/lib/buyerPages";

const start="2026-11-08T00:00:00Z";
const wait=(received:string, now:string)=>unansweredState(received,new Date(now),start,ghanaCalendar);
const fri="2026-11-13T19:15:00Z";
assert.equal(wait(fri,"2026-11-16T08:59:59Z"),"awaiting");
assert.equal(wait(fri,"2026-11-16T09:00:00Z"),"reminder");
assert.equal(wait(fri,"2026-11-17T17:00:00Z"),"reminder");
assert.equal(wait(fri,"2026-11-17T17:00:00.001Z"),"overdue");
assert.equal(wait("2026-12-03T18:00:00Z","2026-12-07T08:59:59Z"),"awaiting");
assert.equal(wait("2026-12-03T18:00:00Z","2026-12-08T17:00:01Z"),"overdue");
assert.equal(wait("2026-12-24T08:00:00Z","2026-12-29T09:00:00Z"),"reminder");
assert.equal(wait("2026-11-07T23:59:59Z","2026-11-20T10:00:00Z"),"historical");
assert.equal(wait(start,start),"awaiting");
assert.equal(wait("2026-11-31T09:00:00Z","2026-12-04T10:00:00Z"),"unavailable");
assert.equal(wait(fri,"2027-01-01T12:00:00Z"),"unavailable");
assert.equal(wait("2026-12-31T00:00:00Z","2026-12-31T12:00:00Z"),"unavailable");
const now=new Date("2026-11-20T10:00:00Z"), as_of=now.toISOString();
const id=(n:number)=>"a0000000-0000-4000-8000-"+String(n).padStart(12,"0");
const request=(n:number,received:string)=>({id:id(n),received});
const receipt=(r:{id:string;received:string})=>({request_id:r.id,received_at:r.received});
async function test(){
 const rows=Array.from({length:507},(_,i)=>request(i,fri));
 let pages=0;
 const buyers=await readBuyerPages(async after=>{
   pages++;return rows.filter(r=>!after||r.id>after).slice(0,113);
 });
 assert.equal(pages,6);assert.equal(buyers.rows.length,507);
 const calculate=(unanswered:unknown)=>buildReplyOverview({as_of,unanswered_receipts:unanswered},buyers,now,start,ghanaCalendar);
 const all=calculate(rows.map(receipt));
 assert.ok("groups" in all);assert.equal(all.groups.overdue.length,507);
 const partial=await readBuyerPages(async after=>after?null:rows.slice(0,250));
 assert.deepEqual(partial,{available:false,rows:[]});
 assert.ok("problem" in buildReplyOverview({as_of,unanswered_receipts:[]},partial,now,start,ghanaCalendar));
 assert.ok("problem" in buildReplyOverview(null,buyers,now,start,ghanaCalendar));
 for(const bad of [undefined,null,{},[null],[receipt(rows[0]),receipt(rows[0])],[receipt(request(800,fri))],[{request_id:id(1),received_at:as_of}]]){
   assert.ok("problem" in calculate(bad));
 }
 for(const [time,cutoff,cal] of [[now,undefined,ghanaCalendar],[now,start,undefined],[new Date("2027-01-01T00:00:00Z"),start,ghanaCalendar]] as const){
   assert.ok("problem" in buildReplyOverview({as_of:time.toISOString(),unanswered_receipts:[]},buyers,time,cutoff,cal));
 }
 assert.deepEqual(calculate([]),{groups:{outstanding:[],reminder:[],overdue:[],historical:[]}});
 const mixed=[request(1,fri),request(2,"2026-11-19T11:00:00Z"),request(3,as_of),request(4,"2026-11-07T12:00:00Z")];
 const result=buildReplyOverview({as_of,unanswered_receipts:mixed.map(receipt)},{available:true,rows:mixed},now,start,ghanaCalendar);
 assert.deepEqual(result,{groups:{outstanding:[id(1),id(2),id(3)],reminder:[id(2)],overdue:[id(1)],historical:[id(4)]}});
 console.log("PASS first-reply boundaries, holiday observances, historical coverage, partial reads, zero, overlapping counts and 507 receipts over six reads");
}
test().catch(e=>{console.error(e);process.exitCode=1});
