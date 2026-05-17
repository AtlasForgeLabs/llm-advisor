import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures = [];

const adsTxtLine = 'google.com, pub-6843790293923678, DIRECT, f08c47fec0942fa0';
const publisherClient = 'ca-pub-6843790293923678';
const adsenseScript =
  'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6843790293923678';
const ga4Id = 'G-FDQ4PYCRD7';

function read(path) {
  return readFileSync(join(root, path), 'utf8');
}

function requireFile(path) {
  if (!existsSync(join(root, path))) {
    failures.push(`Missing required AdSense file: ${path}`);
    return null;
  }
  return read(path);
}

const publicAdsTxt = requireFile('public/ads.txt');
if (publicAdsTxt && !publicAdsTxt.includes(adsTxtLine)) {
  failures.push(`public/ads.txt must include: ${adsTxtLine}`);
}

const distAdsTxt = requireFile('dist/ads.txt');
if (distAdsTxt && !distAdsTxt.includes(adsTxtLine)) {
  failures.push(`dist/ads.txt must include: ${adsTxtLine}`);
}

const representativePages = [
  'dist/index.html',
  'dist/privacy/index.html',
  'dist/about/index.html'
];

for (const page of representativePages) {
  const html = requireFile(page);
  if (!html) continue;

  if (!html.includes(adsenseScript)) {
    failures.push(`${page} missing AdSense base script`);
  }

  const adsenseMatches = html.match(
    /pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js/g
  );
  if (!adsenseMatches || adsenseMatches.length !== 1) {
    failures.push(`${page} must include the AdSense base script exactly once`);
  }

  if (!html.includes(publisherClient)) {
    failures.push(`${page} missing publisher client ${publisherClient}`);
  }

  if (!html.includes(ga4Id)) {
    failures.push(`${page} missing GA4 measurement ID ${ga4Id}`);
  }
}

const privacySource = requireFile('src/pages/privacy.astro');
if (privacySource) {
  const mentionsAds =
    /AdSense|advertising|third-party ads/i.test(privacySource) &&
    /Google/i.test(privacySource);
  if (!mentionsAds) {
    failures.push(
      'src/pages/privacy.astro must mention Google AdSense, advertising, or third-party ads'
    );
  }
}

if (failures.length > 0) {
  console.error('AdSense validation failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('AdSense validation passed.');
