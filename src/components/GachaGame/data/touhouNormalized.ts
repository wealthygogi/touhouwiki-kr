export type WorkType = "game" | "music" | "book" | "unknown";

export interface Work {
  id: string;
  type: WorkType;
  name_ko: string;
  name_ja: string;
  name_en: string;
}

export interface Character {
  id: string;
  name_ko: string;
  name_ja: string;
  name_en: string;
  source_work_id: string | null;
  group_sub_ja: string;
}

export interface TouhouNormalizedData {
  works: Work[];
  characters: Character[];
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function asString(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function asWorkType(v: unknown): WorkType {
  return v === "game" || v === "music" || v === "book" || v === "unknown"
    ? v
    : "unknown";
}

function parseWork(v: unknown): Work | null {
  if (!isRecord(v)) return null;
  const id = asString(v.id);
  if (!id) return null;
  return {
    id,
    type: asWorkType(v.type),
    name_ko: asString(v.name_ko) || "",
    name_ja: asString(v.name_ja) || "",
    name_en: asString(v.name_en) || "",
  };
}

function parseCharacter(v: unknown): Character | null {
  if (!isRecord(v)) return null;
  const id = asString(v.id);
  if (!id) return null;

  const source_work_id = asString(v.source_work_id);
  const group_sub_ja = asString(v.group_sub_ja) || "";

  return {
    id,
    name_ko: asString(v.name_ko) || "",
    name_ja: asString(v.name_ja) || "",
    name_en: asString(v.name_en) || "",
    source_work_id: source_work_id ?? null,
    group_sub_ja,
  };
}

function parseTouhouNormalizedData(v: unknown): TouhouNormalizedData {
  if (!isRecord(v)) {
    throw new Error("Invalid dataset: expected object");
  }

  const worksRaw = v.works;
  const charactersRaw = v.characters;
  if (!Array.isArray(worksRaw) || !Array.isArray(charactersRaw)) {
    throw new Error("Invalid dataset: expected works[] and characters[]");
  }

  const works: Work[] = [];
  for (const w of worksRaw) {
    const parsed = parseWork(w);
    if (parsed) works.push(parsed);
  }

  const characters: Character[] = [];
  for (const c of charactersRaw) {
    const parsed = parseCharacter(c);
    if (parsed) characters.push(parsed);
  }

  return { works, characters };
}

let cached: TouhouNormalizedData | null = null;
let inflight: Promise<TouhouNormalizedData> | null = null;

export async function loadTouhouNormalizedData(
  url: string
): Promise<TouhouNormalizedData> {
  if (cached) return cached;
  if (inflight) return inflight;

  inflight = fetch(url)
    .then(async (r) => {
      if (!r.ok) {
        throw new Error(`Failed to load dataset: ${r.status} ${r.statusText}`);
      }
      const json: unknown = await r.json();
      return parseTouhouNormalizedData(json);
    })
    .then((data) => {
      cached = data;
      return data;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}
