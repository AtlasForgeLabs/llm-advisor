# LLM Advisor

LLM Advisor is an AI cost and decision platform for comparing AI subscriptions, model pricing, API costs, and team spending.

The site is intentionally static-first and GitHub Pages-compatible. It is not a SaaS dashboard, backend app, pricing database, crawler, or login-based product at this stage.

Public contact: `contact@llm-advisor.com`.

## Positioning

LLM Advisor helps individuals, developers, creators, startups, and small teams choose cost-effective AI products by comparing:

- AI subscription plans
- model and API pricing
- expected team costs
- pricing changes and savings signals
- practical decision tradeoffs

## Tech Stack

- Astro static site
- TypeScript
- Static JSON/data files when data is added
- GitHub Actions
- GitHub Pages

## Install

```bash
npm install
```

## Run Locally

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Check

```bash
npm run check
```

The check command runs Astro validation and a lightweight foundation validator that confirms required pages, docs, CNAME, and non-empty content are present.

It also runs data validation for the static JSON contract, including slug uniqueness, cross-record references, ISO timestamps, and pricing source requirements.

It also validates SEO publishing output after a build, including `robots.txt`, `CNAME`, generated sitemap files, required sitemap routes, and production canonical URLs.

## Deployment

The project deploys from the `main` branch to GitHub Pages using `.github/workflows/deploy.yml`.

The workflow:

- checks out the repository
- installs Node dependencies with `npm ci`
- builds the Astro static site
- uploads the `dist` artifact
- deploys with official GitHub Pages actions

No external secrets are required for normal static deployment.

## SEO Publishing

Production domain: `https://llm-advisor.com`

Google Search Console sitemap URL:

```text
https://llm-advisor.com/sitemap-index.xml
```

Robots URL:

```text
https://llm-advisor.com/robots.txt
```

The sitemap is generated during `npm run build` by the official Astro sitemap integration from the current static and generated Astro routes. GitHub Actions deploys the generated sitemap files with the rest of `dist`.

## GitHub Pages Compatibility Rules

- Keep `output: 'static'` in Astro.
- Do not add a backend runtime.
- Do not add server APIs.
- Do not add database servers.
- Do not add login, payment, or SaaS dashboard features without explicit approval.
- Public data must be static JSON or generated before build.
- Future calculators must run client-side only.

## What Not To Add Without Explicit Approval

- scraping automation
- OpenClaw tasks
- Data Hub implementation
- pricing database
- backend functions
- serverless APIs
- authentication
- payment flows
- cloud service dependencies
- large page generation

See `AGENTS.md` and `docs/` before making meaningful changes.

## Data Contract

The production data contract lives in `src/lib/schema.ts`. Static records live in `src/data/*.json`.

Current data files include vendors, products, plans, models, providers, API price placeholders, subscription price placeholders, comparisons, use cases, price changes, and sources.

Important: seeded records are production-shaped but mostly pending verification. Exact numeric prices are intentionally omitted or `null` until source-backed values are added with source URL and access timestamps.

## Data-Driven Routes

The site now statically generates directory and detail pages for:

- `/vendors`
- `/products`
- `/plans`
- `/models`
- `/api-pricing`
- `/compare`
- `/use-cases`
- `/price-radar`

Client-side calculators are available under `/calculators`. They use user-entered values and do not claim official prices.
