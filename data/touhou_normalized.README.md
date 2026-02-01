# Touhou normalized data

Source: `data/touhou_list.csv`

Generated artifact: `data/touhou_normalized.json`

## What is inside

- `works`: All works (games, music albums, books)
- `characters`: Character entries from `人妖部門`
- `tracks`: Music track entries from `音楽部門`

## Relationships

- `characters[*].source_work_id` -> `works[*].id` (nullable)
- `tracks[*].source_work_id` -> `works[*].id` (nullable)

Convenience indexes:

- `index.work_to_character_ids[workId]` -> character id list
- `index.work_to_track_ids[workId]` -> track id list

## IDs

- `id` values are ASCII-only and deterministic.
- IDs are derived from (en/ja/ko) names.
- If two entities would get the same id, a deterministic `__<sha1_8>` suffix is added.

## Multilingual search

Each entity has:

- `name_ko`, `name_ja`, `name_en`
- `aliases_ko`, `aliases_ja`, `aliases_en` (currently empty; reserved for future curation)
- `search`: an array of raw search strings (names, id, grouping strings)

Recommended query normalization for matching:

- Apply NFKC normalization
- Lowercase
- Remove whitespace

Example (JS):

```js
const normalize = (s) => (s || "").normalize("NFKC").toLowerCase().replace(/\s+/g, "");
const hit = (entity, q) => {
  const nq = normalize(q);
  return entity.search.some((t) => normalize(t).includes(nq));
};
```

## Regeneration

```sh
node scripts/build-touhou-data.mjs
```
