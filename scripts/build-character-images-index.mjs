import fs from "node:fs/promises";
import path from "node:path";

const REPO_ROOT = process.cwd();
const DATASET_PATH = path.join(REPO_ROOT, "data", "touhou_normalized_v2.json");
const IMG_ROOT = path.join(REPO_ROOT, "static", "img");
const OUTPUT_PATH = path.join(REPO_ROOT, "data", "touhou_character_images_index.json");

const EXTENSIONS = new Set([".png"]);

const SUBSTRING_ALIASES = [
  ["kochiya", "kotiya"],
  ["hijiri", "hiziri"],
  ["meiling", "meiring"],
  ["aunn", "aun"],
  ["tenkyuu", "tenkyu"],
  ["goutokuji", "goutokuzi"],
  ["hata_no", "hatano"],
  ["joon", "jyoon"],
  ["shou", "syou"],
  ["shizuha", "sizuha"],
  ["yuma", "yuuma"],
  ["yuugi", "yugi"],
  ["futatsuiwa", "hutatsuiwa"],
  ["momiji", "momizi"],
  ["inubashiri", "inubasiri"],
  ["kawashiro", "kawasiro"],
  ["reiuji", "reiuzi"],
  ["kishin", "kisin"],
  ["asakura", "asaki"],
  ["tojiko", "toziko"],
  ["singyoku", "shingyoku"],
  ["yuugen", "yugen"],
  ["joutouguu", "joutougu"],
  ["kicchou", "kitcho"],
  ["shameimaru", "syameimaru"],
  ["fujiwara", "huziwara"],
];

const FILENAME_PREFIX_STRIPS = ["captain_"];

// For cases where dataset ID and filename are different words.
// Keep this list tiny and justified.
const ID_SLUG_OVERRIDES = {
  giant_catfish: ["oo_namazu"],
  reisen: ["reisen_earth_rabbit"],
};

function isObject(v) {
  return typeof v === "object" && v !== null;
}

function toArray(v) {
  return Array.isArray(v) ? v : [];
}

function thNumber(gameId) {
  if (gameId === "etc") return 100000;
  if (gameId === "music") return 90000;
  const m = /^th(\d+)/.exec(gameId);
  if (!m) return -1;
  return Number.parseInt(m[1], 10);
}

async function walkDir(root) {
  const out = [];
  const stack = [root];

  while (stack.length) {
    const dir = stack.pop();
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const ent of entries) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        stack.push(p);
        continue;
      }
      if (!ent.isFile()) continue;
      out.push(p);
    }
  }
  return out;
}

function uniq(arr) {
  return Array.from(new Set(arr));
}

function clamp01(n) {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function generateSlugVariants(characterId) {
  const seed = [characterId];

  const tokens = characterId.split("_").filter(Boolean);

  const overrides = ID_SLUG_OVERRIDES[characterId];
  if (Array.isArray(overrides)) {
    for (const s of overrides) {
      if (typeof s === "string" && s) seed.push(s);
    }
  }

  // Common patterns:
  // - swapped tokens (family_given vs given_family)
  // - swapped first two tokens for multi-token ids (eiki_shiki_yamaxanadu -> shiki_eiki_yamaxanadu)
  if (tokens.length === 2) seed.push(`${tokens[1]}_${tokens[0]}`);
  if (tokens.length >= 3) seed.push(`${tokens[1]}_${tokens[0]}_${tokens.slice(2).join("_")}`);

  // Drop connective "no" token when present (watatsuki_no_toyohime -> watatsuki_toyohime)
  if (tokens.includes("no")) {
    const withoutNo = tokens.filter((t) => t !== "no");
    if (withoutNo.length >= 2) seed.push(withoutNo.join("_"));
    if (withoutNo.length >= 2) seed.push(`${withoutNo[1]}_${withoutNo[0]}_${withoutNo.slice(2).join("_")}`);
  }

  // Some dataset ids include epithets: sariel_angel_of_death -> sariel
  if (tokens.length >= 2) seed.push(tokens[0]);
  if (tokens.length >= 2) seed.push(`${tokens[0]}_${tokens[1]}`);
  if (tokens.length >= 3) seed.push(`${tokens[0]}_${tokens[1]}_${tokens[2]}`);

  const variants = new Set(seed);
  let expanded = true;
  let guard = 0;
  while (expanded && guard < 6) {
    expanded = false;
    guard += 1;
    for (const v of Array.from(variants)) {
      for (const [a, b] of SUBSTRING_ALIASES) {
        if (v.includes(a)) {
          const next = v.replaceAll(a, b);
          if (!variants.has(next)) {
            variants.add(next);
            expanded = true;
          }
        }
        if (v.includes(b)) {
          const next = v.replaceAll(b, a);
          if (!variants.has(next)) {
            variants.add(next);
            expanded = true;
          }
        }
      }
    }
  }

  return Array.from(variants);
}

async function main() {
  const datasetText = await fs.readFile(DATASET_PATH, "utf-8");
  const dataset = JSON.parse(datasetText);
  if (!isObject(dataset)) throw new Error("Invalid dataset JSON");

  const characters = toArray(dataset.characters);
  const characterIds = characters
    .map((c) => (isObject(c) && typeof c.id === "string" ? c.id : ""))
    .filter(Boolean);

  const files = await walkDir(IMG_ROOT);

  // slug -> candidates
  const slugToCandidates = new Map();
  for (const filePath of files) {
    const rel = path.relative(IMG_ROOT, filePath).replaceAll(path.sep, "/");
    const parts = rel.split("/");
    if (parts.length !== 2) continue;
    const [gameId, fileName] = parts;
    if (!(gameId === "etc" || gameId === "music" || /^th\d+$/.test(gameId))) continue;
    const ext = path.extname(fileName).toLowerCase();
    if (!EXTENSIONS.has(ext)) continue;
    const base = path.basename(fileName, ext);
    if (!base) continue;

    const url = `/img/${gameId}/${fileName}`;

    const addCandidate = (slug) => {
      const list = slugToCandidates.get(slug) || [];
      list.push({ gameId, url });
      slugToCandidates.set(slug, list);
    };

    addCandidate(base);
    for (const prefix of FILENAME_PREFIX_STRIPS) {
      if (base.startsWith(prefix) && base.length > prefix.length) {
        addCandidate(base.slice(prefix.length));
      }
    }
  }

  // characterId -> candidates
  const out = {};
  let mapped = 0;
  let totalCandidates = 0;

  for (const id of uniq(characterIds)) {
    const slugs = generateSlugVariants(id);
    const combined = [];
    for (const slug of slugs) {
      const cand = slugToCandidates.get(slug);
      if (!cand) continue;
      combined.push(...cand);
    }
    const dedupByUrl = new Map();
    for (const c of combined) {
      if (!c || typeof c.url !== "string" || typeof c.gameId !== "string") continue;
      dedupByUrl.set(c.url, c);
    }
    const candidates = Array.from(dedupByUrl.values());
    candidates.sort((a, b) => {
      const an = thNumber(a.gameId);
      const bn = thNumber(b.gameId);
      if (an !== bn) return bn - an; // newest first
      return a.url.localeCompare(b.url);
    });

    if (candidates.length > 0) {
      out[id] = candidates;
      mapped += 1;
      totalCandidates += candidates.length;
    }
  }

  // Stable stringify
  const sortedKeys = Object.keys(out).sort();
  const stable = {};
  for (const k of sortedKeys) stable[k] = out[k];

  const json = JSON.stringify(stable, null, 2) + "\n";
  await fs.writeFile(OUTPUT_PATH, json, "utf-8");

  const total = uniq(characterIds).length;
  const ratio = total ? Math.round((mapped / total) * 1000) / 10 : 0;
  // eslint-disable-next-line no-console
  console.log(
    `wrote ${path.relative(REPO_ROOT, OUTPUT_PATH)}: ${mapped}/${total} characters mapped (${ratio}%), ${totalCandidates} candidates total`
  );
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exitCode = 1;
});
