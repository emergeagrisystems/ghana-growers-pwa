// Actual middleware module with local-only environment and real HMAC authorisation.
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
const { NextRequest } = require('next/server');
const preview = require('../.farmmate-test-dist/src/lib/previewAccess.js');
const policy = require('../.farmmate-test-dist/src/lib/prelaunchAccess.js');
const pilot = require('../.farmmate-test-dist/src/lib/farmmate/pilot-access.js');
const secret = 'fictional-local-prelaunch-test-secret-at-least-32';
function load(file, env, imports = {}) {
  const mod = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInNewContext(code, { module: mod, exports: mod.exports, require: key => imports[key] || require(key), process: { env }, URL, Response, Request, Headers, console });
  return mod.exports;
}
function middleware(env) {
  return load('src/middleware.ts', env, { '@/lib/prelaunchAccess': policy, '@/lib/farmmate/pilot-access': pilot, '@/lib/previewAccess': preview,
    '@/lib/supabase/isolation': load('src/lib/supabase/isolation.ts', env) }).middleware;
}
function request(path, token, method = 'GET') {
  return new NextRequest('http://localhost:3000' + path, { method, headers: token ? { cookie: preview.previewAccessCookie + '=' + token } : {} });
}
(async () => {
  let cases = 0;
  const token = await preview.createPreviewAccessToken(secret);
  const oldToken = await preview.createPreviewAccessToken(secret, Date.now() - 3600000);
  const gated = middleware({ SITE_PRELAUNCH: 'true', PREVIEW_ACCESS_SECRET: secret });
  for (const path of [...policy.prelaunchIntakeRoutes, '/privacy-policy', '/terms-of-use', '/launching-soon', '/dev-preview', '/admin/login', '/admin/reset-password', '/api/admin/auth/login', '/api/integrations/hq/approval-counts', '/stage1-media/hero-clay-map-1088.webp', '/hm1/nov07/mama-g-dark.png', '/fonts/dm-sans/dm-sans-roman.woff2']) {
    assert.equal((await gated(request(path))).headers.get('x-middleware-next'), '1', path); cases++;
  }
  for (const path of ['/', '/farmer-hub', '/farmer-hub/feedback', '/marketplace', '/directory', '/learn', '/account', '/join', '/join/buyer', '/api/buyer-registration', '/join/farmer/private', '/api/farmer-registration-other', '/become-a-supplier/private', '/submit-listing/private', '/submit-buyer-request/private', '/admin-other', '/api/admin-other', '/brand-private', '/privacy-policy/private']) {
    const r = await gated(request(path)); assert.equal(r.headers.get('x-middleware-rewrite'), 'http://localhost:3000/launching-soon', path);
    assert.match(r.headers.get('cache-control'), /no-store/); cases++;
  }
  for (const path of ['/api/farmmate', '/api/farmmate/ask', '/api/farmmate/crop-doctor', '/api/farmmate/usage', '/api/farmmate/feedback', '/api/farmmate/unknown']) {
    for (const method of ['GET', 'POST']) for (const cookie of [undefined, 'forged', oldToken]) {
      const r = await gated(request(path, cookie, method)); assert.equal(r.status, 503, path); assert.equal((await r.json()).code, 'PRELAUNCH_UNAVAILABLE');
      assert.equal(r.headers.get('x-middleware-next'), null); assert.equal(r.headers.get('x-middleware-rewrite'), null); cases++;
    }
  }
  for (const path of ['/', '/farmer-hub', '/farmer-hub/feedback', '/api/farmmate/ask', '/api/farmmate/crop-doctor', '/dev-preview/launch-collection']) {
    const r = await gated(request(path, token)); assert.equal(r.headers.get('x-middleware-next'), '1'); assert.match(r.headers.get('cache-control'), /no-store/); cases++;
  }
  for (const path of ['/join/supplier', '/supplier-registration']) { assert.equal((await gated(request(path))).headers.get('location'), 'http://localhost:3000/become-a-supplier'); cases++; }
  const live = middleware({ SITE_PRELAUNCH: 'false' });
  for (const path of ['/', '/farmer-hub', '/farmer-hub/feedback', '/api/farmmate/ask', '/api/farmmate/crop-doctor', ...policy.prelaunchIntakeRoutes]) { assert.equal((await live(request(path))).headers.get('x-middleware-next'), '1'); cases++; }
  const redirect = await live(request('/launching-soon?old=campaign')); assert.equal(redirect.status, 307); assert.equal(redirect.headers.get('location'), 'http://localhost:3000/'); assert.match(redirect.headers.get('cache-control'), /no-store/); cases++;
  for (const url of ['https://bfasogvmesswweribsji.supabase.co', undefined]) {
    const isolated = middleware({ VERCEL_ENV: 'preview', NEXT_PUBLIC_SUPABASE_URL: url, RC1_STAGING_READY: 'true', SITE_PRELAUNCH: 'true' });
    assert.equal((await isolated(request('/launching-soon'))).status, 503); cases++;
  }
  console.log('PASS ' + cases + ' actual middleware route/auth/method/isolation cases; no downstream handler executed');
})().catch(e => { console.error(e); process.exitCode = 1; });
