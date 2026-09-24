// Render the public Learn surfaces to catch broken title-based lookups and
// category renames without changing internal category/slug contracts.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '../src');
const cache = new Map();
function load(file) {
  let filename = path.resolve(file);
  if (!path.extname(filename)) filename += fs.existsSync(filename + '.ts') ? '.ts' : '.tsx';
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} };
  cache.set(filename, module);
  const source = fs.readFileSync(filename, 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  vm.runInNewContext(js, {
    module, exports: module.exports, URL, URLSearchParams,
    require(name) {
      if (name === 'react' || name === 'react/jsx-runtime' || name === 'lucide-react') return require(name);
      if (name === 'next/link') return ({ children, ...props }) => React.createElement('a', props, children);
      if (name === 'next/image') return ({ fill, unoptimized, priority, ...props }) => React.createElement('img', props);
      if (name === 'next/navigation') return { notFound() { throw new Error('Unexpected missing lesson'); } };
      if (name === '@/lib/seo') return { createPageMetadata: (value) => value };
      if (name.startsWith('@/')) return load(path.join(root, name.slice(2)));
      if (name.startsWith('.')) return load(path.join(path.dirname(filename), name));
      throw new Error('Unexpected dependency: ' + name);
    },
    fetch() { throw new Error('No network allowed'); }
  }, { filename, timeout: 5000 });
  return module.exports;
}
const { learnLessons } = load(path.join(root, 'data/learnLessons.ts'));
const { LearnHub } = load(path.join(root, 'components/LearnHub.tsx'));
const { BlogCard } = load(path.join(root, 'components/BlogCard.tsx'));
const Article = load(path.join(root, 'app/learn/[slug]/page.tsx')).default;
const guides = learnLessons.filter(post => post.category === 'FarmMate Guides');
assert.equal(guides.length, 5, 'Stored guide category must remain usable');
assert.ok(guides.some(post => post.title === 'How to Use Ask Mama G'));
assert.ok(guides.some(post => post.title === 'How to Ask Mama G a Good Question'));
assert.ok(guides.every(post => post.sections.some(section => section.heading === 'When to ask FarmMate' && section.body)), 'Internal section lookup still resolves');
const hub = renderToStaticMarkup(React.createElement(LearnHub, { posts: learnLessons }));
assert.match(hub, /Mama G Guides/);
assert.doesNotMatch(hub, /\bFarmMate\b/);
for (const post of guides) {
  const card = renderToStaticMarkup(React.createElement(BlogCard, { post }));
  const article = renderToStaticMarkup(React.createElement(Article, { params: { slug: post.slug } }));
  assert.match(card, /Mama G Guides/);
  assert.match(article, /Ask Mama G/);
  assert.doesNotMatch(card + article, />[^<]*\bFarmMate\b[^<]*</);
}
console.log('PASS: Learn hub, five guide cards and five guide articles render Mama G; stored category and internal prompt-section lookups preserved.');
