# LLM Advisor

LLM Advisor is an AI cost and decision platform for comparing AI subscriptions, model pricing, API costs, and team spending.

The site is intentionally static-first and GitHub Pages-compatible. It is not a SaaS dashboard, backend app, pricing database, crawler, or login-based product at this stage.

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

## Deployment

The project deploys from the `main` branch to GitHub Pages using `.github/workflows/deploy.yml`.

The workflow:

- checks out the repository
- installs Node dependencies with `npm ci`
- builds the Astro static site
- uploads the `dist` artifact
- deploys with official GitHub Pages actions

No external secrets are required for normal static deployment.

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
