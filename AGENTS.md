# AI Agent Instructions for LLM Advisor

## Mission

LLM Advisor is a production-oriented static website for AI cost and decision guidance. It helps readers compare AI plans, model pricing, API costs, team costs, pricing changes, and cost-effective product choices.

Public website contact must use `contact@llm-advisor.com`. Do not expose personal email addresses on public pages.

## Static-Only Rule

This project must remain fully compatible with GitHub Pages.

Do not add:

- backend runtime
- server APIs
- database servers
- login
- payments
- SaaS dashboard behavior
- cloud backend dependencies
- scraping jobs or automation unless explicitly approved

Public data must be static JSON or generated before the Astro build. Calculators and interactive features must be client-side only.

## Data Contract Rules

The production schema is defined in `src/lib/schema.ts`. Static JSON records live in `src/data/`.

Every price, plan, model, provider, product, comparison, use case, and source record should preserve verification status, quality status, timestamps, and source references where applicable.

Do not add exact numeric pricing unless the record includes source attribution and a source access timestamp. Use `null` or omit the numeric value until verified.

Visible pages must distinguish verified data from pending verification and must show source and timestamp context where relevant.

## OpenClaw pricing import

Import QA-approved pricing only with `npm run import:openclaw-pricing` (`scripts/import-openclaw-pricing.mjs`).

Allowed inputs (read-only from Data Hub `pre-import-qa/current/`):

- `importable-normalized-subscription-prices.json`
- `importable-normalized-api-prices.json`
- `metadata-only-records.json`

Never import blocked files, raw normalized outputs, excluded regional prices, non-default regional prices, or SGD records. Do not write back to Data Hub.

The import is **upsert-based and idempotent**: stable deterministic price IDs, content hashing, insert/update/unchanged counts, bounded history in `reports/openclaw-pricing-import-history.json` (latest 50 runs), and reports in `reports/openclaw-pricing-import-report.json`. Use `npm run import:openclaw-pricing -- --dry-run` before applying. Repeated imports with the same input must not duplicate records. Records absent from a new import batch are retained, not deleted.

Preserve `source_url`, `source_accessed_at`, `pricing_region`, `currency`, `region_policy`, `normalized_at`, warnings, and review notes. Metadata-only rows must stay `metadata_only` and must not be shown as verified prices. Price changes are appended to `src/data/price-changes.json` when imported values change.

## Design Principles

- light-first interface
- professional AI FinOps style
- trustworthy and data-driven
- dark navy gradient hero is acceptable
- blue, cyan, and violet accents
- green for savings
- orange for price changes
- avoid cyberpunk, excessive neon, crypto/Web3 styling, and generic AI illustration-heavy visuals

## SEO and Trust Requirements

Every meaningful public page should have:

- clear title and meta description
- canonical URL support through the shared layout
- readable, project-specific content
- source attribution when factual pricing claims are introduced
- visible last updated date when relevant
- methodology clarity for comparisons and recommendations

Do not publish thin placeholder pages that imply content exists when it does not.

## Link behavior rules

Public links must preserve reader context on LLM Advisor. Use the shared link helpers; do not invent one-off external link markup.

**External links (new tab required)**

- Public external `http`/`https` links must use `SmartLink` from `src/components/SmartLink.astro` or equivalent logic from `src/lib/links.ts` (`isExternalHref`, `externalLinkRel`).
- External links must open in a new tab: `target="_blank"`.
- External links must include `rel="noopener noreferrer"`.
- Do not manually add bare external `<a href="https://...">` links on public pages unless the same `target` and `rel` behavior is guaranteed.

**Internal links (same tab)**

- Internal links must remain same-tab. Do not add `target="_blank"` to internal navigation or in-site content links.
- Relative paths (for example `/about`, `/privacy`, `/products/...`) are internal.
- Same-domain absolute links to `llm-advisor.com` (with or without `www`) are internal.

**Special schemes (default behavior)**

- `mailto:`, `tel:`, and hash-only links (`#section`) must not be forced to open in a new tab.

**Data-driven URLs**

When rendering URLs from JSON or other static data, use `SmartLink` (or the same helper logic) in the rendering component. This includes, but is not limited to:

- `source_url` and official source links in `SourceList`
- vendor `website_url` when displayed
- Google links (for example ad settings)
- GitHub links
- documentation and third-party vendor pages

Do not edit every JSON record manually; fix the component that renders the URL.

**Validation**

- `scripts/validate-links.mjs` checks built HTML in `dist/` after a build.
- `npm run check` includes link validation and must pass before commit.
- Run `npm run build` before `npm run check` when validating link output locally.

## Coding Conventions

- Use Astro components and layouts for shared page structure.
- Keep global design tokens in `src/styles/global.css`.
- Keep reusable data in `src/data/`.
- Keep pages in `src/pages/`.
- Keep content concise, specific, and auditable.
- Prefer simple static structures over fragile tooling.

## File Organization

- `src/pages/`: route pages
- `src/layouts/`: shared layouts and SEO shell
- `src/components/`: reusable page components
- `src/styles/`: global styles and design tokens
- `src/data/`: static project data and constants
- `src/lib/`: schema and data-loading utilities
- `public/`: static assets, `CNAME`, `robots.txt`, favicon
- `docs/`: architecture, workflow, SEO, design, and AI-agent documentation
- `.github/workflows/`: GitHub Pages deployment

## Validation Requirements

Before finishing a task, run the most relevant validation commands. For normal site changes:

```bash
npm run build
npm run check
```

`npm run check` runs Astro checks, foundation validation, static data validation, SEO validation, AdSense readiness validation, and link validation (after build).

AdSense base script and `public/ads.txt` are integrated for review readiness. Do not add manual ad units or visible ad slots unless explicitly requested.

If dependencies are not installed, run `npm install` first.

## Commit Hygiene

- Keep changes scoped to the requested task.
- Do not mix unrelated refactors with content or feature changes.
- Do not revert user changes unless explicitly instructed.
- Use clear commit messages that describe the actual change.
- Push completed development work to the configured remote when requested by the project owner.

## Documentation Update Rule

After every meaningful architecture, workflow, design-system, deployment, or content-model change, AI agents must check whether these files need updates:

- `README.md`
- `AGENTS.md`
- `docs/ARCHITECTURE.md`
- `docs/AI_AGENT_CONTEXT.md`
- `docs/AI_AGENT_UPDATE_RULES.md`
- `docs/DEVELOPMENT_WORKFLOW.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/SEO_AND_ADSENSE_REQUIREMENTS.md`

Do not let documentation drift from reality. Clearly distinguish implemented capabilities from planned future work.
