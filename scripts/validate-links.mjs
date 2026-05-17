import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const distDir = join(root, 'dist');
const siteHosts = new Set(['llm-advisor.com', 'www.llm-advisor.com']);
const failures = [];

function isExternalHref(href) {
  const value = href.trim();
  if (!value || value.startsWith('#') || value.startsWith('mailto:') || value.startsWith('tel:')) {
    return false;
  }
  if (value.startsWith('/') && !value.startsWith('//')) {
    return false;
  }
  try {
    const url = new URL(value, 'https://llm-advisor.com');
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }
    return !siteHosts.has(url.hostname);
  } catch {
    return value.startsWith('http://') || value.startsWith('https://') || value.startsWith('//');
  }
}

function collectHtmlFiles(dir, files = []) {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      collectHtmlFiles(path, files);
    } else if (entry.endsWith('.html')) {
      files.push(path);
    }
  }
  return files;
}

function relativePath(path) {
  return path.slice(root.length + 1);
}

if (!existsSync(distDir)) {
  failures.push('dist/ is missing. Run npm run build before link validation.');
} else {
  const anchorRe = /<a\b[^>]*>/gi;

  for (const file of collectHtmlFiles(distDir)) {
    const html = readFileSync(file, 'utf8');

    for (const match of html.matchAll(anchorRe)) {
      const anchor = match[0];
      const hrefMatch = anchor.match(/\bhref=["']([^"']*)["']/i);
      if (!hrefMatch) continue;

      const href = hrefMatch[1];

      if (isExternalHref(href)) {
        if (!/\btarget=["']_blank["']/i.test(anchor)) {
          failures.push(`${relativePath(file)}: external link missing target="_blank": ${href}`);
        }
        if (!/\brel=["'][^"']*noopener/i.test(anchor)) {
          failures.push(`${relativePath(file)}: external link missing rel="noopener noreferrer": ${href}`);
        }
        continue;
      }

      if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) {
        if (/\btarget=["']_blank["']/i.test(anchor)) {
          failures.push(`${relativePath(file)}: ${href} should not use target="_blank"`);
        }
        continue;
      }

      if (/\btarget=["']_blank["']/i.test(anchor)) {
        failures.push(`${relativePath(file)}: internal link should not use target="_blank": ${href}`);
      }
    }
  }
}

const sourceList = readFileSync(join(root, 'src/components/SourceList.astro'), 'utf8');
if (!sourceList.includes('SmartLink')) {
  failures.push('src/components/SourceList.astro must render external sources through SmartLink');
}

const privacyPage = readFileSync(join(root, 'src/pages/privacy.astro'), 'utf8');
if (/<a\s+[^>]*href=["']https?:\/\//i.test(privacyPage)) {
  failures.push('src/pages/privacy.astro must use SmartLink for external https links');
}

if (failures.length > 0) {
  console.error('Link validation failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Link validation passed.');
