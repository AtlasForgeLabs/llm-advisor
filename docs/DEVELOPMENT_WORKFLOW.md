# Development Workflow

## Local Development

Install dependencies:

```bash
npm install
```

Run the local Astro server:

```bash
npm run dev
```

## OpenClaw pricing import

After QA approves `pre-import-qa/current/` outputs in the Data Hub:

```bash
npm run import:openclaw-pricing -- --dry-run
npm run import:openclaw-pricing
npm run build
npm run check
```

Imports are idempotent upserts from `pre-import-qa/current` importable files only. Reports land in `reports/openclaw-pricing-import-report.json`; history is capped at 50 entries in `reports/openclaw-pricing-import-history.json`.

## Build

```bash
npm run build
```

The build output is written to `dist`.

## Validation

```bash
npm run check
```

This runs Astro checks and the foundation validation script.
It also runs `scripts/validate-data.mjs` to validate static JSON records, references, timestamps, pricing source rules, and generated route files.
It also runs `scripts/validate-seo.mjs` to validate the built sitemap, robots.txt, CNAME, required sitemap routes, and production canonical URLs.
It also runs `scripts/validate-adsense.mjs` and `scripts/validate-links.mjs` on the built `dist/` output.

Run `npm run build` before `npm run check` when validating SEO, AdSense, or link output locally.

For public external links, use `SmartLink` (`src/components/SmartLink.astro`). See **Link behavior rules** in `AGENTS.md`.

## Deployment

Pushes to `main` trigger the GitHub Pages workflow. The workflow installs dependencies, builds the site, uploads `dist`, and deploys through official GitHub Pages actions.

## AI-Agent Iteration Process

For each meaningful task, an AI agent should:

1. Inspect the current repository state.
2. Keep the project static and GitHub Pages-compatible.
3. Make scoped changes only.
4. Preserve source attribution, verification status, and timestamp fields for data changes.
5. Do not add numeric pricing without source URL and source access timestamp.
6. Update documentation when architecture, workflow, design, content rules, or link behavior change.
7. Run `npm run build` and `npm run check` (includes link validation for public external links).
8. Summarize files changed, commands run, validation results, and assumptions.

## Expected Output After Each Agent Task

Agents should report:

- files changed
- commands run
- validation results
- deployment implications
- known issues or assumptions
- recommended next action
