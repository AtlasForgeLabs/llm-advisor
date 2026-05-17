# AI Agent Instructions for LLM Advisor

## Mission

LLM Advisor is a production-oriented static website for AI cost and decision guidance. It helps readers compare AI plans, model pricing, API costs, team costs, pricing changes, and cost-effective product choices.

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
- `public/`: static assets, `CNAME`, `robots.txt`, favicon
- `docs/`: architecture, workflow, SEO, design, and AI-agent documentation
- `.github/workflows/`: GitHub Pages deployment

## Validation Requirements

Before finishing a task, run the most relevant validation commands. For normal site changes:

```bash
npm run build
npm run check
```

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
