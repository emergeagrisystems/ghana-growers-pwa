import { NextResponse } from "next/server";
import { isolatedSupabaseUrl, RC1_STAGING_REF } from "@/lib/supabase/isolation";
export const dynamic = "force-dynamic";
export function GET(){
 if(process.env.VERCEL_ENV!=="preview" || process.env.NEXT_PUBLIC_RC1_PREVIEW!=="true") return new NextResponse(null,{status:404});
 const url=isolatedSupabaseUrl();
 return NextResponse.json({environment:"preview",commit:process.env.VERCEL_GIT_COMMIT_SHA??null,branch:process.env.VERCEL_GIT_COMMIT_REF??null,stagingRef:url?RC1_STAGING_REF:null,isolated:Boolean(url),browserIsolationFlag:process.env.NEXT_PUBLIC_RC1_PREVIEW==="true",serverKeyConfigured:Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),aiKeyConfigured:Boolean(process.env.OPENAI_API_KEY?.trim()),publicSubmissions:"unavailable"},{status:url?200:503,headers:{"Cache-Control":"private, no-store","X-Robots-Tag":"noindex, nofollow"}});
}
