import { site } from '@/data/site';

const siteHosts = new Set([new URL(site.url).hostname, site.domain]);

export const externalLinkRel = 'noopener noreferrer';

export function isExternalHref(href: string): boolean {
  const value = href.trim();
  if (!value || value.startsWith('#') || value.startsWith('mailto:') || value.startsWith('tel:')) {
    return false;
  }

  if (value.startsWith('/') && !value.startsWith('//')) {
    return false;
  }

  try {
    const url = new URL(value, site.url);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }
    return !siteHosts.has(url.hostname);
  } catch {
    return value.startsWith('http://') || value.startsWith('https://') || value.startsWith('//');
  }
}
