# Lessons

## 2026-03-13
- When the user says backward compatibility does not matter because the product has not launched, do not spend time preserving old local data shapes or adding migrations. Simplify the current contract directly and remove unsupported paths.
- When the user specifies a package manager for this repo, treat it as authoritative immediately. Do not keep the default planning assumption; switch the bootstrap, lockfile, scripts, and verification flow to that package manager before continuing.
- When the user asks for an Apple-like visual direction, do not improvise a generic premium theme. Use HIG-style cues directly: system font stack, restrained blue/gray palette, translucent materials, subtle separators, segmented controls, and content-first hierarchy.
- When the user asks for more visibility after a theme pass, raise contrast at the token and shared-component level first: darker foregrounds, stronger borders, and more opaque materials. Do not try to solve it with isolated one-off color tweaks.
- When the user asks to undo the last visual change, revert only the latest styling delta and preserve the previously accepted theme direction.
- When the user asks for commits at each step, create a checkpoint commit before new edits and keep subsequent requests split into separately scoped commits instead of batching everything into one final commit.
- When a builder-only grouping type does not map to a real JSON Schema primitive and the user tightens the export contract, remove the pseudo-type from the model and migrate saved drafts to the nearest real schema type instead of preserving custom grouping metadata.
- When the user asks for conditional visibility to be handled natively, compile it to standard JSON Schema `allOf` / `if` / `then` branches and keep the preview driven by the same rule set instead of introducing custom export metadata.
- Do not describe JSON Schema conditionals as UI behavior. `if` / `then` / `else`, `oneOf`, and `dependentSchemas` define validation and active schema branches; hide/disable/read-only behavior belongs to the renderer and should be documented as renderer policy, not schema semantics.
- When the product is positioned as standards-only JSON Schema, remove builder controls like `Placeholder` that are renderer-only hints, and name unconditional validity controls explicitly as `Always Required` so they are not confused with conditional branch requirements.
- When a builder card starts feeling box-in-box or overly nested, flatten the summary chrome first: promote the title and metadata pills into the main card header and keep the collapse affordance at that same level instead of adding another inset container.
