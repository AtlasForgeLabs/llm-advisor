# Design System

## Visual Style

LLM Advisor uses a clean AI FinOps style:

- light-first
- professional
- data-driven
- trustworthy
- modern with a slight technology feel
- dark navy gradient hero
- blue, cyan, and violet accents
- green for savings
- orange for price changes

Avoid cyberpunk, excessive neon, crypto/Web3 styling, and generic AI illustration-heavy layouts.

## Color Tokens

Core tokens are defined in `src/styles/global.css`:

- dark navy: `#07182f`
- navy: `#0b1f3f`
- blue: `#2563eb`
- cyan: `#06b6d4`
- violet: `#7c3aed`
- green savings: `#16a34a`
- orange price changes: `#f97316`
- ink: `#102033`
- muted text: `#607089`
- line: `#dbe5f2`
- soft background: `#f5f8fc`

## Typography

Use system sans-serif typography for fast static delivery and high readability. Headings should be confident and compact. Body copy should be clear, practical, and source-aware.

## Spacing

Use generous section spacing on desktop and tighter spacing on mobile. Keep content widths constrained for readability.

## Cards

Cards use an 8px border radius, subtle border, and restrained shadow. Do not nest cards inside cards.

## Tables

Future pricing tables should prioritize scanability, source dates, units, and clear assumptions. Use compact rows, sticky or repeated labels only when necessary, and accessible contrast.

## Badges

Badges should communicate real status, such as static-first, source type, update recency, savings, or price movement. Avoid decorative badges with no informational value.

Data pages use badges for verification status, data status, ecosystem, lifecycle, provider type, and workload type. Orange communicates pending verification or review states; green is reserved for verified or savings-oriented states.

## Data Tables

Data tables should make uncertainty visible. Use text such as "Pending verification" instead of blank or invented values when numeric pricing is not source-backed.

## CTA Rules

Calls to action should be clear and modest. Avoid aggressive SaaS conversion language until the product has substantive comparison content.

## Accessibility Basics

- Use semantic HTML.
- Maintain readable color contrast.
- Keep focus states visible.
- Do not rely on color alone for important meaning.
- Ensure responsive layouts do not overflow on small screens.
