# Draft: GachaGame normalized dataset + data-driven gacha

## Requirements (confirmed)
- Replace hardcoded gacha items with items derived from `data/touhou_normalized.json`.
- Keep scope to works + characters (no separate music tracks category for now), but keep the structure extensible.
- Character gacha must support two roll modes:
  - (A) Global pool: uniform over characters in-scope.
  - (B) Work-aware: pick a work uniformly in-scope, then pick a character uniformly within that work.
- Character gacha must support a work-scope control:
  - All works
  - Single specific work (dropdown, single-select)
- Constraints: no `as any`, no ts-ignore; minimal-change; follow existing patterns; verify with runnable commands.

## Technical Decisions (tentative)
- Data loading strategy: serve JSON via Docusaurus `static/` and `fetch()` it using `@docusaurus/useBaseUrl` (avoid `resolveJsonModule`).
- Derived pools computed from loaded dataset (memoized) rather than hardcoded `GAME_ITEMS`/`CHARACTER_ITEMS`.
- Guardrails: handle loading/error/empty pools; avoid SSR build-time crashes.

## Open Questions
- Should characters with `source_work_id: null` be included in the "global pool" mode?
  - Default recommendation: exclude them for now to keep work-aware mode coherent and dropdown filtering intuitive.

## Scope Boundaries
- INCLUDE: data-driven works and characters, character roll mode toggle, work-scope dropdown.
- EXCLUDE: music tracks category/button, tsconfig changes, heavy plugin/build-time generation.
