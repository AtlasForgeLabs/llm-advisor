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
It also runs `scripts/validate-seo.mjs` to validate the built sitemap, robots.txt, CNAME, required sitemap routes, and production canonical URLs. Run `npm run build` before `npm run check` when validating SEO output locally.

## Deployment

Pushes to `main` trigger the GitHub Pages workflow. The workflow installs dependencies, builds the site, uploads `dist`, and deploys through official GitHub Pages actions.

## AI-Agent Iteration Process

For each meaningful task, an AI agent should:

1. Inspect the current repository state.
2. Keep the project static and GitHub Pages-compatible.
3. Make scoped changes only.
4. Preserve source attribution, verification status, and timestamp fields for data changes.
5. Do not add numeric pricing without source URL and source access timestamp.
6. Update documentation when architecture, workflow, design, or content rules change.
7. Run validation commands.
8. Summarize files changed, commands run, validation results, and assumptions.

## Expected Output After Each Agent Task

Agents should report:

- files changed
- commands run
- validation results
- deployment implications
- known issues or assumptions
- recommended next action
