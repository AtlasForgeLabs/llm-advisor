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

## Deployment

Pushes to `main` trigger the GitHub Pages workflow. The workflow installs dependencies, builds the site, uploads `dist`, and deploys through official GitHub Pages actions.

## AI-Agent Iteration Process

For each meaningful task, an AI agent should:

1. Inspect the current repository state.
2. Keep the project static and GitHub Pages-compatible.
3. Make scoped changes only.
4. Update documentation when architecture, workflow, design, or content rules change.
5. Run validation commands.
6. Summarize files changed, commands run, validation results, and assumptions.

## Expected Output After Each Agent Task

Agents should report:

- files changed
- commands run
- validation results
- deployment implications
- known issues or assumptions
- recommended next action
