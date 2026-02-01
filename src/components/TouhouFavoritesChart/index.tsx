import React, { useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import styles from "./styles.module.css";

import RAW_DATA from "../../../data/touhou_normalized_v2.json";

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

function csvOrderOf(sourceLine: number | null): number {
  // data/touhou_list_v2.csv is 1-based line numbers.
  return typeof sourceLine === "number" && Number.isFinite(sourceLine)
    ? sourceLine
    : Number.POSITIVE_INFINITY;
}

type ThemeId =
  | "green_light"
  | "green_dark"
  | "blue_light"
  | "blue_dark"
  | "rainbow_light"
  | "rainbow_dark"
  | "custom";
type PatternId = "none" | "dots" | "grid" | "waves";
type FrameId = "soft" | "sharp";
type BadgeId = "pill" | "ribbon";

type ThemePreset = {
  id: ThemeId;
  label: string;
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

const THEME_PRESETS: ThemePreset[] = [
  {
    id: "green_light",
    label: "Green (Light)",
    bg: "#ffffff",
    surface: "#ffffff",
    ink: "#111827",
    muted: "rgba(17, 24, 39, 0.7)",
    border: "#2f6f4e",
    accentA: "#2f6f4e",
    accentB: "#2f6f4e",
    accentASoft: "rgba(47, 111, 78, 0.14)",
    accentBSoft: "rgba(47, 111, 78, 0.14)",
    pngBackground: "#ffffff",
  },
  {
    id: "green_dark",
    label: "Green (Dark)",
    bg: "#ffffff",
    surface: "#ffffff",
    ink: "#0b1220",
    muted: "rgba(11, 18, 32, 0.72)",
    border: "#184a33",
    accentA: "#184a33",
    accentB: "#184a33",
    accentASoft: "rgba(24, 74, 51, 0.14)",
    accentBSoft: "rgba(24, 74, 51, 0.14)",
    pngBackground: "#ffffff",
  },
  {
    id: "blue_light",
    label: "Blue (Light)",
    bg: "#ffffff",
    surface: "#ffffff",
    ink: "#0b1220",
    muted: "rgba(11, 18, 32, 0.7)",
    border: "#1d4ed8",
    accentA: "#1d4ed8",
    accentB: "#1d4ed8",
    accentASoft: "rgba(29, 78, 216, 0.14)",
    accentBSoft: "rgba(29, 78, 216, 0.14)",
    pngBackground: "#ffffff",
  },
  {
    id: "blue_dark",
    label: "Blue (Dark)",
    bg: "#ffffff",
    surface: "#ffffff",
    ink: "#070b14",
    muted: "rgba(7, 11, 20, 0.72)",
    border: "#1e3a8a",
    accentA: "#1e3a8a",
    accentB: "#1e3a8a",
    accentASoft: "rgba(30, 58, 138, 0.14)",
    accentBSoft: "rgba(30, 58, 138, 0.14)",
    pngBackground: "#ffffff",
  },
  {
    id: "rainbow_light",
    label: "Rainbow (Light)",
    bg: "#ffffff",
    surface: "#ffffff",
    ink: "#111827",
    muted: "rgba(17, 24, 39, 0.7)",
    border: "transparent",
    accentA: "#111827",
    accentB: "#111827",
    accentASoft: "rgba(17, 24, 39, 0.12)",
    accentBSoft: "rgba(17, 24, 39, 0.12)",
    pngBackground: "#ffffff",
  },
  {
    id: "rainbow_dark",
    label: "Rainbow (Dark)",
    bg: "#ffffff",
    surface: "#ffffff",
    ink: "#070b14",
    muted: "rgba(7, 11, 20, 0.72)",
    border: "transparent",
    accentA: "#070b14",
    accentB: "#070b14",
    accentASoft: "rgba(7, 11, 20, 0.12)",
    accentBSoft: "rgba(7, 11, 20, 0.12)",
    pngBackground: "#ffffff",
  },
  {
    id: "custom",
    label: "Custom (Hex)",
    bg: "#ffffff",
    surface: "#ffffff",
    ink: "#111827",
    muted: "rgba(17, 24, 39, 0.7)",
    border: "#111827",
    accentA: "#111827",
    accentB: "#111827",
    accentASoft: "rgba(17, 24, 39, 0.12)",
    accentBSoft: "rgba(17, 24, 39, 0.12)",
    pngBackground: "#ffffff",
  },
];

const PNG_WIDTH = 1600;
const PNG_HEIGHT = 900;
const PNG_SCALE = 3;

function parseHexColor(input: string): { hex: string; r: number; g: number; b: number } | null {
  const raw = String(input || "").trim();
  const m = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(raw);
  if (!m) return null;
  const v = m[1];
  const hex = v.length === 3
    ? `#${v[0]}${v[0]}${v[1]}${v[1]}${v[2]}${v[2]}`
    : `#${v}`;
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return { hex: hex.toUpperCase(), r, g, b };
}

function rgba({ r, g, b }: { r: number; g: number; b: number }, a: number): string {
  const alpha = Math.max(0, Math.min(1, a));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function displayKoLine(v: { name_ko: string; name_ja: string; name_en: string }): string {
  return v.name_ko || v.name_en || v.name_ja || "(unknown)";
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
  const dataset = useMemo(() => parseDataset(RAW_DATA as unknown), []);

  const worksById = useMemo(() => {
    const m = new Map<string, WorkEntity>();
    for (const w of dataset.works) m.set(w.id, w);
    return m;
  }, [dataset.works]);

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
        csv_order: csvOrderOf(sourceLine),
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
  }, [dataset.characters, dataset.tracks, dataset.works, worksById]);

  const itemByKindAndId = useMemo(() => {
    const byKind: Record<FavoriteKind, Map<string, FavoriteItem>> = {
      character: new Map(),
      track: new Map(),
      work: new Map(),
    };
    for (const it of allItems) byKind[it.kind].set(it.id, it);
    return byKind;
  }, [allItems]);

  const [themeId, setThemeId] = useState<ThemeId>("green_light");
  const [customHex, setCustomHex] = useState<string>("#2F6F4E");
  const [patternId, setPatternId] = useState<PatternId>("none");
  const [frameId, setFrameId] = useState<FrameId>("soft");
  const [badgeId, setBadgeId] = useState<BadgeId>("pill");

  const theme = useMemo(() => {
    const preset = THEME_PRESETS.find((t) => t.id === themeId) || THEME_PRESETS[0];
    if (themeId !== "custom") return preset;

    const parsed = parseHexColor(customHex);
    if (!parsed) return preset;

    return {
      ...preset,
      border: parsed.hex,
      accentA: parsed.hex,
      accentB: parsed.hex,
      accentASoft: rgba(parsed, 0.14),
      accentBSoft: rgba(parsed, 0.14),
      label: "Custom (Hex)",
    };
  }, [customHex, themeId]);

  const themeVars = useMemo(() => {
    return {
      "--tw-bg": theme.bg,
      "--tw-surface": theme.surface,
      "--tw-ink": theme.ink,
      "--tw-muted": theme.muted,
      "--tw-border": theme.border,
      "--tw-accent-a": theme.accentA,
      "--tw-accent-b": theme.accentB,
      "--tw-accent-a-soft": theme.accentASoft,
      "--tw-accent-b-soft": theme.accentBSoft,
    } as React.CSSProperties;
  }, [theme]);

  const isRainbowTheme = themeId === "rainbow_light" || themeId === "rainbow_dark";

  const [activeKind, setActiveKind] = useState<FavoriteKind>("character");
  const [query, setQuery] = useState<string>("");

  const [selected, setSelected] = useState<Record<FavoriteKind, string[]>>({
    character: [],
    track: [],
    work: [],
  });

  const cardRef = useRef<HTMLDivElement>(null);

  const queryKey = normalizeKey(query);

  const activeResults = useMemo(() => {
    const base = allItems.filter((it) => it.kind === activeKind);
    const filtered =
      !queryKey
        ? base
        : base.filter((it) => it.search_key.includes(queryKey));
    return filtered.slice(0, 250);
  }, [activeKind, allItems, queryKey]);

  const toggleSelected = (kind: FavoriteKind, id: string) => {
    setSelected((prev) => {
      const current = prev[kind];
      const exists = current.includes(id);
      return {
        ...prev,
        [kind]: exists ? current.filter((x) => x !== id) : [...current, id],
      };
    });
  };

  const clearKind = (kind: FavoriteKind) => {
    setSelected((prev) => ({ ...prev, [kind]: [] }));
  };

  const clearAll = () => {
    setSelected({ character: [], track: [], work: [] });
  };

  const selectedItemsByKind = useMemo(() => {
    const pick = (kind: FavoriteKind) => {
      const ids = selected[kind];
      if (ids.length === 0) return [] as FavoriteItem[];

      const firstId = ids[0];
      const first = itemByKindAndId[kind].get(firstId) || null;
      const restIds = ids.slice(1);

      const rest = restIds
        .filter((id, idx) => restIds.indexOf(id) === idx)
        .map((id) => itemByKindAndId[kind].get(id) || null)
        .filter((x): x is FavoriteItem => x != null)
        .sort((a, b) => {
          if (a.csv_order !== b.csv_order) return a.csv_order - b.csv_order;
          return a.id.localeCompare(b.id);
        });

      return first ? [first, ...rest] : rest;
    };

    return {
      character: pick("character"),
      track: pick("track"),
      work: pick("work"),
    };
  }, [itemByKindAndId, selected]);

  const isFirstPicked = (kind: FavoriteKind, id: string): boolean =>
    selected[kind][0] === id;

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

  const downloadJson = () => {
    const generatedAt = new Date().toISOString();
    const out = {
      meta: {
        title: "동방프로젝트 최애표",
        generated_at: generatedAt,
        dataset_source: dataset.meta?.source || "data/touhou_list_v2.csv",
        dataset_generated_at: dataset.meta?.generated_at || null,
      },
      selections: {
        characters: selectedItemsByKind.character.map((it) => ({
          kind: it.kind,
          id: it.id,
          name_ko: it.name_ko,
          name_ja: it.name_ja,
          name_en: it.name_en,
          source_work_id: it.source_work_id,
          source: { file: it.source_file, line: it.source_line },
        })),
        tracks: selectedItemsByKind.track.map((it) => ({
          kind: it.kind,
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
        rows.push([
          it.kind,
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

  const downloadPng = async () => {
    if (!cardRef.current) return;

    try {
      const fonts = (document as unknown as { fonts?: { ready?: Promise<unknown> } })
        .fonts;
      if (fonts?.ready) await fonts.ready;

      // Let layout settle.
      await new Promise((r) => window.setTimeout(r, 80));

      const captureWidth = PNG_WIDTH;
      const captureHeight = PNG_HEIGHT;

      const canvas = await html2canvas(cardRef.current, {
        scale: PNG_SCALE,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: theme.pngBackground,
        width: captureWidth,
        height: captureHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: captureWidth,
        windowHeight: captureHeight,
      });

      canvas.toBlob((blob) => {
        if (!blob) return;
        downloadBlob(
          `touhou_favorites_${formatDateYYYYMMDD(new Date())}.png`,
          blob
        );
      }, "image/png");
    } catch (e) {
      console.error("PNG export failed", e);
      alert("PNG 생성에 실패했습니다.");
    }
  };

  const counts = {
    character: selected.character.length,
    track: selected.track.length,
    work: selected.work.length,
  };

  const MAX_CARD_LIST = 5;

  return (
    <div
      className={`${styles.container} ${isRainbowTheme ? styles.rainbow : ""}`}
      style={themeVars}
    >
      <div className={`${styles.header} ${isRainbowTheme ? styles.rainbowBorder : ""}`}>
        <div>
          <h2 className={styles.title}>동방프로젝트 최애표</h2>
          <div className={styles.subtitle}>
            캐릭터 / OST / 작품 최애를 골라서 PNG + 데이터로 저장
          </div>
        </div>
        <div className={styles.headerMeta}>
          <div className={styles.metaRow}>
            <label className={styles.metaLabel}>
              테마
              <select
                className={styles.select}
                value={themeId}
                onChange={(e) => setThemeId(e.target.value as ThemeId)}
              >
                {THEME_PRESETS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {themeId === "custom" ? (
            <div className={styles.metaRow}>
              <label className={styles.metaLabel}>
                HEX
                <input
                  className={styles.colorInput}
                  value={customHex}
                  onChange={(e) => setCustomHex(e.target.value)}
                  placeholder="#2F6F4E"
                  inputMode="text"
                />
              </label>
            </div>
          ) : null}
          <div className={styles.metaRow}>
            <label className={styles.metaLabel}>
              패턴
              <select
                className={styles.select}
                value={patternId}
                onChange={(e) => setPatternId(e.target.value as PatternId)}
              >
                <option value="none">없음</option>
                <option value="dots">Dots</option>
                <option value="grid">Grid</option>
                <option value="waves">Waves</option>
              </select>
            </label>
          </div>
          <div className={styles.metaRow}>
            <label className={styles.metaLabel}>
              프레임
              <select
                className={styles.select}
                value={frameId}
                onChange={(e) => setFrameId(e.target.value as FrameId)}
              >
                <option value="soft">Soft</option>
                <option value="sharp">Sharp</option>
              </select>
            </label>
          </div>
          <div className={styles.metaRow}>
            <label className={styles.metaLabel}>
              배지
              <select
                className={styles.select}
                value={badgeId}
                onChange={(e) => setBadgeId(e.target.value as BadgeId)}
              >
                <option value="pill">Pill</option>
                <option value="ribbon">Ribbon</option>
              </select>
            </label>
          </div>
        </div>
      </div>

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

          <div className={styles.resultsList}>
            {activeResults.map((it) => {
              const checked = selected[it.kind].includes(it.id);
              const primary = displayKoLine(it);
              const jaLine = displayJaLine(it, primary);
              const workLabel = displayWorkLabel(
                it.source_work_name_ko,
                it.source_work_name_ja,
                it.source_work_name_en
              );

              const secondary = jaLine;
              const tertiary =
                it.kind === "track" || it.kind === "character" ? workLabel : "";

              const isStar = isFirstPicked(it.kind, it.id);
              return (
                <label
                  key={`${it.kind}:${it.id}`}
                  className={`${styles.resultRow} ${
                    isStar ? styles.resultRowStar : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSelected(it.kind, it.id)}
                    className={styles.checkbox}
                  />
                  <span className={styles.resultText}>
                    <span className={styles.resultPrimary}>
                      {primary}
                      {isStar ? (
                        <span className={styles.starBadge}>최애</span>
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
                    {label} <span className={styles.selectedCount}>{selected[kind].length}</span>
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
                          isFirstPicked(kind, it.id) ? styles.selectedChipStar : ""
                        }`}
                      >
                        <span className={styles.selectedChipText}>
                          {chipLabel(it)}
                        </span>
                        <button
                          type="button"
                          className={styles.chipRemove}
                          onClick={() => toggleSelected(kind, it.id)}
                          title="삭제"
                        >
                          ×
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.exportBar}>
            <button type="button" className={styles.primaryButton} onClick={downloadPng}>
              PNG 다운로드
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

      {/* Offscreen card used for PNG capture */}
      <div className={styles.offscreen}>
        <div
          ref={cardRef}
          className={`${styles.card} ${isRainbowTheme ? styles.rainbowBorder : ""} ${
            !isRainbowTheme
              ? patternId === "dots"
                ? styles.cardPatternDots
                : patternId === "grid"
                  ? styles.cardPatternGrid
                  : patternId === "waves"
                    ? styles.cardPatternWaves
                    : ""
              : ""
          } ${frameId === "sharp" ? styles.cardFrameSharp : ""}`}
        >
          <div className={styles.cardTop}>
            <div>
              <div className={styles.cardTitle}>동방프로젝트 최애표</div>
              <div className={styles.cardDate}>{formatDateYYYYMMDD(new Date())}</div>
            </div>
            <div
              className={`${styles.cardBadge} ${
                badgeId === "ribbon" ? styles.cardBadgeRibbon : ""
              }`}
            >
              Touhou / Favorites
            </div>
          </div>

          <div className={styles.cardGrid}>
            {(
              [
                { kind: "character" as const, label: "캐릭터" },
                { kind: "track" as const, label: "OST" },
                { kind: "work" as const, label: "작품" },
              ] as const
            ).map(({ kind, label }) => {
              const list = selectedItemsByKind[kind];
              const visible = list.slice(0, MAX_CARD_LIST);
              const more = Math.max(0, list.length - visible.length);

              const top = list.length > 0 ? list[0] : null;
              const rest = list.length > 1 ? list.slice(1, MAX_CARD_LIST) : [];

              return (
                <div key={kind} className={styles.cardCol}>
                  <div className={styles.cardColHeader}>
                    <div className={styles.cardColTitle}>{label}</div>
                    <div className={styles.cardColCount}>{list.length}</div>
                  </div>
                  <div className={styles.cardList}>
                    {visible.length === 0 ? (
                      <div className={styles.cardEmpty}>—</div>
                    ) : (
                      <>
                        {top ? (
                          <div className={styles.cardHero}>
                            <div className={styles.cardHeroTag}>최애</div>
                            <div className={styles.cardHeroPrimary}>
                              {displayKoLine(top)}
                            </div>
                            {displayJaLine(top, displayKoLine(top)) ? (
                              <div className={styles.cardHeroJa}>
                                {displayJaLine(top, displayKoLine(top))}
                              </div>
                            ) : null}
                            {top.kind === "track" || top.kind === "character" ? (
                              <div className={styles.cardHeroMeta}>
                                {displayWorkLabel(
                                  top.source_work_name_ko,
                                  top.source_work_name_ja,
                                  top.source_work_name_en
                                )}
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                        {rest.map((it) => {
                          const primaryKo = displayKoLine(it);
                          const ja = displayJaLine(it, primaryKo);
                          const meta =
                            it.kind === "track" || it.kind === "character"
                              ? displayWorkLabel(
                                  it.source_work_name_ko,
                                  it.source_work_name_ja,
                                  it.source_work_name_en
                                )
                              : "";
                          return (
                            <div key={it.id} className={styles.cardItem}>
                              <div className={styles.cardItemPrimary}>{primaryKo}</div>
                              {ja ? (
                                <div className={styles.cardItemSecondary}>{ja}</div>
                              ) : null}
                              {meta ? (
                                <div className={styles.cardItemMeta}>{meta}</div>
                              ) : null}
                            </div>
                          );
                        })}
                      </>
                    )}
                    {more > 0 ? (
                      <div className={styles.cardMore}>+{more} more</div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.cardFooter}>generated on {formatDateYYYYMMDD(new Date())}</div>
        </div>
      </div>
    </div>
  );
}
