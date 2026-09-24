const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '..');
function moduleFrom(relative, imports, globals = {}) {
  const module = { exports: {} };
  const js = ts.transpileModule(fs.readFileSync(path.join(root, relative), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  vm.runInNewContext(js, { module, exports: module.exports, URL, Response, AbortSignal,
    require(name) { if (Object.hasOwn(imports, name)) return imports[name]; throw new Error('Unexpected import: ' + name); },
    ...globals
  }, { filename: relative, timeout: 5000 });
  return module.exports;
}
function loader(fetch, configured = true) {
  return moduleFrom('src/lib/supabase/publicData.ts', {
    'server-only': {}, './isolation': { isolatedSupabaseUrl: () => configured ? 'https://isolated-test.invalid' : undefined },
    '@/data/buyerRequests': { buyerRequests: [] }, '@/data/marketPrices': { marketPrices: [] },
    '@/lib/featured': { featuredSort: (rows) => rows, isFeaturedActive: () => false },
    '@/lib/publicProfileEligibility': {},
    '@/lib/productDisplay': { productDisplayName: (name) => name, productImageForListing: () => '/test-image.jpg' },
    '@/lib/supabase/serverAuthHeaders': { supabaseServerAuthHeaders: () => ({}) }
  }, { process: { env: { SUPABASE_SERVICE_ROLE_KEY: configured ? 'mock-key' : undefined } }, fetch });
}
const row = { id: 'listing-real-1', slug: 'tomatoes', product_name: 'Tomatoes', category: 'Fresh Produce', region: 'Ashanti', district: 'Kumasi', seller_name: 'Registered farm', owner_name: 'Registered farm', owner_type: 'Farmer', owner_id: 'farmer-real-1', quantity: '10', unit: 'crates', availability: 'Available', status: 'Published', created_at: '2026-09-24', verification_status: 'Verified', image_url: null };
const ready = { status: 'ready', data: [] };
const unavailable = { status: 'unavailable', data: [], code: 'read_failed' };
const baseImports = {
  'react/jsx-runtime': require('react/jsx-runtime'),
  'lucide-react': require('lucide-react'),
  'next/link': ({ children, ...props }) => React.createElement('a', props, children),
  'next/navigation': { notFound() { throw new Error('NOT_FOUND'); } },
  '@/lib/seo': { createPageMetadata: (value) => value },
  '@/lib/marketplace/publicListings': { publicMarketplaceListings: () => [] },
  '@/lib/marketplace/trade': {},
  '@/components/MarketplaceListings': { MarketplaceListings: () => React.createElement('div', null, 'READY_EMPTY_LISTINGS') },
  '@/components/MarketplaceImageGallery': {}, '@/components/RequestConnectionButton': {}
};
const unavailableUi = moduleFrom('src/components/MarketplaceUnavailable.tsx', baseImports);
function pageModule(listingResult, farmerResult = ready, supplierResult = ready, detail = false) {
  return moduleFrom(detail ? 'src/app/marketplace/[id]/page.tsx' : 'src/app/marketplace/page.tsx', {
    ...baseImports, '@/components/MarketplaceUnavailable': unavailableUi,
    '@/lib/supabase/publicData': {
      getMarketplaceListingsResult: async () => listingResult,
      getFarmersData: async () => farmerResult, getSuppliersData: async () => supplierResult
    }
  });
}
async function run() {
  let reads = 0;
  const missing = await loader(async () => { reads++; throw new Error('Must not fetch without config'); }, false).getMarketplaceListingsResult();
  assert.equal(missing.status, 'unavailable'); assert.equal(missing.code, 'configuration_missing'); assert.equal(reads, 0);
  const network = await loader(async () => { throw new Error('offline'); }).getMarketplaceListingsResult();
  assert.equal(network.code, 'network_error');
  const failed = await loader(async () => new Response('', { status: 503 })).getMarketplaceListingsResult();
  assert.equal(failed.code, 'read_failed');
  const invalid = await loader(async () => new Response('not JSON')).getMarketplaceListingsResult();
  assert.equal(invalid.code, 'invalid_response');
  const invalidRow = await loader(async () => Response.json([null])).getMarketplaceListingsResult();
  assert.equal(invalidRow.code, 'invalid_response');
  const empty = await loader(async () => Response.json([])).getMarketplaceListingsResult();
  assert.equal(empty.status, 'ready'); assert.equal(empty.data.length, 0);
  const loaded = await loader(async () => Response.json([row])).getMarketplaceListingsResult();
  assert.equal(loaded.status, 'ready'); assert.equal(loaded.data[0].id, 'tomatoes');
  const legacy = await loader(async () => { throw new Error('offline'); }).getMarketplaceListingsData();
  assert.equal(Array.isArray(legacy), true); assert.equal(legacy.length, 0);
  const lifecycleFailure = await loader(async (url) => String(url).includes('/listing_submissions?')
    ? new Response('', { status: 503 })
    : Response.json([{ ...row, record_source: 'public_submission', source_submission_id: 'submission-1' }])).getMarketplaceListingsResult();
  assert.equal(lifecycleFailure.status, 'unavailable'); assert.equal(lifecycleFailure.code, 'read_failed');
  const lifecycleReady = await loader(async (url) => String(url).includes('/listing_submissions?')
    ? Response.json([{ id: 'submission-1', status: 'Published', published_listing_id: row.id }])
    : Response.json([{ ...row, record_source: 'public_submission', source_submission_id: 'submission-1' }])).getMarketplaceListingsResult();
  assert.equal(lifecycleReady.data[0].sourceSubmissionStatus, 'Published');
  for (const values of [[unavailable, ready, ready], [ready, unavailable, ready], [ready, ready, unavailable]]) {
    const page = pageModule(...values);
    const html = renderToStaticMarkup(await page.default());
    assert.match(html, /Marketplace temporarily unavailable/); assert.doesNotMatch(html, /READY_EMPTY_LISTINGS/);
    const detail = pageModule(...values, true);
    const detailHtml = renderToStaticMarkup(await detail.default({ params: { id: 'tomatoes' } }));
    assert.match(detailHtml, /Listing temporarily unavailable/);
    const metadata = await detail.generateMetadata({ params: { id: 'tomatoes' } });
    assert.equal(metadata.noIndex, true);
  }
  const emptyHtml = renderToStaticMarkup(await pageModule(ready).default());
  assert.match(emptyHtml, /READY_EMPTY_LISTINGS/); assert.doesNotMatch(emptyHtml, /temporarily unavailable/);
  await assert.rejects(() => pageModule(ready, ready, ready, true).default({ params: { id: 'missing' } }), /NOT_FOUND/);
  const eligibility = moduleFrom('src/lib/marketplace/publicListings.ts', {
    '../farmerDirectory': {}, '../featured': {}, '../supplierDirectory': {}, './taxonomy': {}, './trade': {}
  });
  for (const recordSource of ['demo', 'seed', 'mock', 'sample', 'placeholder']) {
    assert.equal(eligibility.isDemoMarketplaceListing({ id: 'ordinary', seller: 'ordinary', recordSource }), true);
  }
  for (const recordSource of ['synthetic', 'preview-fixture', 'preview_fixture', 'test-fixture', 'test_fixture', ' SYNTHETIC ']) {
    assert.equal(eligibility.isDemoMarketplaceListing({ id: 'ordinary', seller: 'ordinary', recordSource }), true);
  }
  for (const id of ['p09-preview-123', 'p09-preview_fixture', 'p09-preview:record']) {
    assert.equal(eligibility.isDemoMarketplaceListing({ id, seller: 'ordinary', recordSource: 'manual' }), true);
  }
  assert.equal(eligibility.isDemoMarketplaceListing({ id: 'catalog-preview', seller: 'Preview Farm', recordSource: 'manual' }), false, 'Ordinary preview wording is not a fixture tag');
  assert.equal(eligibility.isDemoMarketplaceListing({ id: 'ordinary', seller: 'ordinary', recordSource: 'preview' }), false, 'Bare preview word is not sufficient evidence');
  console.log('PASS: missing config/network/read/invalid-response and lifecycle lookup failures stay unavailable; ready-empty stays empty; legacy array contract preserved; browse/detail/metadata distinguish failures; explicit synthetic/fixture markers excluded without blocking ordinary preview wording. No live reads.');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
