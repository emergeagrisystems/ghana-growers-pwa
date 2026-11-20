// Local browser test only. Every backend request goes to the in-process fixture.
const nativeFetch=globalThis.fetch;
const dest=new URL(process.env.GG_TEST_ORIGIN);
if(dest.hostname!=="127.0.0.1")throw Error("Loopback required");
globalThis.fetch=(input,init)=>{
  const u=new URL(input instanceof Request?input.url:String(input));
  if(u.hostname==="ecluxmyxqofkbzcyurlf.supabase.co"){
    const url=dest.origin+u.pathname+u.search;
    return nativeFetch(input instanceof Request?new Request(url,input):url,init);
  }
  if(u.hostname!=="127.0.0.1"&&u.hostname!=="localhost")throw Error("External fixture request denied");
  return nativeFetch(input,init);
};
