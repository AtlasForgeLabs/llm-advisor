# AI Agent Context

## Current Architecture

LLM Advisor is a static Astro website configured for GitHub Pages deployment at `https://llm-advisor.com`.

The current implementation includes:

- shared Astro layouts
- shared header and footer components
- global CSS design tokens
- a production-oriented homepage
- essential trust, legal, and policy pages
- GitHub Actions deployment workflow
- lightweight foundation validation script

## Important Directories

- `src/pages/`: Astro routes
- `src/layouts/`: base HTML and site wrapper layouts
- `src/components/`: reusable UI/content components
- `src/styles/`: global styles
- `src/data/`: static constants and future static data
- `public/`: static public assets
- `docs/`: project documentation for humans and AI agents
- `scripts/`: local validation scripts

## Page Organization

Astro file-based routing is used. The homepage is `src/pages/index.astro`. Trust and legal pages are separate route files under `src/pages/`.

## Deployment Model

Deployment is static GitHub Pages from the `main` branch. The workflow builds Astro output into `dist` and deploys with official GitHub Pages actions.

## Known Constraints

- No backend runtime.
- No server APIs.
- No database server.
- No login or payments.
- No scraping or OpenClaw automation in the current foundation.
- Future public data must be build-time/static JSON.
- Future calculators must be client-side only.
