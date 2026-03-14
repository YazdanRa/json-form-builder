# JSON Schema Form Builder

Client-only form builder MVP for creating Google Forms-style questionnaires and exporting them as standard JSON Schema Draft 2020-12.

## Stack

- Bun for package management and scripts
- Vite + React + TypeScript
- Tailwind CSS + shadcn-style UI primitives
- Framer Motion + Lucide icons
- Vitest + React Testing Library
- Playwright smoke coverage

## Quick Start

```bash
bun install
bun run dev
```

Open `http://localhost:5173`.

## Available Commands

```bash
bun run dev
bun run lint
bun run test:run
bun run build
bun run test:e2e
```

Install the Playwright browser once before the first end-to-end run:

```bash
bunx playwright install chromium
```

## Product Scope

- Build forms with nested objects, arrays, enum choices, and equality-based conditional visibility
- Preview the rendered structure interactively in-app
- Copy or export generated JSON Schema without custom `x-*` metadata
- Persist a single working draft locally in the browser

Out of scope for this MVP: auth, backend persistence, schema import, form publishing, and response collection.
