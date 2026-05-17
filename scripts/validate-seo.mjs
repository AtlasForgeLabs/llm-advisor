import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const siteUrl = 'https://llm-advisor.com';
const sitemapUrl = `${siteUrl}/sitemap-index.xml`;
const failures = [];

function read(path) {
  return readFileSync(join(root, path), 'utf8');
}

function requireFile(path) {
  if (!existsSync(join(root, path))) {
    failures.push(`Missing required SEO file: ${path}`);
    return false;
  }
  return true;
}

if (requireFile('astro.config.mjs')) {
  const config = read('astro.config.mjs');
  if (!config.includes(`site: '${siteUrl}'`) && !config.includes(`site: "${siteUrl}"`)) {
    failures.push(`astro.config.mjs must set site to ${siteUrl}`);
  }
  if (!config.includes('@astrojs/sitemap') || !config.includes('sitemap()')) {
    failures.push('astro.config.mjs must configure the Astro sitemap integration');
  }
}

if (requireFile('public/CNAME')) {
  const cname = read('public/CNAME').trim();
  if (cname !== 'llm-advisor.com') {
    failures.push(`public/CNAME must be llm-advisor.com, found ${cname}`);
  }
}

if (requireFile('public/robots.txt')) {
  const robots = read('public/robots.txt');
  for (const requiredLine of ['User-agent: *', 'Allow: /', `Sitemap: ${sitemapUrl}`]) {
    if (!robots.includes(requiredLine)) {
      failures.push(`public/robots.txt missing line: ${requiredLine}`);
    }
  }
}

if (requireFile('dist/CNAME')) {
  const distCname = read('dist/CNAME').trim();
  if (distCname !== 'llm-advisor.com') {
    failures.push(`dist/CNAME must be llm-advisor.com, found ${distCname}`);
  }
}

if (requireFile('dist/robots.txt')) {
  const distRobots = read('dist/robots.txt');
  if (!distRobots.includes(`Sitemap: ${sitemapUrl}`)) {
    failures.push(`dist/robots.txt must reference ${sitemapUrl}`);
  }
}

if (requireFile('dist/sitemap-index.xml')) {
  const sitemapIndex = read('dist/sitemap-index.xml');
  if (!sitemapIndex.includes(`${siteUrl}/sitemap-0.xml`)) {
    failures.push('dist/sitemap-index.xml must reference the generated sitemap-0.xml');
  }
}

const sitemapFiles = existsSync(join(root, 'dist'))
  ? readdirSync(join(root, 'dist')).filter((file) => /^sitemap-\d+\.xml$/.test(file))
  : [];

if (sitemapFiles.length === 0) {
  failures.push('dist must contain at least one generated sitemap-N.xml file');
}

const sitemapBody = sitemapFiles.map((file) => read(`dist/${file}`)).join('\n');
const requiredRoutes = [
  '/',
  '/about/',
  '/contact/',
  '/privacy/',
  '/terms/',
  '/methodology/',
  '/editorial-policy/',
  '/disclaimer/',
  '/vendors/',
  '/products/',
  '/plans/',
  '/models/',
  '/api-pricing/',
  '/compare/',
  '/use-cases/',
  '/price-radar/',
  '/calculators/ai-api-cost/',
  '/calculators/ai-subscription-cost/',
  '/calculators/ai-team-cost/',
  '/vendors/openai/',
  '/products/chatgpt/',
  '/plans/chatgpt-plus/',
  '/models/openai-gpt-family/',
  '/api-pricing/openai-api/',
  '/compare/chatgpt-vs-claude/',
  '/use-cases/developer-api-cost/'
];

for (const route of requiredRoutes) {
  const loc = route === '/' ? `${siteUrl}/` : `${siteUrl}${route}`;
  if (!sitemapBody.includes(`<loc>${loc}</loc>`)) {
    failures.push(`Generated sitemap missing route: ${loc}`);
  }
}

const canonicalChecks = [
  ['dist/index.html', `${siteUrl}/`],
  ['dist/about/index.html', `${siteUrl}/about`],
  ['dist/vendors/openai/index.html', `${siteUrl}/vendors/openai`],
  ['dist/calculators/ai-api-cost/index.html', `${siteUrl}/calculators/ai-api-cost`]
];

for (const [path, canonical] of canonicalChecks) {
  if (!requireFile(path)) continue;
  const html = read(path);
  if (!html.includes(`<link rel="canonical" href="${canonical}">`)) {
    failures.push(`${path} missing canonical URL: ${canonical}`);
  }
  if (html.includes('localhost') || html.includes('127.0.0.1')) {
    failures.push(`${path} must not contain localhost canonical or metadata URLs`);
  }
}

if (failures.length > 0) {
  console.error('SEO validation failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('SEO validation passed.');
