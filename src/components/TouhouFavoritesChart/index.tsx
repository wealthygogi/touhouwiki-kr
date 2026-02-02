import React, { useEffect, useMemo, useRef, useState } from "react";
import useBaseUrl from "@docusaurus/useBaseUrl";
import html2canvas from "html2canvas";
import styles from "./styles.module.css";

import RAW_DATA from "../../../data/touhou_normalized_v2.json";
import RAW_CHARACTER_IMAGES from "../../../data/touhou_character_images_index.json";

type FavoriteKind = "character" | "track" | "work";

type WorkType = "game" | "music" | "book" | "unknown";

type SourceRef = {
  file: string;
  line: number | null;
};

type BaseEntity = {
  id: string;
  name_ko: string;
  name_ja: string;
  name_en: string;
  search: string[];
  source?: SourceRef;
};

type WorkEntity = BaseEntity & {
  type: WorkType;
  work_section_ja: string;
  order_index: number | null;
};

type CharacterEntity = BaseEntity & {
  source_work_id: string | null;
};

type TrackEntity = BaseEntity & {
  source_work_id: string | null;
};

type TouhouNormalizedV2 = {
  meta?: {
    source?: string;
    generated_at?: string;
  };
  works: WorkEntity[];
  characters: CharacterEntity[];
  tracks: TrackEntity[];
};

type FavoriteItem = {
  kind: FavoriteKind;
  id: string;
  name_ko: string;
  name_ja: string;
  name_en: string;
  source_work_id: string | null;
  source_work_name_ko: string;
  source_work_name_ja: string;
  source_work_name_en: string;
  source_file: string;
  source_line: number | null;
  csv_order: number;
  search_key: string;
};

type CharacterImageCandidate = {
  gameId: string;
  url: string;
};

type CharacterImagesIndex = Record<string, CharacterImageCandidate[]>;

type PortraitState = {
  imageUrl: string;
  zoom: number;
  posX: number;
  posY: number;
  comment: string;
  updatedAt: string;
};

type PortraitStorage = {
  version: 1;
  items: Record<string, PortraitState>;
};

const PORTRAIT_STORAGE_KEY = "touhou_favorites_portraits_v1";
const PORTRAIT_STORAGE_VERSION = 1 as const;
const MAX_SELECTED_BY_KIND: Record<FavoriteKind, number> = {
  character: 4,
  track: 3,
  work: 3,
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.map((x) => (typeof x === "string" ? x : "")) : [];
}

function asNullableString(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function asNullableNumber(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function asWorkType(v: unknown): WorkType {
  return v === "game" || v === "music" || v === "book" || v === "unknown"
    ? v
    : "unknown";
}

function parseSourceRef(v: unknown): SourceRef | null {
  if (!isRecord(v)) return null;
  const file = asString(v.file);
  const line = asNullableNumber(v.line);
  if (!file) return null;
  return { file, line };
}

function parseDataset(v: unknown): TouhouNormalizedV2 {
  if (!isRecord(v)) throw new Error("Invalid dataset: expected object");
  const worksRaw = v.works;
  const charactersRaw = v.characters;
  const tracksRaw = v.tracks;
  if (!Array.isArray(worksRaw) || !Array.isArray(charactersRaw) || !Array.isArray(tracksRaw)) {
    throw new Error("Invalid dataset: expected works[]/characters[]/tracks[]");
  }

  const parseBase = (x: unknown): BaseEntity | null => {
    if (!isRecord(x)) return null;
    const id = asString(x.id);
    if (!id) return null;
    const source = parseSourceRef(x.source);
    return {
      id,
      name_ko: asString(x.name_ko),
      name_ja: asString(x.name_ja),
      name_en: asString(x.name_en),
      search: asStringArray(x.search),
      source: source || undefined,
    };
  };

  const works: WorkEntity[] = [];
  for (const w of worksRaw) {
    const base = parseBase(w);
    if (!base) continue;
    if (!isRecord(w)) continue;
    works.push({
      ...base,
      type: asWorkType(w.type),
      work_section_ja: asString(w.work_section_ja),
      order_index: asNullableNumber(w.order_index),
    });
  }

  const characters: CharacterEntity[] = [];
  for (const c of charactersRaw) {
    const base = parseBase(c);
    if (!base) continue;
    if (!isRecord(c)) continue;
    characters.push({
      ...base,
      source_work_id: asNullableString(c.source_work_id),
    });
  }

  const tracks: TrackEntity[] = [];
  for (const t of tracksRaw) {
    const base = parseBase(t);
    if (!base) continue;
    if (!isRecord(t)) continue;
    tracks.push({
      ...base,
      source_work_id: asNullableString(t.source_work_id),
    });
  }

  const meta = isRecord(v.meta) ? v.meta : undefined;
  return {
    meta: meta
      ? {
          source: isRecord(meta) ? asString(meta.source) : "",
          generated_at: isRecord(meta) ? asString(meta.generated_at) : "",
        }
      : undefined,
    works,
    characters,
    tracks,
  };
}

function parseCharacterImagesIndex(v: unknown): CharacterImagesIndex {
  if (!isRecord(v)) return {};
  const out: CharacterImagesIndex = {};
  for (const [k, vv] of Object.entries(v)) {
    if (!Array.isArray(vv)) continue;
    const list: CharacterImageCandidate[] = [];
    for (const x of vv) {
      if (!isRecord(x)) continue;
      const gameId = asString(x.gameId);
      const url = asString(x.url);
      if (!gameId || !url) continue;
      list.push({ gameId, url });
    }
    if (list.length) out[k] = list;
  }
  return out;
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

function loadPortraitStorage(): PortraitStorage {
  if (typeof window === "undefined") {
    return { version: PORTRAIT_STORAGE_VERSION, items: {} };
  }
  try {
    const raw = window.localStorage.getItem(PORTRAIT_STORAGE_KEY);
    if (!raw) return { version: PORTRAIT_STORAGE_VERSION, items: {} };
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) return { version: PORTRAIT_STORAGE_VERSION, items: {} };
    const version = (parsed.version === 1 ? 1 : 0) as 1 | 0;
    if (version !== 1) return { version: PORTRAIT_STORAGE_VERSION, items: {} };
    const itemsRaw = parsed.items;
    if (!isRecord(itemsRaw)) return { version: PORTRAIT_STORAGE_VERSION, items: {} };

    const items: Record<string, PortraitState> = {};
    for (const [id, v] of Object.entries(itemsRaw)) {
      if (!isRecord(v)) continue;
      const imageUrl = asString(v.imageUrl);
      const zoom = typeof v.zoom === "number" ? v.zoom : 1;
      const posX = typeof v.posX === "number" ? v.posX : 0.5;
      const posY = typeof v.posY === "number" ? v.posY : 0.2;
      const comment = asString(v.comment);
      const updatedAt = asString(v.updatedAt) || new Date().toISOString();
      if (!imageUrl) continue;
      items[id] = {
        imageUrl,
        zoom: clamp(zoom, 1, 3),
        posX: clamp01(posX),
        posY: clamp01(posY),
        comment,
        updatedAt,
      };
    }
    return { version: PORTRAIT_STORAGE_VERSION, items };
  } catch {
    return { version: PORTRAIT_STORAGE_VERSION, items: {} };
  }
}

function computeCrop(
  naturalW: number,
  naturalH: number,
  viewportW: number,
  viewportH: number,
  zoom: number,
  posX: number,
  posY: number
): {
  width: number;
  height: number;
  translateX: number;
  translateY: number;
  maxShiftX: number;
  maxShiftY: number;
} {
  const base = Math.max(viewportW / naturalW, viewportH / naturalH);
  const scale = base * zoom;
  const scaledW = naturalW * scale;
  const scaledH = naturalH * scale;
  const maxShiftX = Math.max(0, scaledW - viewportW);
  const maxShiftY = Math.max(0, scaledH - viewportH);

  const x = clamp01(posX);
  const y = clamp01(posY);
  const translateX = -maxShiftX * x;
  const translateY = -maxShiftY * y;

  return {
    width: scaledW,
    height: scaledH,
    translateX,
    translateY,
    maxShiftX,
    maxShiftY,
  };
}

function useImageNaturalSize(
  url: string | null
): { width: number; height: number; ready: boolean } {
  const [state, setState] = useState<{ width: number; height: number; ready: boolean }>({
    width: 0,
    height: 0,
    ready: false,
  });

  useEffect(() => {
    if (!url) {
      setState({ width: 0, height: 0, ready: false });
      return;
    }

    let cancelled = false;
    const img = new Image();
    img.src = url;

    const commit = () => {
      if (cancelled) return;
      const w = img.naturalWidth || 0;
      const h = img.naturalHeight || 0;
      if (w && h) setState({ width: w, height: h, ready: true });
      else setState({ width: 0, height: 0, ready: false });
    };

    if (img.complete) {
      commit();
    } else {
      img.addEventListener("load", commit);
      img.addEventListener("error", commit);
    }

    return () => {
      cancelled = true;
      img.removeEventListener("load", commit);
      img.removeEventListener("error", commit);
    };
  }, [url]);

  return state;
}

function useElementSize(
  ref: React.RefObject<HTMLElement>,
  enabled: boolean
): { width: number; height: number } {
  const [size, setSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const r = el.getBoundingClientRect();
      setSize({ width: r.width, height: r.height });
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [enabled, ref]);

  return size;
}

async function waitForImages(container: HTMLElement): Promise<void> {
  const imgs = Array.from(container.querySelectorAll("img"));
  await Promise.all(
    imgs.map(async (img) => {
      if (img.complete && img.naturalWidth > 0) return;
      const anyImg = img as unknown as { decode?: () => Promise<void> };
      const timeoutMs = 8000;
      const timeout = new Promise<void>((resolve) => window.setTimeout(resolve, timeoutMs));

      if (anyImg.decode) {
        try {
          await Promise.race([anyImg.decode(), timeout]);
          if (img.complete) return;
        } catch {
          // fall through
        }
      }

      await Promise.race([
        new Promise<void>((resolve) => {
          const done = () => resolve();
          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true });
        }),
        timeout,
      ]);
    })
  );
}

function normalizeKey(s: string): string {
  return String(s ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "");
}

function displayPrimaryName(v: { name_ko: string; name_ja: string; name_en: string }): string {
  return v.name_ko || v.name_ja || v.name_en || "(unknown)";
}

function displaySecondaryName(v: { name_ko: string; name_ja: string; name_en: string }): string {
  const primary = displayPrimaryName(v);
  if (primary === v.name_ko) return v.name_ja || v.name_en;
  if (primary === v.name_ja) return v.name_ko || v.name_en;
  return v.name_ko || v.name_ja;
}

function displayWorkLabel(ko: string, ja: string, en: string): string {
  const k = ko || "";
  const j = ja || "";
  const e = en || "";
  if (k && j) return `${k} / ${j}`;
  if (k && e) return `${k} / ${e}`;
  return k || j || e;
}

function displayWorkPrimaryName(ko: string, ja: string, en: string): string {
  return ko || ja || en || "";
}

function csvOrderOf(sourceLine: number | null): number {
  // data/touhou_list_v2.csv is 1-based line numbers.
  return typeof sourceLine === "number" && Number.isFinite(sourceLine)
    ? sourceLine
    : Number.POSITIVE_INFINITY;
}

type SeasonId = "spring" | "summer" | "autumn" | "winter";

type SeasonPreset = {
  id: SeasonId;
  label: string;
  description: string;
  colors: {
    bg: string;
    surface: string;
    ink: string;
    muted: string;
    border: string;
    accentA: string;
    accentB: string;
    accentASoft: string;
    accentBSoft: string;
    pngBackground: string;
  };
  overlayTop: string;
  overlayBottom: string;
};

const SEASON_PRESETS: SeasonPreset[] = [
  {
    id: "spring",
    label: "봄 | Spring",
    description: "벚꽃과 새싹의 따뜻한 느낌",
    colors: {
      bg: "#fff7fb",
      surface: "#ffffff",
      ink: "#2f1c34",
      muted: "rgba(47, 28, 52, 0.7)",
      border: "#f472b6",
      accentA: "#f472b6",
      accentB: "#34d399",
      accentASoft: "rgba(244, 114, 182, 0.2)",
      accentBSoft: "rgba(52, 211, 153, 0.16)",
      pngBackground: "#fff7fb",
    },
    overlayTop: "rgba(244, 114, 182, 0.12)",
    overlayBottom: "rgba(52, 211, 153, 0.12)",
  },
  {
    id: "summer",
    label: "여름 | Summer",
    description: "짙은 초록과 한여름의 생기",
    colors: {
      bg: "#f3fff4",
      surface: "#ffffff",
      ink: "#0b2b1a",
      muted: "rgba(11, 43, 26, 0.7)",
      border: "#16a34a",
      accentA: "#16a34a",
      accentB: "#22c55e",
      accentASoft: "rgba(34, 197, 94, 0.22)",
      accentBSoft: "rgba(16, 185, 129, 0.16)",
      pngBackground: "#f3fff4",
    },
    overlayTop: "rgba(34, 197, 94, 0.12)",
    overlayBottom: "rgba(20, 184, 166, 0.12)",
  },
  {
    id: "autumn",
    label: "가을 | Autumn",
    description: "단풍과 노을",
    colors: {
      bg: "#fff7ec",
      surface: "#ffffff",
      ink: "#3c1a07",
      muted: "rgba(60, 26, 7, 0.7)",
      border: "#fb923c",
      accentA: "#fb923c",
      accentB: "#f97316",
      accentASoft: "rgba(251, 146, 60, 0.2)",
      accentBSoft: "rgba(249, 115, 22, 0.16)",
      pngBackground: "#fff7ec",
    },
    overlayTop: "rgba(251, 146, 60, 0.12)",
    overlayBottom: "rgba(234, 179, 8, 0.12)",
  },
  {
    id: "winter",
    label: "겨울 | Winter",
    description: "차분한 눈빛",
    colors: {
      bg: "#f3f7ff",
      surface: "#ffffff",
      ink: "#111936",
      muted: "rgba(17, 25, 54, 0.7)",
      border: "#0ea5e9",
      accentA: "#0ea5e9",
      accentB: "#6366f1",
      accentASoft: "rgba(14, 165, 233, 0.2)",
      accentBSoft: "rgba(99, 102, 241, 0.16)",
      pngBackground: "#f3f7ff",
    },
    overlayTop: "rgba(14, 165, 233, 0.12)",
    overlayBottom: "rgba(99, 102, 241, 0.12)",
  },
];

const PNG_WIDTH = 1280;
const PNG_HEIGHT = 720;
const PNG_SCALE = 3;

function displayKoLine(v: { name_ko: string; name_ja: string; name_en: string }): string {
  return v.name_ko || v.name_en || v.name_ja || "(unknown)";
}

function joinSubtitle(base: string, subtitle: string, separator: string): string {
  const b = base || "";
  const s = subtitle || "";
  if (!b) return s;
  if (!s) return b;
  if (b.includes(s)) return b;
  return `${b} ${separator} ${s}`;
}

function displayWorkKoTitle(v: { name_ko: string; name_en: string }): string {
  return joinSubtitle(v.name_ko || "", v.name_en || "", "~");
}

function displayWorkJaTitle(v: { name_ja: string; name_en: string }): string {
  return joinSubtitle(v.name_ja || "", v.name_en || "", "～");
}

function displayJaLine(
  v: { name_ko: string; name_ja: string; name_en: string },
  primary: string
): string {
  const ja = v.name_ja || "";
  if (!ja) return "";
  return ja === primary ? "" : ja;
}

function escapeCsvField(v: string): string {
  const s = String(v ?? "");
  if (/[\n\r",]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function formatDateYYYYMMDD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function TouhouFavoritesChart(): React.JSX.Element {
  const baseUrlPrefix = useBaseUrl("/");
  const resolveStaticUrl = (u: string): string => {
    if (!u) return "";
    if (/^https?:\/\//.test(u)) return u;
    if (baseUrlPrefix && u.startsWith(baseUrlPrefix)) return u;
    if (u.startsWith("/")) return `${baseUrlPrefix.replace(/\/$/, "")}${u}`;
    return `${baseUrlPrefix}${u}`;
  };

  const dataset = useMemo(() => parseDataset(RAW_DATA as unknown), []);
  const characterImagesIndex = useMemo(
    () => parseCharacterImagesIndex(RAW_CHARACTER_IMAGES as unknown),
    []
  );

  const worksById = useMemo(() => {
    const m = new Map<string, WorkEntity>();
    for (const w of dataset.works) m.set(w.id, w);
    return m;
  }, [dataset.works]);

  const workCsvOrderById = useMemo(() => {
    const m = new Map<string, number>();
    const consider = (workId: string | null, sourceLine: number | null) => {
      if (!workId) return;
      const order = csvOrderOf(sourceLine);
      const prev = m.get(workId);
      if (prev == null || order < prev) m.set(workId, order);
    };

    for (const c of dataset.characters) consider(c.source_work_id, c.source?.line ?? null);
    for (const t of dataset.tracks) consider(t.source_work_id, t.source?.line ?? null);
    for (const w of dataset.works) consider(w.id, w.source?.line ?? null);

    return m;
  }, [dataset.characters, dataset.tracks, dataset.works]);

  const allItems = useMemo(() => {
    const items: FavoriteItem[] = [];

    const workNamesOf = (workId: string | null) => {
      if (!workId) return { ko: "", ja: "", en: "" };
      const w = worksById.get(workId);
      if (!w) return { ko: "", ja: "", en: "" };
      return { ko: w.name_ko || "", ja: w.name_ja || "", en: w.name_en || "" };
    };

    for (const c of dataset.characters) {
      const sourceFile = c.source?.file || "data/touhou_list_v2.csv";
      const sourceLine = c.source?.line ?? null;
      const workNames = workNamesOf(c.source_work_id);
      const rawSearch = [
        c.id,
        c.name_ko,
        c.name_ja,
        c.name_en,
        workNames.ko,
        workNames.ja,
        workNames.en,
        ...c.search,
      ];
      items.push({
        kind: "character",
        id: c.id,
        name_ko: c.name_ko,
        name_ja: c.name_ja,
        name_en: c.name_en,
        source_work_id: c.source_work_id,
        source_work_name_ko: workNames.ko,
        source_work_name_ja: workNames.ja,
        source_work_name_en: workNames.en,
        source_file: sourceFile,
        source_line: sourceLine,
        csv_order: csvOrderOf(sourceLine),
        search_key: normalizeKey(rawSearch.filter(Boolean).join(" ")),
      });
    }

    for (const t of dataset.tracks) {
      const sourceFile = t.source?.file || "data/touhou_list_v2.csv";
      const sourceLine = t.source?.line ?? null;
      const workNames = workNamesOf(t.source_work_id);
      const rawSearch = [
        t.id,
        t.name_ko,
        t.name_ja,
        t.name_en,
        workNames.ko,
        workNames.ja,
        workNames.en,
        ...t.search,
      ];
      items.push({
        kind: "track",
        id: t.id,
        name_ko: t.name_ko,
        name_ja: t.name_ja,
        name_en: t.name_en,
        source_work_id: t.source_work_id,
        source_work_name_ko: workNames.ko,
        source_work_name_ja: workNames.ja,
        source_work_name_en: workNames.en,
        source_file: sourceFile,
        source_line: sourceLine,
        csv_order: csvOrderOf(sourceLine),
        search_key: normalizeKey(rawSearch.filter(Boolean).join(" ")),
      });
    }

    for (const w of dataset.works) {
      if (w.type === "music" && w.name_ko === "기타/오리지널") continue;
      const sourceFile = w.source?.file || "data/touhou_list_v2.csv";
      const sourceLine = w.source?.line ?? null;
      const rawSearch = [w.id, w.name_ko, w.name_ja, w.name_en, w.work_section_ja, ...w.search];
      items.push({
        kind: "work",
        id: w.id,
        name_ko: w.name_ko,
        name_ja: w.name_ja,
        name_en: w.name_en,
        source_work_id: null,
        source_work_name_ko: "",
        source_work_name_ja: "",
        source_work_name_en: "",
        source_file: sourceFile,
        source_line: sourceLine,
        csv_order: workCsvOrderById.get(w.id) ?? csvOrderOf(sourceLine),
        search_key: normalizeKey(rawSearch.filter(Boolean).join(" ")),
      });
    }

    const kindRank = (k: FavoriteKind) => (k === "character" ? 10 : k === "track" ? 20 : 30);
    items.sort((a, b) => {
      const kr = kindRank(a.kind) - kindRank(b.kind);
      if (kr !== 0) return kr;
      if (a.csv_order !== b.csv_order) return a.csv_order - b.csv_order;
      return a.id.localeCompare(b.id);
    });

    return items;
  }, [dataset.characters, dataset.tracks, dataset.works, worksById, workCsvOrderById]);

  const itemByKindAndId = useMemo(() => {
    const byKind: Record<FavoriteKind, Map<string, FavoriteItem>> = {
      character: new Map(),
      track: new Map(),
      work: new Map(),
    };
    for (const it of allItems) byKind[it.kind].set(it.id, it);
    return byKind;
  }, [allItems]);

  const [seasonId, setSeasonId] = useState<SeasonId>(SEASON_PRESETS[0]?.id || "spring");
  const season = useMemo(() => {
    return SEASON_PRESETS.find((s) => s.id === seasonId) || SEASON_PRESETS[0];
  }, [seasonId]);

  const viewVars = useMemo(() => {
    return {
      "--tw-bg": season.colors.bg,
      "--tw-surface": season.colors.surface,
      "--tw-ink": season.colors.ink,
      "--tw-muted": season.colors.muted,
      "--tw-border": season.colors.border,
      "--tw-accent-a": season.colors.accentA,
      "--tw-accent-b": season.colors.accentB,
      "--tw-accent-a-soft": season.colors.accentASoft,
      "--tw-accent-b-soft": season.colors.accentBSoft,
      "--tw-season-overlay-top": season.overlayTop,
      "--tw-season-overlay-bottom": season.overlayBottom,
      "--tw-png-background": season.colors.pngBackground,
    } as React.CSSProperties;
  }, [season]);

  const [activeKind, setActiveKind] = useState<FavoriteKind>("character");
  const [query, setQuery] = useState<string>("");

  const [selected, setSelected] = useState<Record<FavoriteKind, string[]>>({
    character: [],
    track: [],
    work: [],
  });

  useEffect(() => {
    // Drop selections that are no longer present in the dataset view.
    setSelected((prev) => {
      const next: Record<FavoriteKind, string[]> = {
        character: prev.character.filter((id) => itemByKindAndId.character.has(id)),
        track: prev.track.filter((id) => itemByKindAndId.track.has(id)),
        work: prev.work.filter((id) => itemByKindAndId.work.has(id)),
      };
      const same =
        next.character.length === prev.character.length &&
        next.track.length === prev.track.length &&
        next.work.length === prev.work.length;
      return same ? prev : next;
    });
  }, [itemByKindAndId]);

  const [limitMessage, setLimitMessage] = useState<string>("");

  const [portraitByCharacterId, setPortraitByCharacterId] = useState<
    Record<string, PortraitState>
  >(() => loadPortraitStorage().items);

  const [isPortraitEditorOpen, setIsPortraitEditorOpen] = useState<boolean>(false);
  const [portraitEditingCharacterId, setPortraitEditingCharacterId] = useState<string | null>(
    null
  );
  const [portraitDraftImageUrl, setPortraitDraftImageUrl] = useState<string>("");
  const [portraitDraftZoom, setPortraitDraftZoom] = useState<number>(1);
  const [portraitDraftPosX, setPortraitDraftPosX] = useState<number>(0.5);
  const [portraitDraftPosY, setPortraitDraftPosY] = useState<number>(0.2);
  const [portraitDraftComment, setPortraitDraftComment] = useState<string>("");
  const portraitDragRef = useRef<{
    startClientX: number;
    startClientY: number;
    startPosX: number;
    startPosY: number;
    maxShiftX: number;
    maxShiftY: number;
  } | null>(null);

  const portraitViewportRef = useRef<HTMLDivElement>(null);
  const portraitViewportSize = useElementSize(portraitViewportRef, isPortraitEditorOpen);

  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const previewCardRef = useRef<HTMLDivElement>(null);
  const [isPngPreparing, setIsPngPreparing] = useState<boolean>(false);
  const [pngBlobUrl, setPngBlobUrl] = useState<string>("");

  useEffect(() => {
    if (!isPreviewOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPortraitEditorOpen) setIsPreviewOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isPreviewOpen, isPortraitEditorOpen]);

  useEffect(() => {
    if (!isPortraitEditorOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsPortraitEditorOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isPortraitEditorOpen]);

  useEffect(() => {
    if (!limitMessage) return;
    const t = window.setTimeout(() => setLimitMessage(""), 2400);
    return () => window.clearTimeout(t);
  }, [limitMessage]);

  useEffect(() => {
    // If limits are tightened, trim current selections deterministically.
    const next: Record<FavoriteKind, string[]> = {
      character: selected.character.slice(0, MAX_SELECTED_BY_KIND.character),
      track: selected.track.slice(0, MAX_SELECTED_BY_KIND.track),
      work: selected.work.slice(0, MAX_SELECTED_BY_KIND.work),
    };
    const same =
      next.character.length === selected.character.length &&
      next.track.length === selected.track.length &&
      next.work.length === selected.work.length;
    if (same) return;
    setSelected(next);
  }, [selected]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const payload: PortraitStorage = {
      version: PORTRAIT_STORAGE_VERSION,
      items: portraitByCharacterId,
    };
    try {
      window.localStorage.setItem(PORTRAIT_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, [portraitByCharacterId]);

  const queryKey = normalizeKey(query);

  const activeResults = useMemo(() => {
    const base = allItems.filter((it) => it.kind === activeKind);
    const filtered =
      !queryKey
        ? base
        : base.filter((it) => it.search_key.includes(queryKey));
    return filtered;
  }, [activeKind, allItems, queryKey]);

  const toggleSelected = (kind: FavoriteKind, id: string) => {
    setSelected((prev) => {
      const current = prev[kind];
      const exists = current.includes(id);
      const limit = MAX_SELECTED_BY_KIND[kind];
      if (!exists && current.length >= limit) {
        const label = kind === "character" ? "캐릭터" : kind === "track" ? "OST" : "작품";
        setLimitMessage(`${label}는 최대 ${limit}개까지 선택할 수 있습니다.`);
        return prev;
      }
      return {
        ...prev,
        [kind]: exists ? current.filter((x) => x !== id) : [...current, id],
      };
    });
  };

  const moveSelected = (kind: FavoriteKind, index: number, delta: -1 | 1) => {
    setSelected((prev) => {
      const current = prev[kind];
      const nextIndex = index + delta;
      if (index < 0 || index >= current.length) return prev;
      if (nextIndex < 0 || nextIndex >= current.length) return prev;
      const next = [...current];
      const tmp = next[index];
      next[index] = next[nextIndex];
      next[nextIndex] = tmp;
      return { ...prev, [kind]: next };
    });
  };

  const clearKind = (kind: FavoriteKind) => {
    setSelected((prev) => ({ ...prev, [kind]: [] }));
  };

  const clearAll = () => {
    setSelected({ character: [], track: [], work: [] });
  };

  const selectedItemsByKind = useMemo(() => {
    const pick = (kind: FavoriteKind) =>
      selected[kind]
        .filter((id, idx, arr) => arr.indexOf(id) === idx)
        .map((id) => itemByKindAndId[kind].get(id) || null)
        .filter((x): x is FavoriteItem => x != null);

    return {
      character: pick("character"),
      track: pick("track"),
      work: pick("work"),
    };
  }, [itemByKindAndId, selected]);

  const rankOf = (kind: FavoriteKind, id: string): number => {
    const idx = selected[kind].indexOf(id);
    return idx >= 0 ? idx + 1 : 0;
  };

  const isRank1 = (kind: FavoriteKind, id: string): boolean => selected[kind][0] === id;

  const chipLabel = (it: FavoriteItem): string => {
    const primary = displayKoLine(it);
    const ja = displayJaLine(it, primary);
    if (it.kind === "track" || it.kind === "character") {
      const w = displayWorkLabel(
        it.source_work_name_ko,
        it.source_work_name_ja,
        it.source_work_name_en
      );
      const base = ja ? `${primary} / ${ja}` : primary;
      return w ? `${base} · ${w}` : base;
    }
    return ja ? `${primary} / ${ja}` : primary;
  };

  const topCharacter = selectedItemsByKind.character[0] || null;
  const topCharacterCandidates = topCharacter ? characterImagesIndex[topCharacter.id] || [] : [];
  const savedPortrait = topCharacter ? portraitByCharacterId[topCharacter.id] || null : null;

  const portraitEffective = useMemo(() => {
    if (!topCharacter) return null;
    const fallbackUrl = topCharacterCandidates[0]?.url || "";
    const imageUrl = savedPortrait?.imageUrl || fallbackUrl;
    if (!imageUrl) return null;
    return {
      characterId: topCharacter.id,
      imageUrl,
      zoom: savedPortrait?.zoom ?? 1,
      posX: savedPortrait?.posX ?? 0.5,
      posY: savedPortrait?.posY ?? 0.2,
      comment: savedPortrait?.comment ?? "",
    };
  }, [savedPortrait, topCharacter, topCharacterCandidates]);

  const portraitDraftResolvedUrl =
    isPortraitEditorOpen && portraitDraftImageUrl
      ? resolveStaticUrl(portraitDraftImageUrl)
      : "";
  const portraitEffectiveResolvedUrl = portraitEffective?.imageUrl
    ? resolveStaticUrl(portraitEffective.imageUrl)
    : "";

  const portraitDraftNatural = useImageNaturalSize(
    isPortraitEditorOpen ? portraitDraftResolvedUrl : null
  );
  const portraitDisplayNatural = useImageNaturalSize(
    portraitEffectiveResolvedUrl ? portraitEffectiveResolvedUrl : null
  );

  const previewPortraitViewportRef = useRef<HTMLDivElement>(null);
  const previewPortraitViewportSize = useElementSize(previewPortraitViewportRef, isPreviewOpen);

  useEffect(() => {
    return () => {
      if (pngBlobUrl) URL.revokeObjectURL(pngBlobUrl);
    };
  }, [pngBlobUrl]);

  useEffect(() => {
    if (!isPreviewOpen) {
      setIsPngPreparing(false);
      setPngBlobUrl("");
      return;
    }

    let cancelled = false;
    setIsPngPreparing(true);
    setPngBlobUrl("");

    (async () => {
      if (!previewCardRef.current) return;

      const fonts = (document as unknown as { fonts?: { ready?: Promise<unknown> } }).fonts;
      if (fonts?.ready) await fonts.ready;

      // Let layout settle and images load.
      await new Promise((r) => window.setTimeout(r, 120));
      if (!previewCardRef.current) return;
      await waitForImages(previewCardRef.current);

      const canvas = await html2canvas(previewCardRef.current, {
        scale: PNG_SCALE,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: season.colors.pngBackground,
        width: PNG_WIDTH,
        height: PNG_HEIGHT,
        scrollX: 0,
        scrollY: 0,
        windowWidth: PNG_WIDTH,
        windowHeight: PNG_HEIGHT,
        onclone: (clonedDoc) => {
          const cloneCard = clonedDoc.querySelector('[data-card-root="true"]');
          if (cloneCard instanceof HTMLElement) {
            cloneCard.setAttribute("data-exporting", "1");
          }
        },
      });

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png")
      );
      if (!blob || cancelled) return;

      const url = URL.createObjectURL(blob);
      setPngBlobUrl(url);
    })()
      .catch((e) => {
        console.error("PNG render failed", e);
      })
      .finally(() => {
        if (!cancelled) setIsPngPreparing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    isPreviewOpen,
    portraitEffective?.comment,
    portraitEffective?.imageUrl,
    portraitEffective?.posX,
    portraitEffective?.posY,
    portraitEffective?.zoom,
    seasonId,
    selected,
  ]);

  const openPortraitEditor = () => {
    if (!topCharacter) return;
    const fallbackUrl = topCharacterCandidates[0]?.url || "";
    const imageUrl = savedPortrait?.imageUrl || fallbackUrl;
    if (!imageUrl) {
      setLimitMessage("이 캐릭터는 연결된 이미지가 없습니다.");
      return;
    }

    setPortraitEditingCharacterId(topCharacter.id);
    setPortraitDraftImageUrl(imageUrl);
    setPortraitDraftZoom(savedPortrait?.zoom ?? 1);
    setPortraitDraftPosX(savedPortrait?.posX ?? 0.5);
    setPortraitDraftPosY(savedPortrait?.posY ?? 0.2);
    setPortraitDraftComment(savedPortrait?.comment ?? "");
    setIsPortraitEditorOpen(true);
  };

  const savePortraitDraft = () => {
    const id = portraitEditingCharacterId;
    if (!id) return;
    const next: PortraitState = {
      imageUrl: portraitDraftImageUrl,
      zoom: clamp(portraitDraftZoom, 1, 3),
      posX: clamp01(portraitDraftPosX),
      posY: clamp01(portraitDraftPosY),
      comment: portraitDraftComment,
      updatedAt: new Date().toISOString(),
    };
    setPortraitByCharacterId((prev) => ({ ...prev, [id]: next }));
    setIsPortraitEditorOpen(false);
  };

  const downloadJson = () => {
    const generatedAt = new Date().toISOString();
    const out: Record<string, unknown> = {
      meta: {
        title: "동방프로젝트 최애표",
        generated_at: generatedAt,
        dataset_source: dataset.meta?.source || "data/touhou_list_v2.csv",
        dataset_generated_at: dataset.meta?.generated_at || null,
      },
      settings: {
        seasonId,
      },
      portrait: portraitEffective
        ? {
            character_id: portraitEffective.characterId,
            image_url: portraitEffective.imageUrl,
            crop: {
              zoom: portraitEffective.zoom,
              pos_x: portraitEffective.posX,
              pos_y: portraitEffective.posY,
            },
            comment: portraitEffective.comment,
          }
        : null,
      selections: {
        characters: selectedItemsByKind.character.map((it) => ({
          kind: it.kind,
          rank: rankOf("character", it.id),
          id: it.id,
          name_ko: it.name_ko,
          name_ja: it.name_ja,
          name_en: it.name_en,
          source_work_id: it.source_work_id,
          source: { file: it.source_file, line: it.source_line },
        })),
        tracks: selectedItemsByKind.track.map((it) => ({
          kind: it.kind,
          rank: rankOf("track", it.id),
          id: it.id,
          name_ko: it.name_ko,
          name_ja: it.name_ja,
          name_en: it.name_en,
          source_work_id: it.source_work_id,
          source_work_name_ko: it.source_work_name_ko,
          source_work_name_ja: it.source_work_name_ja,
          source_work_name_en: it.source_work_name_en,
          source: { file: it.source_file, line: it.source_line },
        })),
        works: selectedItemsByKind.work.map((it) => ({
          kind: it.kind,
          rank: rankOf("work", it.id),
          id: it.id,
          name_ko: it.name_ko,
          name_ja: it.name_ja,
          name_en: it.name_en,
          source_work_id: it.source_work_id,
          source: { file: it.source_file, line: it.source_line },
        })),
      },
    };

    const blob = new Blob([JSON.stringify(out, null, 2) + "\n"], {
      type: "application/json;charset=utf-8",
    });
    downloadBlob(`touhou_favorites_${formatDateYYYYMMDD(new Date())}.json`, blob);
  };

  const downloadCsv = () => {
    const header = [
      "kind",
      "rank",
      "id",
      "name_ko",
      "name_ja",
      "name_en",
      "source_work_id",
      "source_work_name_ko",
      "source_work_name_ja",
      "source_work_name_en",
      "source_file",
      "source_line",
    ];

    const rows: string[][] = [];
    const pushKind = (kind: FavoriteKind) => {
      for (const it of selectedItemsByKind[kind]) {
        const rank = String(rankOf(kind, it.id) || "");
        rows.push([
          it.kind,
          rank,
          it.id,
          it.name_ko,
          it.name_ja,
          it.name_en,
          it.source_work_id || "",
          it.source_work_name_ko,
          it.source_work_name_ja,
          it.source_work_name_en,
          it.source_file,
          it.source_line == null ? "" : String(it.source_line),
        ]);
      }
    };

    pushKind("character");
    pushKind("track");
    pushKind("work");

    const csv =
      "\uFEFF" +
      [header, ...rows]
        .map((r) => r.map((v) => escapeCsvField(v)).join(","))
        .join("\n") +
      "\n";

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    downloadBlob(`touhou_favorites_${formatDateYYYYMMDD(new Date())}.csv`, blob);
  };

  const downloadPngFromPreview = () => {
    if (!pngBlobUrl) {
      setLimitMessage(isPngPreparing ? "PNG 준비중입니다..." : "PNG를 준비하지 못했습니다.");
      return;
    }

    const link = document.createElement("a");
    link.href = pngBlobUrl;
    link.download = `touhou_favorites_${formatDateYYYYMMDD(new Date())}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const counts = {
    character: selected.character.length,
    track: selected.track.length,
    work: selected.work.length,
  };

  const portraitEditingCandidates = portraitEditingCharacterId
    ? characterImagesIndex[portraitEditingCharacterId] || []
    : [];
  const portraitEditingCharacter = portraitEditingCharacterId
    ? itemByKindAndId.character.get(portraitEditingCharacterId) || null
    : null;

  const MAX_CARD_LIST = 5;

  return (
    <div
      className={styles.container}
      style={viewVars}
      data-season={seasonId}
    >
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>동방프로젝트 최애표</h2>
          <div className={styles.subtitle}>
            캐릭터 / OST / 작품 최애를 골라서 PNG + 데이터로 저장
          </div>
        </div>
      </div>

      <section className={styles.controlsSection}>
        <div className={styles.controlCard}>
          <div className={styles.controlHeading}>시즌</div>
          <div className={styles.controlDescription}>
            시즌 프리셋이 곧 최종 테마입니다. 한 가지만 선택하세요.
          </div>
          <div className={styles.seasonChips}>
            {SEASON_PRESETS.map((preset) => (
              <button
                type="button"
                key={preset.id}
                className={`${styles.seasonChip} ${
                  preset.id === seasonId ? styles.seasonChipActive : ""
                }`}
                onClick={() => setSeasonId(preset.id)}
              >
                <span
                  className={styles.seasonSwatch}
                  style={{
                    background: `linear-gradient(90deg, ${preset.overlayTop}, ${preset.overlayBottom})`,
                  }}
                />
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className={styles.layout}>
        <div className={styles.panel}>
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tab} ${
                activeKind === "character" ? styles.tabActive : ""
              }`}
              onClick={() => setActiveKind("character")}
            >
              캐릭터 <span className={styles.tabCount}>{counts.character}</span>
            </button>
            <button
              type="button"
              className={`${styles.tab} ${
                activeKind === "track" ? styles.tabActive : ""
              }`}
              onClick={() => setActiveKind("track")}
            >
              OST <span className={styles.tabCount}>{counts.track}</span>
            </button>
            <button
              type="button"
              className={`${styles.tab} ${
                activeKind === "work" ? styles.tabActive : ""
              }`}
              onClick={() => setActiveKind("work")}
            >
              작품 <span className={styles.tabCount}>{counts.work}</span>
            </button>
          </div>

          <div className={styles.searchRow}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={styles.searchInput}
              placeholder="검색 (한국어/일본어/영어)"
              type="text"
            />
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => setQuery("")}
              disabled={!query}
            >
              검색 초기화
            </button>
          </div>

          <div className={styles.resultsHeader}>
            <div className={styles.resultsMeta}>
              결과 {activeResults.length}
              {queryKey ? " (상위 250개)" : ""}
            </div>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => clearKind(activeKind)}
              disabled={selected[activeKind].length === 0}
            >
              이 탭 전체 해제
            </button>
          </div>

          {limitMessage ? <div className={styles.inlineNotice}>{limitMessage}</div> : null}

          <div className={styles.resultsList}>
            {activeResults.map((it) => {
              const checked = selected[it.kind].includes(it.id);
              const atLimit =
                !checked && selected[it.kind].length >= MAX_SELECTED_BY_KIND[it.kind];
              const primary =
                it.kind === "work" ? displayWorkKoTitle(it) : displayKoLine(it);
              const jaLine =
                it.kind === "work" ? displayWorkJaTitle(it) : displayJaLine(it, primary);
              const workLabel = displayWorkLabel(
                it.source_work_name_ko,
                it.source_work_name_ja,
                it.source_work_name_en
              );

              const secondary = jaLine;
              const tertiary =
                it.kind === "track" || it.kind === "character" ? workLabel : "";

              const rank = rankOf(it.kind, it.id);
              const crown = rank === 1;
              return (
                <label
                  key={`${it.kind}:${it.id}`}
                  className={`${styles.resultRow} ${
                    crown ? styles.resultRowStar : ""
                  } ${atLimit ? styles.resultRowDisabled : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={atLimit}
                    onChange={() => toggleSelected(it.kind, it.id)}
                    className={styles.checkbox}
                  />
                    <span className={styles.resultText}>
                      <span className={styles.resultPrimary}>
                      <span className={styles.resultPrimaryText}>{primary}</span>
                      {rank ? (
                        <span
                          className={`${styles.rankBadge} ${styles.rankBadgeList} ${
                            crown ? styles.rankBadgeStar : ""
                          }`}
                        >
                          {crown ? "👑 #1" : `#${rank}`}
                        </span>
                      ) : null}
                    </span>
                    {secondary ? (
                      <span className={styles.resultSecondary}>{secondary}</span>
                    ) : null}
                    {tertiary ? (
                      <span className={styles.resultTertiary}>{tertiary}</span>
                    ) : null}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.selectedHeader}>
            <h3 className={styles.selectedTitle}>선택됨</h3>
            <button
              type="button"
              className={styles.dangerButton}
              onClick={clearAll}
              disabled={
                selected.character.length + selected.track.length + selected.work.length ===
                0
              }
            >
              전체 초기화
            </button>
          </div>

          <div className={styles.portraitPanel}>
            <div className={styles.portraitPanelHeader}>
              <div className={styles.portraitPanelTitle}>Portrait (캐릭터 #1)</div>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={openPortraitEditor}
                disabled={!topCharacter}
              >
                편집
              </button>
            </div>
            {topCharacter ? (
              <div className={styles.portraitPanelBody}>
                <div className={styles.portraitPanelPreview}>
                  {portraitEffective ? (
                    <div className={styles.portraitThumb}>
                      <div className={styles.portraitViewportSmall}>
                        <img
                          src={portraitEffectiveResolvedUrl}
                          alt={displayKoLine(topCharacter)}
                          className={styles.portraitImg}
                          draggable={false}
                          style={(() => {
                            const vw = 84;
                            const vh = 84;
                            if (!portraitDisplayNatural.ready) return {};
                            const crop = computeCrop(
                              portraitDisplayNatural.width,
                              portraitDisplayNatural.height,
                              vw,
                              vh,
                              portraitEffective.zoom,
                              portraitEffective.posX,
                              portraitEffective.posY
                            );
                            return {
                              width: `${crop.width}px`,
                              height: `${crop.height}px`,
                              transform: `translate(${crop.translateX}px, ${crop.translateY}px)` as const,
                            };
                          })()}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className={styles.portraitThumbEmpty}>no image</div>
                  )}
                </div>
                <div className={styles.portraitPanelMeta}>
                  <div className={styles.portraitCharacterName}>{displayKoLine(topCharacter)}</div>
                  <div className={styles.portraitCommentPreview}>
                    {portraitEffective?.comment ? portraitEffective.comment : "(comment empty)"}
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.portraitPanelEmpty}>캐릭터를 먼저 1명 이상 선택하세요.</div>
            )}
          </div>

          <div className={styles.selectedSections}>
            {(
              [
                { kind: "character" as const, label: "캐릭터" },
                { kind: "track" as const, label: "OST" },
                { kind: "work" as const, label: "작품" },
              ] as const
            ).map(({ kind, label }) => (
              <div key={kind} className={styles.selectedSection}>
                <div className={styles.selectedSectionHeader}>
                  <div className={styles.selectedSectionLabel}>
                    {label}{" "}
                    <span className={styles.selectedCount}>{selected[kind].length}</span>
                    <span className={styles.selectedCountMax}>/ {MAX_SELECTED_BY_KIND[kind]}</span>
                  </div>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => clearKind(kind)}
                    disabled={selected[kind].length === 0}
                  >
                    비우기
                  </button>
                </div>
                <div className={styles.selectedList}>
                  {selectedItemsByKind[kind].length === 0 ? (
                    <div className={styles.selectedEmpty}>아직 없음</div>
                  ) : (
                    selectedItemsByKind[kind].map((it) => (
                      <div
                        key={it.id}
                        className={`${styles.selectedChip} ${
                          isRank1(kind, it.id) ? styles.selectedChipStar : ""
                        }`}
                      >
                        {(() => {
                          const rank = rankOf(kind, it.id);
                          const isTop = rank === 1;
                          const isBottom = rank === selected[kind].length;
                          return (
                            <>
                        <span
                          className={`${styles.rankBadge} ${styles.rankBadgeChip} ${
                            isTop ? styles.rankBadgeStar : ""
                          }`}
                        >
                          {isTop ? "👑 #1" : `#${rank}`}
                        </span>
                        {kind === "track" ? (
                          <div className={styles.selectedChipTextBlock}>
                            <div className={styles.selectedChipLinePrimary}>
                              {displayKoLine(it)}
                            </div>
                            {displayJaLine(it, displayKoLine(it)) ? (
                              <div className={styles.selectedChipLineSecondary}>
                                {displayJaLine(it, displayKoLine(it))}
                              </div>
                            ) : null}
                            {displayWorkPrimaryName(
                              it.source_work_name_ko,
                              it.source_work_name_ja,
                              it.source_work_name_en
                            ) ? (
                              <div className={styles.selectedChipLineMeta}>
                                {displayWorkPrimaryName(
                                  it.source_work_name_ko,
                                  it.source_work_name_ja,
                                  it.source_work_name_en
                                )}
                              </div>
                            ) : null}
                          </div>
                        ) : kind === "work" ? (
                          <div className={styles.selectedChipTextBlock}>
                            <div className={styles.selectedChipLinePrimary}>
                              {displayWorkKoTitle(it)}
                            </div>
                            {displayWorkJaTitle(it) ? (
                              <div className={styles.selectedChipLineSecondary}>
                                {displayWorkJaTitle(it)}
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <span className={styles.selectedChipTextSingle}>{chipLabel(it)}</span>
                        )}
                        <div className={styles.orderButtons} role="group" aria-label="순서 변경">
                          <button
                            type="button"
                            className={styles.orderButton}
                            onClick={() => moveSelected(kind, rank - 1, -1)}
                            disabled={isTop}
                            aria-label={`move-${kind}-${rank}-up`}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            className={styles.orderButton}
                            onClick={() => moveSelected(kind, rank - 1, 1)}
                            disabled={isBottom}
                            aria-label={`move-${kind}-${rank}-down`}
                          >
                            ↓
                          </button>
                        </div>
                        <button
                          type="button"
                          className={styles.chipRemove}
                          onClick={() => toggleSelected(kind, it.id)}
                          title="삭제"
                        >
                          ×
                        </button>
                            </>
                          );
                        })()}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.exportBar}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => setIsPreviewOpen(true)}
            >
              Preview
            </button>
            <button type="button" className={styles.secondaryButton} onClick={downloadJson}>
              JSON
            </button>
            <button type="button" className={styles.secondaryButton} onClick={downloadCsv}>
              CSV
            </button>
          </div>
        </div>
      </div>

      {isPreviewOpen ? (
        <div
          className={styles.modalOverlay}
          role="presentation"
          onMouseDown={(e) => {
            if (e.currentTarget === e.target) setIsPreviewOpen(false);
          }}
        >
          <div className={styles.modalDialog} role="dialog" aria-modal="true">
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>Preview</div>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setIsPreviewOpen(false)}
                aria-label="close-preview"
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.previewStage}>
                <div ref={previewCardRef} className={styles.card} data-card-root="true">
                  <div className={styles.cardTop}>
                    <div>
                      <div className={styles.cardTitle}>동방프로젝트 최애표</div>
                      <div className={styles.cardDate}>{formatDateYYYYMMDD(new Date())}</div>
                    </div>
                    <div className={styles.cardBadge}>Touhou / Favorites</div>
                  </div>

                  <div className={styles.cardGrid2x2}>
                    <div className={styles.cardCol}>
                      <div className={styles.cardColHeader}>
                        <div className={styles.cardColTitle}>1. Portrait</div>
                        <div className={styles.cardColCount}>
                          {selectedItemsByKind.character.length ? 1 : 0}
                        </div>
                      </div>
                      {topCharacter ? (
                        <div className={styles.cardPortraitRow}>
                          <div
                            ref={previewPortraitViewportRef}
                            className={styles.cardPortraitViewport}
                          >
                            {portraitEffective ? (
                              <img
                                src={portraitEffectiveResolvedUrl}
                                alt={displayKoLine(topCharacter)}
                                className={styles.portraitImg}
                                draggable={false}
                                style={(() => {
                                  const vw = previewPortraitViewportSize.width || 240;
                                  const vh = previewPortraitViewportSize.height || 240;
                                  if (!portraitDisplayNatural.ready) return {};
                                  const crop = computeCrop(
                                    portraitDisplayNatural.width,
                                    portraitDisplayNatural.height,
                                    vw,
                                    vh,
                                    portraitEffective.zoom,
                                    portraitEffective.posX,
                                    portraitEffective.posY
                                  );
                                  return {
                                    width: `${crop.width}px`,
                                    height: `${crop.height}px`,
                                    transform: `translate(${crop.translateX}px, ${crop.translateY}px)` as const,
                                  };
                                })()}
                              />
                            ) : (
                              <div className={styles.cardPortraitEmpty}>no image</div>
                            )}
                          </div>
                          <div className={styles.cardPortraitMeta}>
                            <div className={styles.cardPortraitName}>{displayKoLine(topCharacter)}</div>
                            <div className={styles.cardPortraitComment}>
                              {portraitEffective?.comment || "(comment empty)"}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className={styles.cardEmpty}>—</div>
                      )}
                    </div>

                    <div className={styles.cardCol}>
                      <div className={styles.cardColHeader}>
                        <div className={styles.cardColTitle}>2. 캐릭터</div>
                        <div className={styles.cardColCount}>{selectedItemsByKind.character.length}</div>
                      </div>
                      <div className={styles.cardList}>
                        {selectedItemsByKind.character.length <= 1 ? (
                          <div className={styles.cardEmpty}>—</div>
                        ) : (
                          selectedItemsByKind.character.slice(1).map((it) => {
                            const primaryKo = displayKoLine(it);
                            const ja = displayJaLine(it, primaryKo);
                            const meta = displayWorkLabel(
                              it.source_work_name_ko,
                              it.source_work_name_ja,
                              it.source_work_name_en
                            );
                            const rank = rankOf("character", it.id);
                            return (
                              <div key={it.id} className={styles.cardItem}>
                                <div className={styles.cardItemPrimary}>
                                  <span className={styles.cardRankPill}>{`#${rank}`}</span>
                                  {primaryKo}
                                </div>
                                {ja ? <div className={styles.cardItemSecondary}>{ja}</div> : null}
                                {meta ? <div className={styles.cardItemMeta}>{meta}</div> : null}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    <div className={styles.cardCol}>
                      <div className={styles.cardColHeader}>
                        <div className={styles.cardColTitle}>3. OST</div>
                        <div className={styles.cardColCount}>{selectedItemsByKind.track.length}</div>
                      </div>
                      <div className={styles.cardList}>
                        {selectedItemsByKind.track.length === 0 ? (
                          <div className={styles.cardEmpty}>—</div>
                        ) : (
                          selectedItemsByKind.track.map((it) => {
                            const primaryKo = displayKoLine(it);
                            const ja = displayJaLine(it, primaryKo);
                            const meta = displayWorkLabel(
                              it.source_work_name_ko,
                              it.source_work_name_ja,
                              it.source_work_name_en
                            );
                            const rank = rankOf("track", it.id);
                            return (
                              <div key={it.id} className={styles.cardItem}>
                                <div className={styles.cardItemPrimary}>
                                  <span className={styles.cardRankPill}>{`#${rank}`}</span>
                                  {primaryKo}
                                </div>
                                {ja ? <div className={styles.cardItemSecondary}>{ja}</div> : null}
                                {meta ? <div className={styles.cardItemMeta}>{meta}</div> : null}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    <div className={styles.cardCol}>
                      <div className={styles.cardColHeader}>
                        <div className={styles.cardColTitle}>4. 작품</div>
                        <div className={styles.cardColCount}>{selectedItemsByKind.work.length}</div>
                      </div>
                      <div className={styles.cardList}>
                        {selectedItemsByKind.work.length === 0 ? (
                          <div className={styles.cardEmpty}>—</div>
                        ) : (
                          selectedItemsByKind.work.map((it) => {
                            const primaryKo = displayWorkKoTitle(it);
                            const ja = displayWorkJaTitle(it);
                            const rank = rankOf("work", it.id);
                            return (
                              <div key={it.id} className={styles.cardItem}>
                                <div className={styles.cardItemPrimary}>
                                  <span className={styles.cardRankPill}>{`#${rank}`}</span>
                                  {primaryKo}
                                </div>
                                {ja ? <div className={styles.cardItemSecondary}>{ja}</div> : null}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={styles.cardFooter}>generated on {formatDateYYYYMMDD(new Date())}</div>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button type="button" className={styles.secondaryButton} onClick={downloadJson}>
                JSON
              </button>
              <button type="button" className={styles.secondaryButton} onClick={downloadCsv}>
                CSV
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={downloadPngFromPreview}
                disabled={!pngBlobUrl || isPngPreparing}
              >
                {isPngPreparing ? "Preparing PNG..." : "Download PNG"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isPortraitEditorOpen ? (
        <div
          className={styles.portraitOverlay}
          role="presentation"
          onMouseDown={(e) => {
            if (e.currentTarget === e.target) setIsPortraitEditorOpen(false);
          }}
        >
          <div className={styles.portraitDialog} role="dialog" aria-modal="true">
            <div className={styles.portraitHeader}>
              <div className={styles.portraitTitle}>
                Portrait 편집
                {portraitEditingCharacter ? `: ${displayKoLine(portraitEditingCharacter)}` : ""}
              </div>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setIsPortraitEditorOpen(false)}
                aria-label="close-portrait"
              >
                ×
              </button>
            </div>

            <div className={styles.portraitBody}>
              <div className={styles.portraitCropColumn}>
                <div className={styles.portraitCropLabel}>1:1 Crop</div>
                <div
                  ref={portraitViewportRef}
                  className={styles.portraitViewport}
                  onPointerDown={(e) => {
                    if (!portraitDraftNatural.ready) return;
                    const vw = portraitViewportSize.width || 280;
                    const vh = portraitViewportSize.height || 280;
                    const crop = computeCrop(
                      portraitDraftNatural.width,
                      portraitDraftNatural.height,
                      vw,
                      vh,
                      portraitDraftZoom,
                      portraitDraftPosX,
                      portraitDraftPosY
                    );
                    portraitDragRef.current = {
                      startClientX: e.clientX,
                      startClientY: e.clientY,
                      startPosX: portraitDraftPosX,
                      startPosY: portraitDraftPosY,
                      maxShiftX: crop.maxShiftX,
                      maxShiftY: crop.maxShiftY,
                    };
                    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                  }}
                  onPointerMove={(e) => {
                    const drag = portraitDragRef.current;
                    if (!drag) return;
                    const dx = e.clientX - drag.startClientX;
                    const dy = e.clientY - drag.startClientY;
                    const nextX =
                      drag.maxShiftX > 0 ? drag.startPosX - dx / drag.maxShiftX : drag.startPosX;
                    const nextY =
                      drag.maxShiftY > 0 ? drag.startPosY - dy / drag.maxShiftY : drag.startPosY;
                    setPortraitDraftPosX(clamp01(nextX));
                    setPortraitDraftPosY(clamp01(nextY));
                  }}
                  onPointerUp={() => {
                    portraitDragRef.current = null;
                  }}
                  onPointerCancel={() => {
                    portraitDragRef.current = null;
                  }}
                >
                  <img
                    src={portraitDraftResolvedUrl}
                    alt={portraitEditingCharacter ? displayKoLine(portraitEditingCharacter) : "portrait"}
                    className={styles.portraitImg}
                    draggable={false}
                    style={(() => {
                      const vw = portraitViewportSize.width || 280;
                      const vh = portraitViewportSize.height || 280;
                      if (!portraitDraftNatural.ready) return {};
                      const crop = computeCrop(
                        portraitDraftNatural.width,
                        portraitDraftNatural.height,
                        vw,
                        vh,
                        portraitDraftZoom,
                        portraitDraftPosX,
                        portraitDraftPosY
                      );
                      return {
                        width: `${crop.width}px`,
                        height: `${crop.height}px`,
                        transform: `translate(${crop.translateX}px, ${crop.translateY}px)` as const,
                      };
                    })()}
                  />
                </div>

                <label className={styles.portraitSliderLabel}>
                  Zoom
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.01}
                    value={portraitDraftZoom}
                    onChange={(e) => setPortraitDraftZoom(Number(e.target.value))}
                    className={styles.portraitSlider}
                  />
                </label>
              </div>

              <div className={styles.portraitFormColumn}>
                <label className={styles.portraitField}>
                  이미지
                  <select
                    className={styles.portraitSelect}
                    value={portraitDraftImageUrl}
                    onChange={(e) => setPortraitDraftImageUrl(e.target.value)}
                  >
                    {(() => {
                      const hasCurrent = portraitEditingCandidates.some(
                        (c) => c.url === portraitDraftImageUrl
                      );
                      const list: CharacterImageCandidate[] =
                        !hasCurrent && portraitDraftImageUrl
                          ? [{ gameId: "saved", url: portraitDraftImageUrl }, ...portraitEditingCandidates]
                          : portraitEditingCandidates;
                      return list.map((c) => (
                        <option key={c.url} value={c.url}>
                          {c.gameId} · {c.url.split("/").pop()}
                        </option>
                      ));
                    })()}
                  </select>
                </label>

                <label className={styles.portraitField}>
                  코멘트
                  <textarea
                    className={styles.portraitTextarea}
                    value={portraitDraftComment}
                    onChange={(e) => setPortraitDraftComment(e.target.value)}
                    placeholder="캐릭터 1순위 코멘트"
                    maxLength={120}
                    rows={4}
                  />
                </label>

                <div className={styles.portraitActions}>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => {
                      setPortraitDraftZoom(1);
                      setPortraitDraftPosX(0.5);
                      setPortraitDraftPosY(0.2);
                    }}
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => setIsPortraitEditorOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={savePortraitDraft}
                    disabled={!portraitDraftImageUrl}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
