import assert from "node:assert/strict";
import { staffSupabaseOrigin, adminRecoveryRedirect } from "../src/lib/staffRuntime";
import { isolatedSupabaseUrl, PRODUCTION_SUPABASE_REF, RC1_STAGING_REF } from "../src/lib/supabase/isolation";
import { authorizeAdminIdentity } from "../src/lib/adminAuthorization";

const production = `https://${PRODUCTION_SUPABASE_REF}.supabase.co`;
const staging = `https://${RC1_STAGING_REF}.supabase.co`;
const prod = { VERCEL_ENV: "production", NEXT_PUBLIC_SUPABASE_URL: production };
const preview = { VERCEL_ENV: "preview", NEXT_PUBLIC_SUPABASE_URL: staging, NEXT_PUBLIC_RC1_PREVIEW: "true", RC1_STAGING_READY: "true", VERCEL_BRANCH_URL: "ghana-growers-git-admin-example.vercel.app" };
let checks = 0;
function same(actual: unknown, expected: unknown) { assert.deepEqual(actual, expected); checks++; }
same(staffSupabaseOrigin(prod), production);
same(staffSupabaseOrigin({...prod, NEXT_PUBLIC_RC1_PREVIEW:"false", RC1_STAGING_READY:"false"}), production);
same(staffSupabaseOrigin(preview), staging);
for (const env of [
  {...prod, NEXT_PUBLIC_SUPABASE_URL:staging}, {...prod,NEXT_PUBLIC_RC1_PREVIEW:"true"},
  {...prod,RC1_STAGING_READY:"true"}, {...preview,NEXT_PUBLIC_SUPABASE_URL:production},
  {...preview,RC1_STAGING_READY:undefined}, {...preview,NEXT_PUBLIC_RC1_PREVIEW:"false"},
  {...preview,VERCEL_ENV:undefined}, {...preview,VERCEL_ENV:"unexpected"},
  {...prod,NEXT_PUBLIC_RC1_PREVIEW:"invalid"}, {NEXT_PUBLIC_SUPABASE_URL:production}
]) same(staffSupabaseOrigin(env), undefined);
for (const value of [production+"/other",production+"?x=1",production+"#x",production+":444",production.replace("https:","http:"),production.replace("https://","https://user:pass@"),production+".invalid", "", "not a URL"]) {
  same(staffSupabaseOrigin({...prod,NEXT_PUBLIC_SUPABASE_URL:value}), undefined);
}
same(staffSupabaseOrigin({...preview,VERCEL_ENV:"development"}),staging);
same(staffSupabaseOrigin({VERCEL_ENV:"development",NODE_ENV:"test",NEXT_PUBLIC_SUPABASE_URL:"http://127.0.0.1:54321"}),"http://127.0.0.1:54321");
same(staffSupabaseOrigin({VERCEL_ENV:"preview",NODE_ENV:"test",NEXT_PUBLIC_SUPABASE_URL:"http://127.0.0.1:54321"}),undefined);
same(staffSupabaseOrigin({VERCEL_ENV:"development",NODE_ENV:"production",NEXT_PUBLIC_SUPABASE_URL:"http://127.0.0.1:54321"}),undefined);
same(adminRecoveryRedirect(prod),"https://www.ghana-growers.com/admin/reset-password");
same(adminRecoveryRedirect(preview),"https://ghana-growers-git-admin-example.vercel.app/admin/reset-password");
same(adminRecoveryRedirect({...preview,VERCEL_BRANCH_URL:undefined}),undefined);
same(adminRecoveryRedirect({...preview,VERCEL_BRANCH_URL:"evil.test/path.vercel.app"}),undefined);
same(adminRecoveryRedirect({...prod,NEXT_PUBLIC_SUPABASE_URL:staging}),undefined);
same(adminRecoveryRedirect({VERCEL_ENV:"development"}),"http://localhost:3000/admin/reset-password");
same(adminRecoveryRedirect({NODE_ENV:"development"}),"http://localhost:3000/admin/reset-password");
same(adminRecoveryRedirect({NODE_ENV:"production"}),undefined);

const keys=["VERCEL_ENV","NEXT_PUBLIC_SUPABASE_URL","NEXT_PUBLIC_RC1_PREVIEW"] as const;
const old=keys.map(k=>process.env[k]);
try {
  process.env.VERCEL_ENV="production";
  process.env.NEXT_PUBLIC_RC1_PREVIEW="false";
  process.env.NEXT_PUBLIC_SUPABASE_URL=production;
  same(isolatedSupabaseUrl(),production);
  process.env.NEXT_PUBLIC_SUPABASE_URL=staging;
  same(isolatedSupabaseUrl(),undefined);
  same(authorizeAdminIdentity({id:"fictional",email:"fixture@example.invalid"},"fixture@example.invalid"),{authorized:false,reason:"not_authorized"});
  same(authorizeAdminIdentity({id:"fictional",email:"fixture@example.invalid",app_metadata:{role:"admin"}},""),{authorized:true,source:"app_metadata"});
  for (const metadata of [{admin:true},{roles:["admin"]},{role:"editor",admin:true},{role:"Admin"}]) {
    same(authorizeAdminIdentity({id:"fictional",email:"fixture@example.invalid",app_metadata:metadata},"fixture@example.invalid"),{authorized:false,reason:"not_authorized"});
  }
  process.env.VERCEL_ENV="preview";
  process.env.NEXT_PUBLIC_RC1_PREVIEW="true";
  same(isolatedSupabaseUrl(),staging);
  process.env.NEXT_PUBLIC_SUPABASE_URL=production;
  same(isolatedSupabaseUrl(),undefined);
  same(authorizeAdminIdentity({id:"fictional",email:"fixture@example.invalid"},"fixture@example.invalid"),{authorized:true,source:"email_allowlist"});
  for (const metadata of [{admin:true},{roles:["admin"]}]) {
    same(authorizeAdminIdentity({id:"fictional",app_metadata:metadata},""),{authorized:true,source:"app_metadata"});
  }
} finally {
  keys.forEach((k,i)=>{if(old[i]===undefined)delete process.env[k];else process.env[k]=old[i]});
}
console.log(`PASS admin portability: ${checks} guard, recovery and entitlement assertions`);
