# Architecture

## Overview

LLM Advisor is a static Astro website designed for GitHub Pages. The architecture prioritizes maintainability, source transparency, and safe future iteration by AI agents.

## Static Astro Website

Astro builds the site into static files in `dist`. Pages are defined in `src/pages/`, shared layouts live in `src/layouts/`, and reusable UI components live in `src/components/`.

## GitHub Pages Deployment

The repository includes `.github/workflows/deploy.yml`, which deploys the static build from the `main` branch using official GitHub Pages actions.

## Data Model

No pricing database exists yet. Future public data should be represented as static JSON or generated before build. Data files should include enough metadata for source attribution and last reviewed dates.

## No Backend

The project must not introduce a backend runtime, server APIs, serverless functions, database server, login system, payment system, or SaaS dashboard without explicit approval.

## Future Calculators

Calculator pages now exist under `/calculators` and run entirely client-side with manual user inputs. They do not use backend APIs, tracking dependencies, or unverified official prices.

## Data-Driven Page Factory

The static data contract is defined in `src/lib/schema.ts`, with loading helpers in `src/lib/data.ts`.

Static JSON files in `src/data/` feed directory and detail routes for vendors, products, plans, models, API providers, comparisons, use cases, and price radar entries. Astro statically generates these pages at build time.

Seed records include US/global and China AI ecosystems. They are production-shaped but mostly pending verification, with exact numeric prices omitted or set to `null`.
