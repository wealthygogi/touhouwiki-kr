import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import useBaseUrl from "@docusaurus/useBaseUrl";

// ─── Sprite list ────────────────────────────────────────────────────────────

const ALL_SPRITES = [
  "alice_margatroid", "aunn_komano", "aya_shameimaru", "benben_tsukumo",
  "byakuren_hijiri", "chen", "chimata_tenkyuu", "chimi_houjuu",
  "chiyari_tenkajin", "cirno", "clownpiece", "daiyousei", "doremy_sweet",
  "eika_ebisu", "eiki_shiki_yamaxanadu", "eirin_yagokoro", "enoko_mitsugashira",
  "eternity_larva", "ex_keine", "flandre_scarlet", "fortune_teller",
  "fujiwara_no_mokou", "hata_no_kokoro", "hatate_himekaidou",
  "hecatia_lapislazuli", "hieda_no_akyuu", "hina_kagiyama", "hisami_yomotsu",
  "hong_meiling", "ichirin_kumoi", "iku_nagae", "joon_yorigami", "junko",
  "kagerou_imaizumi", "kaguya_houraisan", "kanako_yasaka", "kasen_ibaraki",
  "keiki_haniyasushin", "keine_kamishirasawa", "kisume", "koakuma",
  "kogasa_tatara", "koishi_komeiji", "komachi_onozuka", "kosuzu_motoori",
  "kutaka_niwatari", "kyouko_kasodani", "letty_whiterock", "lily_white",
  "luna_child", "lunasa_prismriver", "lyrica_prismriver", "mai_teireida",
  "maimizou_futatsuiwa", "maribel_hearn", "marisa_kirisame",
  "mayumi_joutouguu", "medicine_melancholy", "megumu_iizunamaru",
  "merlin_prismriver", "mike_goutokuji", "minamitsu_murasa", "minoriko_aki",
  "misumaru_tamatsukuri", "miyoi_okunoda", "mizuchi_miyadeguchi",
  "momiji_inubashiri", "momoyo_himemushi", "mononobe_no_futo",
  "mystia_lorelei", "nareko_michigami", "narumi_yatadera", "nazrin",
  "nemuno_sakata", "nitori_kawashiro", "nue_houjuu", "okina_matara",
  "parsee_mizuhashi", "patchouli_knowledge", "raiko_horikawa", "ran_yakumo",
  "reimu_hakurei", "reisen", "reisen_udonge_inaba", "remilia_scarlet",
  "renko_usami", "rin_kaenbyou", "rin_satsuki", "ringo",
  "rinnosuke_morichika", "rumia", "sagume_kishin", "saki_kurokoma",
  "sakuya_izayoi", "sanae_kochiya", "sannyo_komakusa", "satono_nishida",
  "satori_komeiji", "seiga_kaku", "seija_kijin", "seiran", "sekibanki",
  "shanghai_doll", "shinmyoumaru_sukuna", "shion_yorigami", "shizuha_aki",
  "shou_toramaru", "soga_no_tojiko", "son_biten", "star_sapphire",
  "suika_ibuki", "sumireko_usami", "sunny_milk", "suwako_moriya",
  "takane_yamashiro", "tenshi_hinanawi", "tewi_inaba", "tokiko",
  "toyosatomimi_no_miko", "tsukasa_kudamaki", "ubame_chirizuka", "unzan",
  "urumi_ushizaki", "utsuho_reiuji", "wakasagihime", "watatsuki_no_toyohime",
  "watatsuki_no_yorihime", "wriggle_nightbug", "yachie_kicchou",
  "yamame_kurodani", "yatsuhashi_tsukumo", "yoshika_miyako", "youmu_konpaku",
  "yukari_yakumo", "yuugi_hoshiguma", "yuuka_kazami", "yuuma_toutetsu",
  "yuyuko_saigyouji", "zanmu_nippaku",
];

// ─── Types ──────────────────────────────────────────────────────────────────

type Difficulty = "easy" | "normal" | "hard";

interface DiffConfig {
  cols: number;
  rows: number;
  label: string;
}

const DIFF_CONFIG: Record<Difficulty, DiffConfig> = {
  easy:   { cols: 6,  rows: 4, label: "쉬움" },
  normal: { cols: 10, rows: 6, label: "보통" },
  hard:   { cols: 14, rows: 8, label: "어려움" },
};

interface Tile {
  id: number;       // unique instance id
  sprite: string;   // sprite name
  removed: boolean;
}

type Grid = (Tile | null)[][];  // [row][col], null = empty

interface PathPoint {
  r: number;
  c: number;
}

interface AnimatedPath {
  points: PathPoint[];
  id: number;
}

interface GameState {
  grid: Grid;
  rows: number;
  cols: number;
  selected: PathPoint | null;
  hintsLeft: number;
  shufflesLeft: number;
  hintPair: [PathPoint, PathPoint] | null;
  animPath: AnimatedPath | null;
  won: boolean;
  noMoves: boolean;
  elapsed: number;        // seconds
  running: boolean;
  animPathCounter: number;
}

// ─── Pure game logic ─────────────────────────────────────────────────────────

function fisherYates<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildGrid(rows: number, cols: number): Grid {
  const pairsNeeded = (rows * cols) / 2;
  const shuffled = fisherYates(ALL_SPRITES);
  const chosen = shuffled.slice(0, pairsNeeded);
  const flat = fisherYates([...chosen, ...chosen]);

  const grid: Grid = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => ({
      id: r * cols + c,
      sprite: flat[r * cols + c],
      removed: false,
    }))
  );
  return grid;
}

// Check if cell (r, c) is empty (no tile) in the extended grid.
// The "extended" grid includes -1 and rows/cols as border lanes.
function isEmpty(grid: Grid, rows: number, cols: number, r: number, c: number): boolean {
  if (r < 0 || r >= rows || c < 0 || c >= cols) return true; // border
  const t = grid[r][c];
  return t === null || t.removed;
}

// Check if a straight horizontal/vertical segment is clear (excluding endpoints).
function segmentClear(
  grid: Grid, rows: number, cols: number,
  r1: number, c1: number, r2: number, c2: number
): boolean {
  if (r1 === r2) {
    const [cMin, cMax] = c1 < c2 ? [c1, c2] : [c2, c1];
    for (let c = cMin + 1; c < cMax; c++) {
      if (!isEmpty(grid, rows, cols, r1, c)) return false;
    }
    return true;
  } else {
    const [rMin, rMax] = r1 < r2 ? [r1, r2] : [r2, r1];
    for (let r = rMin + 1; r < rMax; r++) {
      if (!isEmpty(grid, rows, cols, r, c1)) return false;
    }
    return true;
  }
}

// Find connecting path with at most 2 turns. Returns path points (corners) or null.
// The path can route through the border (r=-1, r=rows, c=-1, c=cols).
function findPath(
  grid: Grid,
  rows: number,
  cols: number,
  r1: number,
  c1: number,
  r2: number,
  c2: number
): PathPoint[] | null {
  // 0 turns: same row or col, direct clear line
  if (r1 === r2) {
    if (segmentClear(grid, rows, cols, r1, c1, r2, c2)) {
      return [{ r: r1, c: c1 }, { r: r2, c: c2 }];
    }
  } else if (c1 === c2) {
    if (segmentClear(grid, rows, cols, r1, c1, r2, c2)) {
      return [{ r: r1, c: c1 }, { r: r2, c: c2 }];
    }
  }

  // 1 turn: two possible corners
  // Corner A: (r1, c2)
  if (isEmpty(grid, rows, cols, r1, c2)) {
    if (
      segmentClear(grid, rows, cols, r1, c1, r1, c2) &&
      segmentClear(grid, rows, cols, r1, c2, r2, c2)
    ) {
      return [{ r: r1, c: c1 }, { r: r1, c: c2 }, { r: r2, c: c2 }];
    }
  }
  // Corner B: (r2, c1)
  if (isEmpty(grid, rows, cols, r2, c1)) {
    if (
      segmentClear(grid, rows, cols, r1, c1, r2, c1) &&
      segmentClear(grid, rows, cols, r2, c1, r2, c2)
    ) {
      return [{ r: r1, c: c1 }, { r: r2, c: c1 }, { r: r2, c: c2 }];
    }
  }

  // 2 turns: scan all intermediate columns (including border -1 and cols).
  // Route: (r1,c1) -> (r1,cM) -> (r2,cM) -> (r2,c2)
  for (let cM = -1; cM <= cols; cM++) {
    if (cM === c1 || cM === c2) continue;
    // The two corner cells must be empty (border cells always are)
    if (!isEmpty(grid, rows, cols, r1, cM)) continue;
    if (!isEmpty(grid, rows, cols, r2, cM)) continue;
    if (
      segmentClear(grid, rows, cols, r1, c1, r1, cM) &&
      segmentClear(grid, rows, cols, r1, cM, r2, cM) &&
      segmentClear(grid, rows, cols, r2, cM, r2, c2)
    ) {
      return [{ r: r1, c: c1 }, { r: r1, c: cM }, { r: r2, c: cM }, { r: r2, c: c2 }];
    }
  }

  // 2 turns: scan all intermediate rows (including border -1 and rows).
  // Route: (r1,c1) -> (rM,c1) -> (rM,c2) -> (r2,c2)
  for (let rM = -1; rM <= rows; rM++) {
    if (rM === r1 || rM === r2) continue;
    // The two corner cells must be empty (border cells always are)
    if (!isEmpty(grid, rows, cols, rM, c1)) continue;
    if (!isEmpty(grid, rows, cols, rM, c2)) continue;
    if (
      segmentClear(grid, rows, cols, r1, c1, rM, c1) &&
      segmentClear(grid, rows, cols, rM, c1, rM, c2) &&
      segmentClear(grid, rows, cols, rM, c2, r2, c2)
    ) {
      return [{ r: r1, c: c1 }, { r: rM, c: c1 }, { r: rM, c: c2 }, { r: r2, c: c2 }];
    }
  }

  return null;
}

function getTile(grid: Grid, r: number, c: number): Tile | null {
  return grid[r]?.[c] ?? null;
}

// Find all valid matching pairs in current grid.
function findAllPairs(
  grid: Grid,
  rows: number,
  cols: number
): [PathPoint, PathPoint][] {
  const pairs: [PathPoint, PathPoint][] = [];
  const tiles: PathPoint[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const t = grid[r][c];
      if (t && !t.removed) tiles.push({ r, c });
    }
  }

  for (let i = 0; i < tiles.length; i++) {
    for (let j = i + 1; j < tiles.length; j++) {
      const a = tiles[i];
      const b = tiles[j];
      const ta = getTile(grid, a.r, a.c)!;
      const tb = getTile(grid, b.r, b.c)!;
      if (ta.sprite === tb.sprite) {
        if (findPath(grid, rows, cols, a.r, a.c, b.r, b.c)) {
          pairs.push([a, b]);
        }
      }
    }
  }
  return pairs;
}

function countRemaining(grid: Grid, rows: number, cols: number): number {
  let count = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const t = grid[r][c];
      if (t && !t.removed) count++;
    }
  }
  return count;
}

function removeTiles(grid: Grid, a: PathPoint, b: PathPoint): Grid {
  return grid.map((row, r) =>
    row.map((tile, c) => {
      if ((r === a.r && c === a.c) || (r === b.r && c === b.c)) {
        return tile ? { ...tile, removed: true } : null;
      }
      return tile;
    })
  );
}

// Shuffle remaining tiles into random positions.
function shuffleRemaining(grid: Grid, rows: number, cols: number): Grid {
  const sprites: string[] = [];
  const positions: [number, number][] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const t = grid[r][c];
      if (t && !t.removed) {
        sprites.push(t.sprite);
        positions.push([r, c]);
      }
    }
  }

  const shuffledSprites = fisherYates(sprites);
  const newGrid: Grid = grid.map((row) => row.map((t) => t ? { ...t } : null));
  let idCounter = rows * cols; // ensure new ids

  positions.forEach(([r, c], i) => {
    newGrid[r][c] = {
      id: idCounter++,
      sprite: shuffledSprites[i],
      removed: false,
    };
  });

  return newGrid;
}

function makeInitialState(difficulty: Difficulty): GameState {
  const { cols, rows } = DIFF_CONFIG[difficulty];
  let grid = buildGrid(rows, cols);

  // Ensure at least one valid move exists
  let attempts = 0;
  while (findAllPairs(grid, rows, cols).length === 0 && attempts < 20) {
    grid = buildGrid(rows, cols);
    attempts++;
  }

  return {
    grid,
    rows,
    cols,
    selected: null,
    hintsLeft: 3,
    shufflesLeft: 3,
    hintPair: null,
    animPath: null,
    won: false,
    noMoves: false,
    elapsed: 0,
    running: true,
    animPathCounter: 0,
  };
}

// ─── Color generation ────────────────────────────────────────────────────────

function spriteHash(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function spriteColor(name: string): { bg: string; border: string } {
  const h = spriteHash(name) % 360;
  return {
    bg: `hsl(${h}, 55%, 88%)`,
    border: `hsl(${h}, 50%, 62%)`,
  };
}

// ─── Pixel grid sizes ────────────────────────────────────────────────────────

const TILE_SIZE_MAX = 48; // px max tile size
const TILE_SIZE_MIN = 32; // px min tile size
const TILE_GAP = 4;       // px gap between tiles
const SPRITE_RATIO = 0.75; // sprite takes 75% of tile size

// ─── Component ───────────────────────────────────────────────────────────────

export default function Shisensho(): React.ReactElement {
  const baseUrl = useBaseUrl("/img/dot/");

  const [screen, setScreen] = useState<"menu" | "game">("menu");
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [gs, setGs] = useState<GameState | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Measure container width for responsive tile sizing
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Start/restart game
  const startGame = useCallback((diff: Difficulty) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animTimerRef.current) clearTimeout(animTimerRef.current);
    setDifficulty(diff);
    const state = makeInitialState(diff);
    setGs(state);
    setScreen("game");
  }, []);

  // Timer effect
  useEffect(() => {
    if (!gs || !gs.running || gs.won) return;
    timerRef.current = setInterval(() => {
      setGs((prev) => prev ? { ...prev, elapsed: prev.elapsed + 1 } : prev);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gs?.running, gs?.won, screen]);

  // Clear hint after 2 seconds of inactivity
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTileClick = useCallback((r: number, c: number) => {
    setGs((prev) => {
      if (!prev || prev.won || prev.noMoves) return prev;
      const tile = prev.grid[r][c];
      if (!tile || tile.removed) return prev;

      // Clear hint
      const newState = { ...prev, hintPair: null };

      if (!newState.selected) {
        // First selection
        return { ...newState, selected: { r, c } };
      }

      const sel = newState.selected;

      if (sel.r === r && sel.c === c) {
        // Deselect
        return { ...newState, selected: null };
      }

      const selTile = newState.grid[sel.r][sel.c];
      if (!selTile || selTile.removed) {
        return { ...newState, selected: { r, c } };
      }

      // Different sprites → switch selection
      if (selTile.sprite !== tile.sprite) {
        return { ...newState, selected: { r, c } };
      }

      // Same sprite → check path
      const path = findPath(newState.grid, newState.rows, newState.cols, sel.r, sel.c, r, c);
      if (!path) {
        return { ...newState, selected: { r, c } };
      }

      // Valid match!
      const newGrid = removeTiles(newState.grid, sel, { r, c });
      const remaining = countRemaining(newGrid, newState.rows, newState.cols);
      const won = remaining === 0;
      const pairs = won ? [] : findAllPairs(newGrid, newState.rows, newState.cols);
      const noMoves = !won && pairs.length === 0;
      const animPathCounter = newState.animPathCounter + 1;

      return {
        ...newState,
        grid: newGrid,
        selected: null,
        animPath: { points: path, id: animPathCounter },
        animPathCounter,
        won,
        noMoves,
        running: !won,
      };
    });

    // Clear animPath after 600ms
    if (animTimerRef.current) clearTimeout(animTimerRef.current);
    animTimerRef.current = setTimeout(() => {
      setGs((prev) => prev ? { ...prev, animPath: null } : prev);
    }, 600);
  }, []);

  const handleHint = useCallback(() => {
    setGs((prev) => {
      if (!prev || prev.hintsLeft <= 0 || prev.won) return prev;
      const pairs = findAllPairs(prev.grid, prev.rows, prev.cols);
      if (pairs.length === 0) return prev;
      const pair = pairs[Math.floor(Math.random() * pairs.length)];
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      hintTimerRef.current = setTimeout(() => {
        setGs((p) => p ? { ...p, hintPair: null } : p);
      }, 3000);
      return { ...prev, hintPair: pair, hintsLeft: prev.hintsLeft - 1, selected: null };
    });
  }, []);

  const handleShuffle = useCallback(() => {
    setGs((prev) => {
      if (!prev || prev.shufflesLeft <= 0 || prev.won) return prev;
      let newGrid = shuffleRemaining(prev.grid, prev.rows, prev.cols);
      let attempts = 0;
      while (findAllPairs(newGrid, prev.rows, prev.cols).length === 0 && attempts < 20) {
        newGrid = shuffleRemaining(prev.grid, prev.rows, prev.cols);
        attempts++;
      }
      return {
        ...prev,
        grid: newGrid,
        shufflesLeft: prev.shufflesLeft - 1,
        selected: null,
        hintPair: null,
        noMoves: false,
        animPath: null,
      };
    });
  }, []);

  const formatTime = (secs: number): string => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ─── Styles ───────────────────────────────────────────────────────────────

  const styles = {
    wrapper: {
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
      fontFamily: "'Noto Sans KR', sans-serif",
      padding: "16px 8px",
      minHeight: "60vh",
      userSelect: "none" as const,
    },
    title: {
      fontSize: "1.6rem",
      fontWeight: 700,
      marginBottom: "8px",
      letterSpacing: "0.05em",
      color: "var(--ifm-font-color-base)",
    },
    subtitle: {
      fontSize: "0.85rem",
      color: "var(--ifm-color-emphasis-600)",
      marginBottom: "24px",
      textAlign: "center" as const,
    },
    diffRow: {
      display: "flex",
      gap: "12px",
      marginBottom: "32px",
    },
    diffBtn: (active: boolean, color: string) => ({
      padding: "10px 28px",
      borderRadius: "8px",
      border: `2px solid ${color}`,
      background: active ? color : "transparent",
      color: active ? "#fff" : color,
      fontSize: "1rem",
      fontWeight: 600,
      cursor: "pointer",
      transition: "all 0.15s",
    }),
    startBtn: {
      padding: "12px 40px",
      borderRadius: "10px",
      background: "#c0392b",
      color: "#fff",
      fontSize: "1.1rem",
      fontWeight: 700,
      border: "none",
      cursor: "pointer",
      boxShadow: "0 4px 12px rgba(192,57,43,0.4)",
    },
    // Game header
    gameHeader: {
      display: "flex",
      alignItems: "center",
      gap: "16px",
      flexWrap: "wrap" as const,
      justifyContent: "center",
      marginBottom: "12px",
      width: "100%",
    },
    stat: {
      fontSize: "0.9rem",
      color: "var(--ifm-font-color-base)",
      background: "var(--ifm-color-emphasis-100)",
      padding: "4px 12px",
      borderRadius: "6px",
    },
    btn: (disabled: boolean) => ({
      padding: "6px 16px",
      borderRadius: "6px",
      border: "1px solid var(--ifm-color-emphasis-300)",
      background: disabled ? "var(--ifm-color-emphasis-200)" : "var(--ifm-color-emphasis-100)",
      color: disabled ? "var(--ifm-color-emphasis-400)" : "var(--ifm-font-color-base)",
      fontSize: "0.85rem",
      fontWeight: 600,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
    }),
    // Grid
    gridWrapper: {
      overflowX: "auto" as const,
      maxWidth: "100%",
      position: "relative" as const,
    },
    // Credit
    credit: {
      marginTop: "20px",
      fontSize: "0.78rem",
      color: "var(--ifm-color-emphasis-500)",
    },
  };

  const DIFF_COLORS: Record<Difficulty, string> = {
    easy: "#27ae60",
    normal: "#2980b9",
    hard: "#c0392b",
  };

  // ─── Menu screen ──────────────────────────────────────────────────────────

  if (screen === "menu") {
    return (
      <div ref={containerRef} style={styles.wrapper}>
        <div style={styles.title}>시센쇼</div>
        <div style={styles.subtitle}>
          동방 캐릭터 도트로 즐기는 사천성 퍼즐<br />
          같은 캐릭터 2개를 선택해 연결하세요 (최대 2번 꺾기)
        </div>
        <div style={styles.diffRow}>
          {(["easy", "normal", "hard"] as Difficulty[]).map((d) => (
            <button
              key={d}
              style={styles.diffBtn(difficulty === d, DIFF_COLORS[d])}
              onClick={() => setDifficulty(d)}
            >
              {DIFF_CONFIG[d].label}
            </button>
          ))}
        </div>
        <div style={{ marginBottom: "12px", fontSize: "0.85rem", color: "var(--ifm-color-emphasis-600)" }}>
          {DIFF_CONFIG[difficulty].cols}열 × {DIFF_CONFIG[difficulty].rows}행 &nbsp;·&nbsp;
          {(DIFF_CONFIG[difficulty].cols * DIFF_CONFIG[difficulty].rows) / 2}쌍
        </div>
        <button style={styles.startBtn} onClick={() => startGame(difficulty)}>
          게임 시작
        </button>
        <div style={styles.credit}>도트 이미지: Majstek</div>
      </div>
    );
  }

  // ─── Game screen ──────────────────────────────────────────────────────────

  if (!gs) return <div />;

  const remaining = countRemaining(gs.grid, gs.rows, gs.cols);

  // Dynamic tile size based on container width
  const availableWidth = containerWidth > 0 ? containerWidth - 16 : 600; // 16px padding
  const maxTileFromWidth = Math.floor((availableWidth - (gs.cols - 1) * TILE_GAP) / gs.cols);
  const tileSize = Math.max(TILE_SIZE_MIN, Math.min(TILE_SIZE_MAX, maxTileFromWidth));
  const spriteSize = Math.round(tileSize * SPRITE_RATIO);

  const gap = TILE_GAP;
  const gridPxW = gs.cols * tileSize + (gs.cols - 1) * gap;
  const gridPxH = gs.rows * tileSize + (gs.rows - 1) * gap;

  // Compute pixel center for a cell (for path drawing)
  const cellCenter = (r: number, c: number) => ({
    x: c * (tileSize + gap) + tileSize / 2,
    y: r * (tileSize + gap) + tileSize / 2,
  });

  // Clamp border cells for path visualization
  const clampedCenter = (r: number, c: number) => {
    const clampedR = Math.max(0, Math.min(r, gs.rows - 1));
    const clampedC = Math.max(0, Math.min(c, gs.cols - 1));
    let { x, y } = cellCenter(clampedR, clampedC);
    if (r < 0) y = -gap;
    if (r >= gs.rows) y = gridPxH + gap;
    if (c < 0) x = -gap;
    if (c >= gs.cols) x = gridPxW + gap;
    return { x, y };
  };

  const pathToSvgPoints = (points: PathPoint[]): string => {
    return points
      .map((p) => {
        const { x, y } = clampedCenter(p.r, p.c);
        return `${x},${y}`;
      })
      .join(" ");
  };

  // Hint set for quick lookup
  const hintSet = new Set<string>();
  if (gs.hintPair) {
    const [a, b] = gs.hintPair;
    hintSet.add(`${a.r},${a.c}`);
    hintSet.add(`${b.r},${b.c}`);
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.title}>시센쇼</div>

      {/* Header */}
      <div style={styles.gameHeader}>
        <span style={styles.stat}>⏱ {formatTime(gs.elapsed)}</span>
        <span style={styles.stat}>🀄 남은 타일: {remaining}</span>
        <button
          style={styles.btn(gs.hintsLeft <= 0 || gs.won)}
          disabled={gs.hintsLeft <= 0 || gs.won}
          onClick={handleHint}
        >
          힌트 ({gs.hintsLeft})
        </button>
        <button
          style={styles.btn(gs.shufflesLeft <= 0 || gs.won)}
          disabled={gs.shufflesLeft <= 0 || gs.won}
          onClick={handleShuffle}
        >
          섞기 ({gs.shufflesLeft})
        </button>
        <button style={styles.btn(false)} onClick={() => startGame(difficulty)}>
          재시작
        </button>
        <button style={styles.btn(false)} onClick={() => setScreen("menu")}>
          메뉴
        </button>
      </div>

      {/* Grid */}
      <div style={styles.gridWrapper}>
        <div
          style={{
            position: "relative",
            width: gridPxW,
            height: gridPxH,
            flexShrink: 0,
          }}
        >
          {/* SVG path overlay */}
          {gs.animPath && (
            <svg
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: gridPxW,
                height: gridPxH,
                pointerEvents: "none",
                zIndex: 10,
                overflow: "visible",
              }}
            >
              <polyline
                points={pathToSvgPoints(gs.animPath.points)}
                fill="none"
                stroke="#FFD700"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.9}
                style={{ animation: "shisensho-fade 0.6s ease-out forwards" }}
              />
            </svg>
          )}

          {/* Tiles */}
          {gs.grid.map((row, r) =>
            row.map((tile, c) => {
              if (!tile || tile.removed) return null;
              const isSelected = gs.selected?.r === r && gs.selected?.c === c;
              const isHint = hintSet.has(`${r},${c}`);
              const x = c * (tileSize + gap);
              const y = r * (tileSize + gap);

              return (
                <div
                  key={tile.id}
                  onClick={() => handleTileClick(r, c)}
                  style={{
                    position: "absolute",
                    left: x,
                    top: y,
                    width: tileSize,
                    height: tileSize,
                    borderRadius: 6,
                    border: isSelected
                      ? "3px solid #FFD700"
                      : isHint
                      ? "3px solid #2ecc71"
                      : `2px solid ${spriteColor(tile.sprite).border}`,
                    background: isSelected
                      ? "rgba(255, 215, 0, 0.25)"
                      : isHint
                      ? "rgba(46, 204, 113, 0.2)"
                      : spriteColor(tile.sprite).bg,
                    boxShadow: isSelected
                      ? "0 0 10px 2px rgba(255,215,0,0.5)"
                      : isHint
                      ? "0 0 10px 2px rgba(46,204,113,0.4)"
                      : "0 2px 5px rgba(0,0,0,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "border 0.1s, box-shadow 0.1s",
                    zIndex: isSelected ? 2 : 1,
                    boxSizing: "border-box",
                  }}
                >
                  <img
                    src={`${baseUrl}${tile.sprite}.png`}
                    alt={tile.sprite}
                    style={{
                      width: spriteSize,
                      height: spriteSize,
                      imageRendering: "pixelated",
                      display: "block",
                      pointerEvents: "none",
                    }}
                    draggable={false}
                  />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Overlays */}
      {gs.won && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "var(--ifm-background-surface-color, #1a1a2e)",
              borderRadius: 16,
              padding: "40px 56px",
              textAlign: "center",
              boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
            }}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>🎉</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 8, color: "#FFD700" }}>
              클리어!
            </div>
            <div style={{ fontSize: "1rem", marginBottom: 24, color: "var(--ifm-font-color-base)" }}>
              클리어 시간: {formatTime(gs.elapsed)}
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                style={{ ...styles.startBtn, padding: "10px 28px" }}
                onClick={() => startGame(difficulty)}
              >
                다시 플레이
              </button>
              <button
                style={{ ...styles.startBtn, padding: "10px 28px", background: "#2980b9" }}
                onClick={() => setScreen("menu")}
              >
                메뉴로
              </button>
            </div>
          </div>
        </div>
      )}

      {gs.noMoves && !gs.won && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "var(--ifm-background-surface-color, #1a1a2e)",
              borderRadius: 16,
              padding: "36px 48px",
              textAlign: "center",
              boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: 8 }}>😵</div>
            <div style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: 8, color: "var(--ifm-font-color-base)" }}>
              가능한 수가 없습니다
            </div>
            <div style={{ fontSize: "0.9rem", marginBottom: 24, color: "var(--ifm-color-emphasis-600)" }}>
              섞기를 사용하거나 새 게임을 시작하세요
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              {gs.shufflesLeft > 0 && (
                <button
                  style={{ ...styles.startBtn, padding: "10px 24px", background: "#27ae60" }}
                  onClick={() => {
                    handleShuffle();
                  }}
                >
                  섞기 ({gs.shufflesLeft})
                </button>
              )}
              <button
                style={{ ...styles.startBtn, padding: "10px 24px" }}
                onClick={() => startGame(difficulty)}
              >
                새 게임
              </button>
              <button
                style={{ ...styles.startBtn, padding: "10px 24px", background: "#2980b9" }}
                onClick={() => setScreen("menu")}
              >
                메뉴로
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyframe for path fade */}
      <style>{`
        @keyframes shisensho-fade {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>

      <div style={styles.credit}>도트 이미지: Majstek</div>
    </div>
  );
}
