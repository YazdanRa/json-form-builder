# Form Builder MVP Architecture

## Summary

This project is a client-only form builder for assembling a constrained subset of Google Forms-style surveys and exporting them as JSON Schema Draft 2020-12.

## Runtime Shape

- Single Vite/React route at `/`
- One reducer-owned draft form state tree
- One browser-local persistence slot in `localStorage`
- Interactive preview and generated-schema surfaces rendered from the same source state

## Feature Boundaries

- Supported field types: `string`, `textarea`, `number`, `integer`, `boolean`, `email`, `date`, `enum`, `object`, `array_string`, `array_object`
- `object` and `array_object` create real JSON Schema nesting.
- Conditional rules are equality-based only and are scoped to the current logical object scope. Objects and array items create their own scopes.

## Module Layout

- `src/features/form-builder/model`: domain types, factories, reducer, schema compiler, validation, tree helpers
- `src/features/form-builder/ui`: builder shell, field editors, preview renderer
- `src/features/form-builder/lib`: browser persistence and export helpers
- `src/components/ui`: reusable shadcn-style primitives

## Validation Rules

- Missing field keys resolve from `key || title || field_n`
- Duplicate resolved keys are blocking within the same object scope
- Incomplete conditional rules are ignored during export
- Export actions are disabled when blocking validation issues are present

## Persistence

- Persist a single draft under a versioned storage key
- Hydrate on initial load
- Save with a short debounce to reduce noisy writes during typing
- Reset returns to the seeded sample form and clears persisted state
