import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT_DIR = path.resolve(process.cwd());
const INPUT_PATH = path.join(ROOT_DIR, "data", "touhou_list.csv");
const OUTPUT_PATH = path.join(ROOT_DIR, "data", "touhou_normalized.json");

function sha1_8(input) {
  return crypto.createHash("sha1").update(input).digest("hex").slice(0, 8);
}

function normalizeKey(s) {
  return String(s ?? "")
    .normalize("NFKC")
    .trim()
    .replace(/\s+/gu, "");
}

function slugifyAsciiId(s) {
  const str = String(s ?? "")
    .normalize("NFKC")
    .toLowerCase();

  const slug = str
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+/, "")
    .replace(/_+$/, "")
    .replace(/_+/g, "_");

  return slug || "item";
}

function makeUniqueId(base, stableKey, used) {
  if (!used.has(base)) {
    used.add(base);
    return base;
  }

  const withHash = `${base}__${sha1_8(stableKey)}`;
  if (!used.has(withHash)) {
    used.add(withHash);
    return withHash;
  }

  // Extremely unlikely, but keep it deterministic.
  let i = 2;
  while (true) {
    const candidate = `${withHash}_${i}`;
    if (!used.has(candidate)) {
      used.add(candidate);
      return candidate;
    }
    i += 1;
  }
}

function parseTsv(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/\uFEFF/g, "").trimEnd())
    .filter((l) => l.trim() !== "");

  if (lines.length === 0) return [];

  const header = lines[0].split("\t");
  const expected = ["대분류", "소분류", "한국어", "일본어", "영어"];
  const headerOk = expected.every((v, idx) => header[idx] === v);
  if (!headerOk) {
    throw new Error(
      `Unexpected header in ${INPUT_PATH}: ${JSON.stringify(header)}`
    );
  }

  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cols = lines[i].split("\t");
    if (cols.length < 5) {
      throw new Error(
        `Bad row at line ${i + 1}: expected 5 columns, got ${cols.length}`
      );
    }
    const [major_ja, sub_ja, name_ko, name_ja, name_en] = cols;
    rows.push({
      major_ja,
      sub_ja,
      name_ko,
      name_ja,
      name_en,
      source_line: i + 1,
    });
  }
  return rows;
}

function classifyWorkType(work_section_ja) {
  switch (work_section_ja) {
    case "旧作":
    case "WinSTG作品":
    case "黄昏フロンティア作品":
      return "game";
    case "音楽作品":
      return "music";
    case "書籍作品":
      return "book";
    default:
      return "unknown";
  }
}

function build() {
  const input = fs.readFileSync(INPUT_PATH, "utf8");
  const rows = parseTsv(input);

  const usedWorkIds = new Set();
  const usedCharIds = new Set();
  const usedTrackIds = new Set();

  /** @type {Map<string, any>} */
  const worksById = new Map();
  /** @type {Map<string, string>} */
  const workIdByJaNameKey = new Map();

  function ensureWork({
    name_ko,
    name_ja,
    name_en,
    work_section_ja,
    derived_from,
    type_override,
  }) {
    const stableKey = ["work", work_section_ja, name_ja, name_en, name_ko]
      .filter(Boolean)
      .join("|");

    const base = slugifyAsciiId(name_en || name_ja || name_ko);
    const id = makeUniqueId(base, stableKey, usedWorkIds);

    if (worksById.has(id)) return worksById.get(id);

    const work = {
      id,
      type: type_override || classifyWorkType(work_section_ja),
      work_section_ja: work_section_ja || "",
      name_ko: name_ko || "",
      name_ja: name_ja || "",
      name_en: name_en || "",
      aliases_ko: [],
      aliases_ja: [],
      aliases_en: [],
      // Pre-computed search values; consumers can normalize (NFKC + lower + remove spaces).
      search: Array.from(
        new Set(
          [
            id,
            name_ko,
            name_ja,
            name_en,
            work_section_ja,
            derived_from ? String(derived_from) : "",
          ].filter(Boolean)
        )
      ),
      derived_from: derived_from || null,
    };

    worksById.set(id, work);

    const jaKey = normalizeKey(name_ja);
    if (jaKey) workIdByJaNameKey.set(jaKey, id);

    return work;
  }

  // 1) Create works from 作品部門 rows (authoritative ko/ja/en for works).
  for (const r of rows) {
    if (r.major_ja !== "作品部門") continue;
    ensureWork({
      name_ko: r.name_ko,
      name_ja: r.name_ja,
      name_en: r.name_en,
      work_section_ja: r.sub_ja,
      derived_from: null,
      type_override: null,
    });
  }

  // 2) Create derived works for music subcategories that aren't in 作品部門.
  for (const r of rows) {
    if (r.major_ja !== "音楽部門") continue;
    const subKey = normalizeKey(r.sub_ja);
    if (!subKey) continue;
    if (workIdByJaNameKey.has(subKey)) continue;

    // Use the subcategory as the work name (at least in Japanese).
    ensureWork({
      name_ko: "",
      name_ja: r.sub_ja,
      name_en: r.sub_ja,
      work_section_ja: "音楽部門(derived)",
      derived_from: "music_subcategory",
      type_override: "music",
    });
  }

  /** @type {any[]} */
  const characters = [];
  /** @type {any[]} */
  const tracks = [];

  // 3) Characters + Tracks.
  for (const r of rows) {
    if (r.major_ja === "人妖部門") {
      const stableKey = ["character", r.sub_ja, r.name_ja, r.name_en].join("|");
      const base = slugifyAsciiId(r.name_en || r.name_ja || r.name_ko);
      const id = makeUniqueId(base, stableKey, usedCharIds);

      const maybeWorkId = workIdByJaNameKey.get(normalizeKey(r.sub_ja)) || null;
      characters.push({
        id,
        name_ko: r.name_ko || "",
        name_ja: r.name_ja || "",
        name_en: r.name_en || "",
        aliases_ko: [],
        aliases_ja: [],
        aliases_en: [],
        source_work_id: maybeWorkId,
        group_major_ja: r.major_ja,
        group_sub_ja: r.sub_ja,
        search: Array.from(
          new Set(
            [
              id,
              r.name_ko,
              r.name_ja,
              r.name_en,
              r.sub_ja,
              maybeWorkId ? worksById.get(maybeWorkId)?.name_en : "",
              maybeWorkId ? worksById.get(maybeWorkId)?.name_ja : "",
            ].filter(Boolean)
          )
        ),
        source: {
          file: "data/touhou_list.csv",
          line: r.source_line,
        },
      });
      continue;
    }

    if (r.major_ja === "音楽部門") {
      const workId = workIdByJaNameKey.get(normalizeKey(r.sub_ja)) || null;
      const work = workId ? worksById.get(workId) : null;
      const trackSlug = slugifyAsciiId(r.name_en || r.name_ja || r.name_ko);

      const stableKey = [
        "track",
        r.sub_ja,
        r.name_ja,
        r.name_en,
        r.name_ko,
      ].join("|");

      const base = work
        ? `${work.id}__${trackSlug}`
        : `${slugifyAsciiId(r.sub_ja)}__${trackSlug}`;

      const id = makeUniqueId(base, stableKey, usedTrackIds);

      tracks.push({
        id,
        name_ko: r.name_ko || "",
        name_ja: r.name_ja || "",
        name_en: r.name_en || "",
        aliases_ko: [],
        aliases_ja: [],
        aliases_en: [],
        source_work_id: workId,
        group_major_ja: r.major_ja,
        group_sub_ja: r.sub_ja,
        search: Array.from(
          new Set(
            [
              id,
              r.name_ko,
              r.name_ja,
              r.name_en,
              r.sub_ja,
              work ? work.name_en : "",
              work ? work.name_ja : "",
            ].filter(Boolean)
          )
        ),
        source: {
          file: "data/touhou_list.csv",
          line: r.source_line,
        },
      });
      continue;
    }
  }

  // 4) Build relationship indexes.
  /** @type {Record<string, string[]>} */
  const work_to_character_ids = {};
  for (const c of characters) {
    if (!c.source_work_id) continue;
    (work_to_character_ids[c.source_work_id] ||= []).push(c.id);
  }
  for (const k of Object.keys(work_to_character_ids)) {
    work_to_character_ids[k].sort();
  }

  /** @type {Record<string, string[]>} */
  const work_to_track_ids = {};
  for (const t of tracks) {
    if (!t.source_work_id) continue;
    (work_to_track_ids[t.source_work_id] ||= []).push(t.id);
  }
  for (const k of Object.keys(work_to_track_ids)) {
    work_to_track_ids[k].sort();
  }

  const works = Array.from(worksById.values()).sort((a, b) =>
    a.id.localeCompare(b.id)
  );
  characters.sort((a, b) => a.id.localeCompare(b.id));
  tracks.sort((a, b) => a.id.localeCompare(b.id));

  const out = {
    meta: {
      source: "data/touhou_list.csv",
      generated_at: new Date().toISOString(),
      counts: {
        works: works.length,
        characters: characters.length,
        tracks: tracks.length,
      },
      notes: [
        "IDs are ASCII, derived from names; collisions get a deterministic __<sha1_8> suffix.",
        "Search is handled by normalizing strings (NFKC + lower + remove spaces) and matching against each entity.search array.",
      ],
    },
    works,
    characters,
    tracks,
    index: {
      work_to_character_ids,
      work_to_track_ids,
    },
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(out, null, 2) + "\n", "utf8");
  return out.meta.counts;
}

const counts = build();
process.stdout.write(
  `Wrote ${OUTPUT_PATH} (works=${counts.works}, characters=${counts.characters}, tracks=${counts.tracks})\n`
);
