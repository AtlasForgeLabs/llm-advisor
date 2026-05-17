# SEO and AdSense Requirements

## Essential Pages

The site should maintain readable, project-specific versions of:

- `/about`
- `/contact`
- `/privacy`
- `/terms`
- `/methodology`
- `/editorial-policy`
- `/disclaimer`

Public trust pages should use `contact@llm-advisor.com` for corrections and editorial contact.

## Metadata

Public pages should use meaningful titles, meta descriptions, canonical URLs, Open Graph metadata, and appropriate structured metadata through the shared layout.

## Sitemap and Robots

The production domain is `https://llm-advisor.com`.

Submit this sitemap URL to Google Search Console:

```text
https://llm-advisor.com/sitemap-index.xml
```

The public robots URL is:

```text
https://llm-advisor.com/robots.txt
```

The sitemap is generated during the Astro build from current static and generated routes, then deployed to GitHub Pages with the rest of `dist`.

Do not block `ads.txt` or Google crawlers in `robots.txt`.

## Analytics

Google Analytics 4 is integrated globally through the shared layout head with measurement ID `G-FDQ4PYCRD7`.

Analytics is separate from AdSense. GA4 behavior must remain intact when AdSense changes are made.

## AdSense Review Readiness

The site integrates the global AdSense base script once per page in `src/layouts/BaseLayout.astro`.

Publisher client: `ca-pub-6843790293923678`

Authorized sellers file:

```text
https://llm-advisor.com/ads.txt
```

`public/ads.txt` must contain:

```text
google.com, pub-6843790293923678, DIRECT, f08c47fec0942fa0
```

Manual ad units, visible ad slots, and affiliate links are not implemented yet. Do not add them unless a task explicitly requests them.

AdSense approval and live ad revenue are not guaranteed and should not be claimed in site copy or documentation.

## Future Ad Placement Rules

When ad placements are added after approval and content maturity improves:

- preserve trust, readability, calculators, and user experience
- avoid excessive above-the-fold ad density
- do not let advertising determine editorial recommendations
- disclose affiliate links or sponsored placements before publication
- update privacy and trust pages when monetization changes materially

## Source Attribution

Pricing and plan claims should cite official vendor sources whenever possible. Source URLs and retrieval or review dates should be preserved in future data files.

The implemented static data contract supports source IDs, source URLs, official-source flags, source access timestamps, confidence notes, verification status, and quality flags.

## Last Updated Timestamps

Pages containing pricing-sensitive information should show last updated or last reviewed timestamps.

## Avoid Thin Content

Do not publish empty, generic, or TODO-only pages. Planned features should be labeled clearly and should not pretend to contain completed comparisons.

## Recommendation Claims

Avoid misleading universal recommendations. Explain assumptions and tradeoffs, especially when comparing subscriptions, API costs, team seats, model quality, latency, or usage limits.

Do not display exact numeric prices as facts unless they are source-backed. Pending records should be labeled visibly as pending verification.

## Affiliate and Sponsored Disclosure Readiness

If affiliate links, sponsorships, or advertising relationships change materially, relevant pages and policies must disclose those relationships clearly before publication.

## Methodology and Disclaimer

The methodology page should explain comparison logic and limitations. The disclaimer page should remind readers to confirm current pricing and terms with official provider sources.

## Validation

`npm run check` validates AdSense readiness after build, including:

- `public/ads.txt` and `dist/ads.txt`
- the Google seller line in `ads.txt`
- the AdSense base script in representative built HTML
- a single AdSense script per representative page
- GA4 still present
- privacy page advertising disclosure language
- existing sitemap and robots checks through `scripts/validate-seo.mjs`
