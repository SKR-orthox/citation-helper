# AGENTS.md

## Project
Citation Helper (browser extension)

## Core rules
- Keep formatter outputs stable. Do not change citation formatting behavior unless the change is intentional.
- Isolate site-specific differences in extractor/normalization layers, not formatter layers.
- Preserve behavior for already supported sites (PubMed, Nature, SpringerLink). Avoid regressions.
- Keep diffs minimal and explain rationale/risks when behavior changes.

## Regression policy
- Snapshot tests are the regression baseline for citation output.
- Update snapshots only when output change is intended.
- If citation output changes, include fixture/snapshot updates and document why.

## Required test loop
1. Implement the smallest safe change.
2. Run `npm test`.
3. Run `npm run test:update` only when intentional output changes require snapshot refresh.
4. Re-run `npm test` after snapshot updates.

## Layering expectations
- Per-site extraction: `content/content-*.js`
- Shared reason codes: `content/reasons.js`
- Formatter logic: `formatters/*.js`
- Popup orchestration/UI: `popup.js`, `popup.html`
- Snapshot harness: `run-formatters.cjs`, `tests/fixtures/**`, `tests/snapshots/**`
- `content/content-common.js` is intentionally not part of runtime. If shared extractor logic is needed, introduce a clearly loaded module and wire it explicitly in manifests.

## Data model reality (lock this)
- Runtime extraction success currently requires `title` in all supported site scripts.
- `authors` may be empty for edge pages, but missing `title` is treated as parse failure at extractor level.
- `tests/fixtures/_policy/no-title.json` is a formatter policy case, not a runtime extraction success case.
- The current no-title policy snapshot asserts RIS returns an empty string for missing title; do not generalize this to extractor behavior.

## Implementation preference
- Prefer extractor/normalization fixes over formatter edits.
- Avoid adding dependencies or large refactors unless clearly necessary.
- When uncertain, ask one targeted question; otherwise proceed with reasonable assumptions.
