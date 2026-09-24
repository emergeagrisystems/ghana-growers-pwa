const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '..');
const routes = ['farmer-registration', 'supplier-registration', 'buyer-registration', 'listing-submissions', 'buyer-request-submissions', 'lead-requests', 'contact-enquiries', 'featured-enquiries', 'waitlist', 'whatsapp-leads', 'farmmate/feedback'];
const components = ['FarmerRegistrationForm', 'SupplierOnboardingForm', 'SupplierRegistrationForm', 'BuyerRegistrationForm', 'SubmitBuyerRequestForm', 'SubmitProduceListingForm', 'RequestConnectionButton', 'ContactEnquiryForm', 'FeaturedPlacementCTA', 'PrelaunchWaitlistForm', 'FarmMatePilotFeedbackForm', 'RegistrationForm', 'WhatsAppButton'];
const sideEffects = [];
function load(relative, imports = {}) {
  const filename = path.join(root, relative);
  const module = { exports: {} };
  const js = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(js, {
    module, exports: module.exports, Response,
    require(name) {
      if (Object.hasOwn(imports, name)) return imports[name];
      return new Proxy({}, { get(_, member) { return () => { sideEffects.push(name + '.' + String(member)); throw new Error('Unexpected lifecycle call'); }; } });
    },
    fetch() { sideEffects.push('fetch'); throw new Error('Network prohibited'); }
  }, { filename, timeout: 5000 });
  return module.exports;
}
async function run() {
  const gate = load('src/lib/publicSubmissionAvailability.ts');
  const request = new Proxy({}, { get(_, field) { sideEffects.push('request.' + String(field)); throw new Error('Body and headers must not be read while closed'); } });
  for (const route of routes) {
    const handler = load(`src/app/api/${route}/route.ts`, { '@/lib/publicSubmissionAvailability': gate });
    const response = await handler.POST(request);
    assert.equal(response.status, 503, route);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    const body = await response.json();
    assert.equal(body.ok, false);
    assert.equal(body.code, 'PUBLIC_SUBMISSION_UNAVAILABLE');
    assert.match(body.message, /No information can be submitted/);
  }
  assert.deepEqual(sideEffects, [], 'No body parsing, lifecycle call, upload, notification or network call');
  const ui = load('src/components/PublicSubmissionUnavailable.tsx', { '@/lib/publicSubmissionAvailability': gate, 'react/jsx-runtime': require('react/jsx-runtime') });
  let mounted = false;
  function ActiveForm() { mounted = true; throw new Error('Closed form must not mount'); }
  const ClosedForm = ui.withPublicSubmissionGate(ActiveForm, 'farmer-registration', 'Farmer registration');
  const html = renderToStaticMarkup(React.createElement(ClosedForm));
  assert.equal(mounted, false);
  assert.match(html, /Farmer registration currently unavailable/);
  assert.doesNotMatch(html, /<form|<input|<button|received|submitted successfully/i);
  for (const name of components) {
    const source = fs.readFileSync(path.join(root, `src/components/${name}.tsx`), 'utf8');
    assert.match(source, new RegExp(`export const ${name} = withPublicSubmissionGate\\(`), name + ' public export must be gated');
  }
  const tracking = load('src/lib/whatsappLeadTracking.ts', { './publicSubmissionAvailability': gate });
  tracking.trackWhatsAppLead({ sourceType: 'Platform', sourceId: 'test', sourceName: 'test', phoneNumber: '000' });
  assert.deepEqual(sideEffects, []);
  const answerFeedback = load('src/components/FarmMateAnswerFeedback.tsx', {
    '@/lib/publicSubmissionAvailability': gate,
    '@/lib/farmmate/answer-feedback': load('src/lib/farmmate/answer-feedback.ts'),
    react: React,
    'react/jsx-runtime': require('react/jsx-runtime'),
    'lucide-react': require('lucide-react'),
    'next/link': ({ children, ...props }) => React.createElement('a', props, children)
  });
  const feedbackHtml = renderToStaticMarkup(React.createElement(answerFeedback.FarmMateAnswerFeedback, {
    prompt: 'Was this useful?', wrongButtonLabel: 'Report problem', context: { tool: 'ask_farmmate' }, copyText: 'Example answer'
  }));
  assert.match(feedbackHtml, /Copy answer/);
  assert.match(feedbackHtml, /Feedback submissions are currently unavailable/);
  assert.doesNotMatch(feedbackHtml, /Send more feedback|Feedback prepared|textarea|Report problem/);
  console.log('PASS: 11 API routes reject before body parsing or side effects; 13 public component exports gated; active form never mounts; no WhatsApp lead call; answer feedback unavailable while Copy answer remains.');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
