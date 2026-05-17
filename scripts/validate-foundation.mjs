import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

const requiredFiles = [
  'public/CNAME',
  'public/robots.txt',
  'public/favicon.svg',
  '.github/workflows/deploy.yml',
  'README.md',
  'AGENTS.md',
  'docs/ARCHITECTURE.md',
  'docs/AI_AGENT_CONTEXT.md',
  'docs/AI_AGENT_UPDATE_RULES.md',
  'docs/DEVELOPMENT_WORKFLOW.md',
  'docs/SEO_AND_ADSENSE_REQUIREMENTS.md',
  'docs/DESIGN_SYSTEM.md',
  'src/pages/index.astro',
  'src/pages/about.astro',
  'src/pages/contact.astro',
  'src/pages/privacy.astro',
  'src/pages/terms.astro',
  'src/pages/methodology.astro',
  'src/pages/editorial-policy.astro',
  'src/pages/disclaimer.astro',
  'src/pages/plans/index.astro',
  'src/pages/api-pricing/index.astro',
  'src/pages/comparisons.astro',
  'src/pages/calculators/index.astro',
  'src/pages/price-radar/index.astro',
  'src/pages/guides.astro',
  'src/pages/vendors/index.astro',
  'src/pages/products/index.astro',
  'src/pages/models/index.astro',
  'src/pages/compare/index.astro',
  'src/pages/use-cases/index.astro',
  'src/pages/calculators/index.astro'
];

const failures = [];

for (const file of requiredFiles) {
  const fullPath = join(root, file);
  if (!existsSync(fullPath)) {
    failures.push(`Missing required file: ${file}`);
    continue;
  }

  const text = readFileSync(fullPath, 'utf8').trim();
  if (text.length < 40 && !file.endsWith('CNAME')) {
    failures.push(`Required file appears too thin: ${file}`);
  }

  if (/TODO\s*$/i.test(text) || /coming soon/i.test(text)) {
    failures.push(`Required file has obvious placeholder language: ${file}`);
  }
}

const cname = readFileSync(join(root, 'public/CNAME'), 'utf8').trim();
if (cname !== 'llm-advisor.com') {
  failures.push(`CNAME must be llm-advisor.com, found: ${cname}`);
}

if (failures.length > 0) {
  console.error('Foundation validation failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Foundation validation passed.');
