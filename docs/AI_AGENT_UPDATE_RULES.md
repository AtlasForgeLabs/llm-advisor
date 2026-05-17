# AI Agent Update Rules

## Required Documentation Check

After every meaningful code change, AI agents must check whether the following documents need updates:

- `README.md`
- `AGENTS.md`
- `docs/ARCHITECTURE.md`
- `docs/AI_AGENT_CONTEXT.md`
- `docs/DEVELOPMENT_WORKFLOW.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/SEO_AND_ADSENSE_REQUIREMENTS.md`

## Keep Reality and Documentation Aligned

Do not let docs drift from the actual project. If architecture, deployment, validation, design tokens, page organization, or data rules change, update the relevant docs in the same task.

## Implemented vs Planned

Clearly distinguish implemented capabilities from planned future work. Do not describe future data scraping, pricing databases, calculators, dashboards, or large page sets as implemented unless they actually exist in the repository.

## Avoid Speculative Claims

Do not add speculative future features as facts. It is acceptable to describe planned directions when clearly labeled as future or planned.

## Link Behavior Documentation

When adding or changing public pages or components that render external URLs, agents must:

- use `SmartLink` from `src/components/SmartLink.astro` (or the same `src/lib/links.ts` rules)
- run `npm run build` and `npm run check` so `scripts/validate-links.mjs` can verify built HTML
- update `AGENTS.md` if link rules change

Do not let docs drift from implemented link behavior. External links open in a new tab with `rel="noopener noreferrer"`; internal, `mailto:`, `tel:`, and hash links stay same-tab/default.
