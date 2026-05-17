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

`npm run check` runs Astro checks, foundation validation, and static data validation.

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
