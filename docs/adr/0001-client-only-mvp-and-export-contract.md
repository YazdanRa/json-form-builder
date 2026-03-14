# ADR 0001: Client-Only MVP And JSON Schema Export Contract

## Status

Accepted

## Context

The project starts from an empty repository and needs to ship a focused MVP quickly. The priority is a production-clean local experience for designing form structures and exporting JSON Schema without backend dependencies.

## Decision

- Use `Vite + React + TypeScript` for the client application
- Use `bun` as the package manager and script runner
- Use `Tailwind CSS` plus local shadcn-style primitives for the UI layer
- Keep persistence browser-local only in v1
- Emit standard JSON Schema Draft 2020-12 only

## Export Contract

- Root output is always an object schema with Draft 2020-12 `$schema`
- `object` and `array_object` are the only grouping primitives and both map to real JSON Schema structure
- Conditional visibility compiles into native `allOf` / `if` / `then` branches and never uses custom `x-*` metadata
- Preview behavior should derive from the same condition rules that drive native schema branches
- Duplicate resolved keys block export instead of producing lossy or ambiguous schema output

## Consequences

- The MVP is easy to run, demo, and verify locally
- The export contract is stable enough for downstream tooling experiments
- Backend concerns, collaboration, response capture, and schema import remain out of scope until the client interaction model settles
