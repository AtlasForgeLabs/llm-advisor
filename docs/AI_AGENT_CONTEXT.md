# AI Agent Context

## Current Architecture

LLM Advisor is a static Astro website configured for GitHub Pages deployment at `https://llm-advisor.com`.

The public contact email is `contact@llm-advisor.com`.

The current implementation includes:

- shared Astro layouts
- shared header and footer components
- global CSS design tokens
- a production-oriented homepage
- essential trust, legal, and policy pages
- production TypeScript data schemas
- canonical static JSON data files
- data loading helpers
- data-driven directory and detail pages
- client-side calculator pages
- GitHub Actions deployment workflow
- lightweight foundation and data validation scripts

## Important Directories

- `src/pages/`: Astro routes
- `src/layouts/`: base HTML and site wrapper layouts
- `src/components/`: reusable UI/content components
- `src/styles/`: global styles
- `src/data/`: static constants and future static data
- `src/lib/`: TypeScript schema and data loading utilities
- `public/`: static public assets
- `docs/`: project documentation for humans and AI agents
- `scripts/`: local validation scripts

## Page Organization

Astro file-based routing is used. The homepage is `src/pages/index.astro`. Trust and legal pages are separate route files under `src/pages/`.

Data-driven pages are generated from JSON records under:

- `/vendors`
- `/products`
- `/plans`
- `/models`
- `/api-pricing`
- `/compare`
- `/use-cases`
- `/price-radar`

## Deployment Model

Deployment is static GitHub Pages from the `main` branch. The workflow builds Astro output into `dist` and deploys with official GitHub Pages actions.

Astro generates the production sitemap during build. The Search Console sitemap URL is `https://llm-advisor.com/sitemap-index.xml`, and `robots.txt` points to that URL.

## Known Constraints

- No backend runtime.
- No server APIs.
- No database server.
- No login or payments.
- No scraping or OpenClaw automation in the current foundation.
- Public data is build-time/static JSON.
- Calculators are client-side only and currently rely on manual inputs.
- Exact numeric prices are not seeded unless source-backed.
