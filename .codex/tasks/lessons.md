# Lessons

## 2026-03-13
- When the user specifies a package manager for this repo, treat it as authoritative immediately. Do not keep the default planning assumption; switch the bootstrap, lockfile, scripts, and verification flow to that package manager before continuing.
- When the user asks for an Apple-like visual direction, do not improvise a generic premium theme. Use HIG-style cues directly: system font stack, restrained blue/gray palette, translucent materials, subtle separators, segmented controls, and content-first hierarchy.
- When the user asks for more visibility after a theme pass, raise contrast at the token and shared-component level first: darker foregrounds, stronger borders, and more opaque materials. Do not try to solve it with isolated one-off color tweaks.
- When the user asks to undo the last visual change, revert only the latest styling delta and preserve the previously accepted theme direction.
