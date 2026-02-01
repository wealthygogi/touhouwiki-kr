# Draft: GachaGame Selection UI + Roll Mode Semantics

## Requirements (confirmed)
- Repo is a Docusaurus site.
- GachaGame component: `src/components/GachaGame/index.tsx`.
- Data source: `static/data/touhou_normalized.json` loaded via `fetch`.
- Current UX problem: work picker is native `<select multiple>`; simple click replaces selection; desired: click toggles selection on/off without modifier keys; previous selections remain.
- Current roll mode problem: roll mode feels like it does nothing; semantics likely unclear and/or effects not observable.
- Current modes:
  - Scope: `all` vs `selectedWorks`.
  - Roll: `global` (uniform by character) vs `byWork` (uniform by work, then uniform by character within work; plus “common chars” always in pool).
- Exclusions: characters with `group_sub_ja` of `"その他（ゲーム）"` and `"その他（書籍）"` must be excluded from pools.
- Work label overrides in picker:
  - `dolls_in_pseudo_paradise` shown as `비봉구락부`.
  - `touhou_gumon_gensokyo_chronicle` shown as `동방구문사기`.

## Technical Decisions (tentative)
- Replace native multi-select with accessible custom multi-select UI (checkbox-listbox or combobox+chips) so click toggles without modifiers.
- Make roll mode effects observable via an in-UI “odds preview” and clearer naming/description.

## Research Findings
- (pending) Explore agent: current implementation details + existing UI patterns.
- (pending) Librarian agent: a11y patterns for multi-select + probability communication.

## Scope Boundaries
- INCLUDE: Work selection UI replacement; clear/observable roll mode semantics; ensure required exclusions; preserve work label overrides.
- EXCLUDE: Any change to underlying dataset generation or adding new data fields (unless unavoidable).

## Open Questions
- What exact UI style is preferred for selecting works (scrolling checkbox list vs searchable combobox + selected chips)?
- Should roll mode “observable effect” be shown as exact computed probabilities, approximate/relative indicators, or example outcomes?
