import React, { useState, useEffect, useCallback, useRef } from "react";
import useBaseUrl from "@docusaurus/useBaseUrl";

// ─── Sprite list ────────────────────────────────────────────────────────────

const ALL_SPRITES = [
  "alice_margatroid",
  "aunn_komano",
  "aya_shameimaru",
  "benben_tsukumo",
  "byakuren_hijiri",
  "chen",
  "chimata_tenkyuu",
  "chimi_houjuu",
  "chiyari_tenkajin",
  "cirno",
  "clownpiece",
  "daiyousei",
  "doremy_sweet",
  "eika_ebisu",
  "eiki_shiki_yamaxanadu",
  "eirin_yagokoro",
  "enoko_mitsugashira",
  "eternity_larva",
  "ex_keine",
  "flandre_scarlet",
  "fortune_teller",
  "fujiwara_no_mokou",
  "hata_no_kokoro",
  "hatate_himekaidou",
  "hecatia_lapislazuli",
  "hieda_no_akyuu",
  "hina_kagiyama",
  "hisami_yomotsu",
  "hong_meiling",
  "ichirin_kumoi",
  "iku_nagae",
  "joon_yorigami",
  "junko",
  "kagerou_imaizumi",
  "kaguya_houraisan",
  "kanako_yasaka",
  "kasen_ibaraki",
  "keiki_haniyasushin",
  "keine_kamishirasawa",
  "kisume",
  "koakuma",
  "kogasa_tatara",
  "koishi_komeiji",
  "komachi_onozuka",
  "kosuzu_motoori",
  "kutaka_niwatari",
  "kyouko_kasodani",
  "letty_whiterock",
  "lily_white",
  "luna_child",
  "lunasa_prismriver",
  "lyrica_prismriver",
  "mai_teireida",
  "maimizou_futatsuiwa",
  "maribel_hearn",
  "marisa_kirisame",
  "mayumi_joutouguu",
  "medicine_melancholy",
  "megumu_iizunamaru",
  "merlin_prismriver",
  "mike_goutokuji",
  "minamitsu_murasa",
  "minoriko_aki",
  "misumaru_tamatsukuri",
  "miyoi_okunoda",
  "mizuchi_miyadeguchi",
  "momiji_inubashiri",
  "momoyo_himemushi",
  "mononobe_no_futo",
  "mystia_lorelei",
  "nareko_michigami",
  "narumi_yatadera",
  "nazrin",
  "nemuno_sakata",
  "nitori_kawashiro",
  "nue_houjuu",
  "okina_matara",
  "parsee_mizuhashi",
  "patchouli_knowledge",
  "raiko_horikawa",
  "ran_yakumo",
  "reimu_hakurei",
  "reisen",
  "reisen_udonge_inaba",
  "remilia_scarlet",
  "renko_usami",
  "rin_kaenbyou",
  "rin_satsuki",
  "ringo",
  "rinnosuke_morichika",
  "rumia",
  "sagume_kishin",
  "saki_kurokoma",
  "sakuya_izayoi",
  "sanae_kochiya",
  "sannyo_komakusa",
  "satono_nishida",
  "satori_komeiji",
  "seiga_kaku",
  "seija_kijin",
  "seiran",
  "sekibanki",
  "shanghai_doll",
  "shinmyoumaru_sukuna",
  "shion_yorigami",
  "shizuha_aki",
  "shou_toramaru",
  "soga_no_tojiko",
  "son_biten",
  "star_sapphire",
  "suika_ibuki",
  "sumireko_usami",
  "sunny_milk",
  "suwako_moriya",
  "takane_yamashiro",
  "tenshi_hinanawi",
  "tewi_inaba",
  "tokiko",
  "toyosatomimi_no_miko",
  "tsukasa_kudamaki",
  "ubame_chirizuka",
  "unzan",
  "urumi_ushizaki",
  "utsuho_reiuji",
  "wakasagihime",
  "watatsuki_no_toyohime",
  "watatsuki_no_yorihime",
  "wriggle_nightbug",
  "yachie_kicchou",
  "yamame_kurodani",
  "yatsuhashi_tsukumo",
  "yoshika_miyako",
  "youmu_konpaku",
  "yukari_yakumo",
  "yuugi_hoshiguma",
  "yuuka_kazami",
  "yuuma_toutetsu",
  "yuyuko_saigyouji",
  "zanmu_nippaku",
];

function spriteDisplayName(sprite: string): string {
  return sprite.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

// ─── Types ──────────────────────────────────────────────────────────────────

type Difficulty = "easy" | "normal" | "hard" | "lunatic";

interface DifficultyConfig {
  label: string;
  densityMul: number;
  speedMul: number;
}

const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: { label: "Easy", densityMul: 0.6, speedMul: 0.8 },
  normal: { label: "Normal", densityMul: 1.0, speedMul: 1.0 },
  hard: { label: "Hard", densityMul: 1.4, speedMul: 1.2 },
  lunatic: { label: "Lunatic", densityMul: 2.0, speedMul: 1.5 },
};

const BULLET_COLORS = [
  "#ff4444",
  "#4488ff",
  "#bb44ff",
  "#44ff66",
  "#ffee44",
  "#ffffff",
  "#44ffee",
];

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  brightness: number;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

interface CharacterObstacle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  sprite: string;
  size: number;
}

interface Player {
  x: number;
  y: number;
}

interface GameState {
  player: Player;
  bullets: Bullet[];
  obstacles: CharacterObstacle[];
  stars: Star[];
  elapsedMs: number;
  gameOver: boolean;
  invincibleUntil: number;
  spawnAccumulator: number;
  charSpawnAccumulator: number;
}

// ─── Audio ──────────────────────────────────────────────────────────────────

let audioCtx: AudioContext | null = null;

function ensureAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!audioCtx) {
      const AC =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      audioCtx = new AC();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

function playTone(
  freq: number,
  duration: number,
  vol = 0.3,
  type: OscillatorType = "sine",
) {
  const ctx = ensureAudioCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // ignore audio errors
  }
}

function playGameOver(soundOn: boolean) {
  if (!soundOn) return;
  playTone(400, 0.3, 0.25, "square");
  setTimeout(() => playTone(300, 0.3, 0.25, "square"), 150);
  setTimeout(() => playTone(200, 0.5, 0.2, "square"), 300);
}

function playNewBest(soundOn: boolean) {
  if (!soundOn) return;
  playTone(523, 0.15, 0.2, "square");
  setTimeout(() => playTone(659, 0.15, 0.2, "square"), 120);
  setTimeout(() => playTone(784, 0.15, 0.2, "square"), 240);
  setTimeout(() => playTone(1047, 0.3, 0.25, "square"), 360);
}

// Bullet spawn sounds — very short, quiet, varied by color
const BULLET_FREQS: Record<string, number> = {
  "#ff4444": 1200, "#4444ff": 900, "#aa44ff": 1000,
  "#44ff44": 1100, "#ffff44": 1300, "#ffffff": 1400, "#44ffff": 1050,
};

function playBulletSpawn(soundOn: boolean, color: string) {
  if (!soundOn) return;
  const freq = BULLET_FREQS[color] || 1100;
  playTone(freq, 0.05, 0.1, "sine");
}

function playCharSpawn(soundOn: boolean) {
  if (!soundOn) return;
  playTone(350, 0.08, 0.14, "triangle");
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTime(ms: number): string {
  const totalSec = ms / 1000;
  const min = Math.floor(totalSec / 60);
  const sec = Math.floor(totalSec % 60);
  const centis = Math.floor((ms % 1000) / 10);
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}.${String(centis).padStart(2, "0")}`;
}

function bestTimeKey(diff: Difficulty): string {
  return `danmaku-dodge-best-${diff}`;
}

function loadBestTime(diff: Difficulty): number {
  if (typeof window === "undefined") return 0;
  const val = localStorage.getItem(bestTimeKey(diff));
  return val ? parseFloat(val) : 0;
}

function saveBestTime(diff: Difficulty, ms: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(bestTimeKey(diff), String(ms));
}

function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function DanmakuDodge(): React.ReactElement {
  const baseUrl = useBaseUrl("/img/dot/");
  const [phase, setPhase] = useState<"menu" | "loading" | "playing">("menu");
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [playerSprite, setPlayerSprite] = useState("reimu_hakurei");
  const [charSearch, setCharSearch] = useState("");
  const [soundOn, setSoundOn] = useState(true);
  const playerSpriteRef = useRef("reimu_hakurei");

  // Sync ref when playerSprite changes
  useEffect(() => {
    playerSpriteRef.current = playerSprite;
  }, [playerSprite]);
  const [bestTimes, setBestTimes] = useState<Record<Difficulty, number>>({
    easy: 0,
    normal: 0,
    hard: 0,
    lunatic: 0,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gameStateRef = useRef<GameState | null>(null);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const imagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const soundOnRef = useRef(soundOn);
  const difficultyRef = useRef(difficulty);
  const canvasSizeRef = useRef({ w: 480, h: 640 });

  soundOnRef.current = soundOn;
  difficultyRef.current = difficulty;

  // Load best times on mount
  useEffect(() => {
    setBestTimes({
      easy: loadBestTime("easy"),
      normal: loadBestTime("normal"),
      hard: loadBestTime("hard"),
      lunatic: loadBestTime("lunatic"),
    });
  }, []);

  // ─── Image preloading ──────────────────────────────────────────────────

  const preloadImages = useCallback((): Promise<void> => {
    const sprites = [...ALL_SPRITES];
    const loaded = imagesRef.current;
    let remaining = 0;

    return new Promise((resolve) => {
      for (const name of sprites) {
        if (loaded.has(name)) continue;
        remaining++;
        const img = new Image();
        img.src = `${baseUrl}${name}.png`;
        img.onload = () => {
          loaded.set(name, img);
          remaining--;
          if (remaining <= 0) resolve();
        };
        img.onerror = () => {
          remaining--;
          if (remaining <= 0) resolve();
        };
      }
      if (remaining === 0) resolve();
    });
  }, [baseUrl]);

  // ─── Canvas sizing ────────────────────────────────────────────────────

  const updateCanvasSize = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const maxW = 480;
    const availW = Math.min(container.clientWidth, maxW);
    const w = Math.floor(availW);
    const h = Math.floor(w * (4 / 3));
    canvas.width = w;
    canvas.height = h;
    canvasSizeRef.current = { w, h };
  }, []);

  // ─── Star field ───────────────────────────────────────────────────────

  const createStars = useCallback((w: number, h: number): Star[] => {
    const stars: Star[] = [];
    for (let i = 0; i < 60; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: randRange(0.5, 2),
        speed: randRange(8, 25),
        brightness: randRange(0.3, 1),
      });
    }
    return stars;
  }, []);

  // ─── Game initialization ──────────────────────────────────────────────

  const initGame = useCallback(() => {
    const { w, h } = canvasSizeRef.current;
    gameStateRef.current = {
      player: { x: w / 2, y: h - 60 },
      bullets: [],
      obstacles: [],
      stars: createStars(w, h),
      elapsedMs: 0,
      gameOver: false,
      invincibleUntil: 1000,
      spawnAccumulator: 0,
      charSpawnAccumulator: 0,
    };
    lastTimeRef.current = 0;
  }, [createStars]);

  // ─── Spawning logic ───────────────────────────────────────────────────

  const spawnBullets = useCallback(
    (gs: GameState, dt: number) => {
      const diff = DIFFICULTIES[difficultyRef.current];
      const { w, h } = canvasSizeRef.current;
      const elapsed = gs.elapsedMs / 1000;
      const speedMul = diff.speedMul;
      const densityMul = diff.densityMul;

      // Base spawn rate increases with time
      let spawnRate: number; // bullets per second
      if (elapsed < 10) {
        spawnRate = 3;
      } else if (elapsed < 20) {
        spawnRate = 6;
      } else if (elapsed < 30) {
        spawnRate = 10;
      } else if (elapsed < 45) {
        spawnRate = 16;
      } else {
        const extra = Math.floor((elapsed - 45) / 15);
        spawnRate = 22 + extra * 4;
      }
      spawnRate *= densityMul;

      gs.spawnAccumulator += spawnRate * (dt / 1000);

      while (gs.spawnAccumulator >= 1) {
        gs.spawnAccumulator -= 1;

        const baseSpeed = randRange(80, 160) * speedMul;
        let bx: number, by: number, bvx: number, bvy: number;

        // Decide spawn location
        const fromSide = elapsed > 30 && Math.random() < 0.25;
        if (fromSide) {
          const left = Math.random() < 0.5;
          bx = left ? -5 : w + 5;
          by = randRange(0, h * 0.6);
          const angle = left
            ? randRange(-0.3, 0.8)
            : randRange(Math.PI - 0.8, Math.PI + 0.3);
          bvx = Math.cos(angle) * baseSpeed;
          bvy = Math.abs(Math.sin(angle)) * baseSpeed * 0.5 + 30;
        } else {
          bx = randRange(10, w - 10);
          by = -5;
          const spread = randRange(-0.4, 0.4);
          bvx = Math.sin(spread) * baseSpeed * 0.5;
          bvy = Math.cos(spread) * baseSpeed * 0.3 + baseSpeed * 0.5;
        }

        // Aimed bullets
        const aimedChance =
          elapsed < 10 ? 0 : elapsed < 20 ? 0.15 : elapsed < 45 ? 0.25 : 0.35;
        if (Math.random() < aimedChance) {
          const dx = gs.player.x - bx;
          const dy = gs.player.y - by;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const aimSpeed = baseSpeed * 0.8;
          bvx = (dx / dist) * aimSpeed;
          bvy = (dy / dist) * aimSpeed;
        }

        const bulletColor = pickRandom(BULLET_COLORS);
        gs.bullets.push({
          x: bx,
          y: by,
          vx: bvx,
          vy: bvy,
          radius: randRange(3, 5),
          color: bulletColor,
        });
        playBulletSpawn(soundOnRef.current, bulletColor);
      }

      // Character obstacles
      if (elapsed > 20) {
        let charRate: number;
        if (elapsed < 30) {
          charRate = 0.3;
        } else if (elapsed < 45) {
          charRate = 0.6;
        } else {
          charRate = 1.0 + Math.floor((elapsed - 45) / 15) * 0.3;
        }
        charRate *= densityMul;

        gs.charSpawnAccumulator += charRate * (dt / 1000);
        while (gs.charSpawnAccumulator >= 1) {
          gs.charSpawnAccumulator -= 1;
          const ox = randRange(20, w - 20);
          const oy = -20;
          const ovx = randRange(-20, 20) * speedMul;
          const ovy = randRange(40, 80) * speedMul;
          gs.obstacles.push({
            x: ox,
            y: oy,
            vx: ovx,
            vy: ovy,
            sprite: pickRandom(ALL_SPRITES.filter((s) => s !== playerSpriteRef.current)),
            size: 32, // 2x scale
          });
          playCharSpawn(soundOnRef.current);
        }
      }
    },
    [],
  );

  // ─── Update logic ─────────────────────────────────────────────────────

  const updateGame = useCallback(
    (gs: GameState, dt: number) => {
      if (gs.gameOver) return;

      const { w, h } = canvasSizeRef.current;
      gs.elapsedMs += dt;

      // Stars
      for (const star of gs.stars) {
        star.y += star.speed * (dt / 1000);
        if (star.y > h) {
          star.y = 0;
          star.x = Math.random() * w;
        }
      }

      // Spawn
      spawnBullets(gs, dt);

      // Move bullets
      for (const b of gs.bullets) {
        b.x += b.vx * (dt / 1000);
        b.y += b.vy * (dt / 1000);
      }

      // Move obstacles
      for (const o of gs.obstacles) {
        o.x += o.vx * (dt / 1000);
        o.y += o.vy * (dt / 1000);
      }

      // Remove off-screen
      const margin = 50;
      gs.bullets = gs.bullets.filter(
        (b) => b.x > -margin && b.x < w + margin && b.y > -margin && b.y < h + margin,
      );
      gs.obstacles = gs.obstacles.filter(
        (o) => o.x > -margin && o.x < w + margin && o.y > -margin && o.y < h + margin,
      );

      // Collision (skip if invincible)
      if (gs.elapsedMs > gs.invincibleUntil) {
        const px = gs.player.x;
        const py = gs.player.y;
        const playerR = 4;

        for (const b of gs.bullets) {
          const dx = px - b.x;
          const dy = py - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < playerR + b.radius) {
            gs.gameOver = true;
            gameOverTouchLockRef.current = true;
            handleGameOver(gs);
            return;
          }
        }

        for (const o of gs.obstacles) {
          const dx = px - o.x;
          const dy = py - o.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < playerR + 12) {
            gs.gameOver = true;
            gameOverTouchLockRef.current = true;
            handleGameOver(gs);
            return;
          }
        }
      }
    },
    [spawnBullets],
  );

  const handleGameOver = useCallback(
    (gs: GameState) => {
      const diff = difficultyRef.current;
      const prev = loadBestTime(diff);
      const isNew = gs.elapsedMs > prev;
      if (isNew) {
        saveBestTime(diff, gs.elapsedMs);
        setBestTimes((bt) => ({ ...bt, [diff]: gs.elapsedMs }));
        playNewBest(soundOnRef.current);
      } else {
        playGameOver(soundOnRef.current);
      }
    },
    [],
  );

  // ─── Rendering ────────────────────────────────────────────────────────

  const render = useCallback(
    (ctx: CanvasRenderingContext2D, gs: GameState) => {
      const { w, h } = canvasSizeRef.current;
      const images = imagesRef.current;

      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#0a0a20");
      grad.addColorStop(0.5, "#12082e");
      grad.addColorStop(1, "#1a0a3a");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Stars
      for (const star of gs.stars) {
        ctx.globalAlpha = star.brightness * (0.6 + 0.4 * Math.sin(gs.elapsedMs / 800 + star.x));
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Bullets
      for (const b of gs.bullets) {
        // Glow
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius * 2.5, 0, Math.PI * 2);
        ctx.fill();
        // Core
        ctx.globalAlpha = 1;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        // Bright center
        ctx.fillStyle = "#ffffff";
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Character obstacles
      ctx.imageSmoothingEnabled = false;
      for (const o of gs.obstacles) {
        const img = images.get(o.sprite);
        if (img) {
          ctx.drawImage(img, o.x - o.size / 2, o.y - o.size / 2, o.size, o.size);
        }
      }

      // Player
      const invincible = gs.elapsedMs < gs.invincibleUntil;
      if (invincible) {
        // Flash effect
        ctx.globalAlpha = 0.4 + 0.4 * Math.sin(gs.elapsedMs / 60);
      }
      const playerImg = images.get(playerSpriteRef.current);
      const playerSize = 48; // 3x scale
      if (playerImg) {
        ctx.drawImage(
          playerImg,
          gs.player.x - playerSize / 2,
          gs.player.y - playerSize / 2,
          playerSize,
          playerSize,
        );
      }
      ctx.globalAlpha = 1;

      // Hitbox dot (pulsing)
      const hitboxPulse = 3 + Math.sin(gs.elapsedMs / 200) * 1.5;
      ctx.fillStyle = "#ff4444";
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(gs.player.x, gs.player.y, hitboxPulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // UI - Time
      ctx.font = "bold 16px monospace";
      ctx.textBaseline = "top";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "left";
      ctx.fillText(formatTime(gs.elapsedMs), 8, 8);

      // UI - Best time
      const diff = difficultyRef.current;
      const best = loadBestTime(diff);
      if (best > 0) {
        ctx.textAlign = "right";
        ctx.fillStyle = "#ffdd44";
        ctx.fillText(`BEST ${formatTime(best)}`, w - 8, 8);
      }

      // Game over overlay
      if (gs.gameOver) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
        ctx.fillRect(0, 0, w, h);

        const cx = w / 2;
        const cy = h / 2;

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // GAME OVER
        ctx.font = "bold 32px monospace";
        ctx.fillStyle = "#ff4444";
        ctx.fillText("GAME OVER", cx, cy - 50);

        // Time
        ctx.font = "bold 20px monospace";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(formatTime(gs.elapsedMs), cx, cy);

        // Best time
        const currentBest = loadBestTime(diff);
        const isNew = gs.elapsedMs >= currentBest && currentBest > 0;
        if (isNew && gs.elapsedMs === currentBest) {
          ctx.fillStyle = "#ffdd44";
          ctx.font = "bold 16px monospace";
          ctx.fillText("NEW BEST!", cx, cy + 30);
        } else if (currentBest > 0) {
          ctx.fillStyle = "#aaaaaa";
          ctx.font = "14px monospace";
          ctx.fillText(`BEST: ${formatTime(currentBest)}`, cx, cy + 30);
        }

        // Restart hint
        ctx.font = "16px sans-serif";
        ctx.fillStyle = "#cccccc";
        ctx.fillText("탭하여 재시작", cx, cy + 70);
      }
    },
    [],
  );

  // ─── Game loop ────────────────────────────────────────────────────────

  const gameLoop = useCallback(
    (timestamp: number) => {
      const canvas = canvasRef.current;
      const gs = gameStateRef.current;
      if (!canvas || !gs) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
      }

      let dt = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // Cap dt to prevent spiral of death
      if (dt > 100) dt = 100;

      if (!gs.gameOver) {
        updateGame(gs, dt);
      }
      render(ctx, gs);

      animFrameRef.current = requestAnimationFrame(gameLoop);
    },
    [updateGame, render],
  );

  // ─── Input handlers ───────────────────────────────────────────────────

  // Track touch offset so lifting and re-touching doesn't teleport
  const touchOffsetRef = useRef<{ dx: number; dy: number } | null>(null);
  // Prevent instant restart on game over by requiring finger lift first
  const gameOverTouchLockRef = useRef(false);

  const handlePointerMove = useCallback(
    (clientX: number, clientY: number, isStart: boolean) => {
      const canvas = canvasRef.current;
      const gs = gameStateRef.current;
      if (!canvas || !gs || gs.gameOver) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const canvasX = (clientX - rect.left) * scaleX;
      const canvasY = (clientY - rect.top) * scaleY - 40;

      if (isStart) {
        // On new touch, calculate offset from current player position
        touchOffsetRef.current = {
          dx: gs.player.x - canvasX,
          dy: gs.player.y - canvasY,
        };
        return; // Don't move on touch start, just record offset
      }

      // Apply offset for relative movement
      const off = touchOffsetRef.current || { dx: 0, dy: 0 };
      let px = canvasX + off.dx;
      let py = canvasY + off.dy;

      const margin = 24;
      px = Math.max(margin, Math.min(canvas.width - margin, px));
      py = Math.max(margin, Math.min(canvas.height - margin, py));

      gs.player.x = px;
      gs.player.y = py;
    },
    [],
  );

  const handleRestart = useCallback(() => {
    initGame();
    lastTimeRef.current = 0;
    touchOffsetRef.current = null;
    gameOverTouchLockRef.current = false;
  }, [initGame]);

  const handleCanvasInteraction = useCallback(
    (_e: React.MouseEvent | React.TouchEvent) => {
      const gs = gameStateRef.current;
      if (gs && gs.gameOver && !gameOverTouchLockRef.current) {
        handleRestart();
      }
    },
    [handleRestart],
  );

  // ─── Start game ───────────────────────────────────────────────────────

  const startGame = useCallback(async () => {
    setPhase("loading");
    // Init audio context on user gesture
    ensureAudioCtx();
    await preloadImages();
    setPhase("playing");
  }, [preloadImages]);

  // ─── Setup canvas + game loop when playing ────────────────────────────

  useEffect(() => {
    if (phase !== "playing") return;

    updateCanvasSize();
    initGame();

    const onResize = () => {
      updateCanvasSize();
      // Reclamp player
      const gs = gameStateRef.current;
      if (gs) {
        gs.player.x = Math.min(gs.player.x, canvasSizeRef.current.w - 24);
        gs.player.y = Math.min(gs.player.y, canvasSizeRef.current.h - 24);
      }
    };
    window.addEventListener("resize", onResize);

    animFrameRef.current = requestAnimationFrame(gameLoop);

    // Input events
    const canvas = canvasRef.current;
    const onMouseMove = (e: MouseEvent) => {
      handlePointerMove(e.clientX, e.clientY, false);
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY, false);
      }
    };
    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      // If game over, ignore touch start (require lift then tap via onClick/onTouchEnd)
      const gs = gameStateRef.current;
      if (gs && gs.gameOver) {
        gameOverTouchLockRef.current = true;
        return;
      }
      if (e.touches.length > 0) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY, true);
      }
    };
    const onTouchEnd = () => {
      touchOffsetRef.current = null;
      // Unlock restart after finger lift, with delay to prevent immediate restart
      if (gameOverTouchLockRef.current) {
        setTimeout(() => {
          gameOverTouchLockRef.current = false;
        }, 300);
      }
    };

    canvas?.addEventListener("mousemove", onMouseMove);
    canvas?.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas?.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas?.addEventListener("touchend", onTouchEnd);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", onResize);
      canvas?.removeEventListener("mousemove", onMouseMove);
      canvas?.removeEventListener("touchmove", onTouchMove);
      canvas?.removeEventListener("touchstart", onTouchStart);
      canvas?.removeEventListener("touchend", onTouchEnd);
    };
  }, [phase, gameLoop, initGame, updateCanvasSize, handlePointerMove]);

  // ─── Menu screen ──────────────────────────────────────────────────────

  if (phase === "menu" || phase === "loading") {
    return (
      <div style={styles.menuContainer}>
        <h1 style={styles.title}>탄막 피하기</h1>
        <p style={styles.subtitle}>
          동방 캐릭터 도트로 즐기는 탄막 피하기 게임
        </p>

        <div style={styles.instructions}>
          <p style={{ margin: "4px 0" }}>마우스 또는 터치로 캐릭터를 조작하세요.</p>
          <p style={{ margin: "4px 0" }}>탄막과 캐릭터를 피해 최대한 오래 생존하세요!</p>
          <p style={{ margin: "4px 0", fontSize: "12px", color: "#aaa" }}>
            판정은 캐릭터 중앙의 작은 점입니다.
          </p>
        </div>

        {/* Character selector */}
        <div style={{ marginBottom: "16px", width: "100%", maxWidth: "360px" }}>
          <p style={{ margin: "0 0 8px 0", fontWeight: "bold", color: "#eee", textAlign: "center" }}>
            캐릭터 선택
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <img
              src={`${baseUrl}${playerSprite}.png`}
              alt={playerSprite}
              style={{ width: 48, height: 48, imageRendering: "pixelated" }}
            />
            <span style={{ color: "#ffdd44", fontSize: "14px", fontWeight: 600 }}>
              {spriteDisplayName(playerSprite)}
            </span>
          </div>
          <input
            type="text"
            placeholder="캐릭터 검색..."
            value={charSearch}
            onChange={(e) => setCharSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #555",
              background: "#1a1a2e",
              color: "#eee",
              fontSize: "14px",
              boxSizing: "border-box",
              marginBottom: "8px",
            }}
          />
          <div
            style={{
              maxHeight: "120px",
              overflowY: "auto",
              display: "flex",
              flexWrap: "wrap",
              gap: "4px",
              justifyContent: "center",
            }}
          >
            {ALL_SPRITES
              .filter((s) => !charSearch || spriteDisplayName(s).toLowerCase().includes(charSearch.toLowerCase()) || s.includes(charSearch.toLowerCase()))
              .map((s) => (
                <div
                  key={s}
                  onClick={() => { setPlayerSprite(s); setCharSearch(""); }}
                  title={spriteDisplayName(s)}
                  style={{
                    width: 36,
                    height: 36,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "4px",
                    border: s === playerSprite ? "2px solid #ffdd44" : "2px solid transparent",
                    background: s === playerSprite ? "rgba(255,221,68,0.15)" : "rgba(255,255,255,0.05)",
                    cursor: "pointer",
                  }}
                >
                  <img
                    src={`${baseUrl}${s}.png`}
                    alt={s}
                    style={{ width: 28, height: 28, imageRendering: "pixelated" }}
                  />
                </div>
              ))}
          </div>
        </div>

        <div style={styles.difficultySection}>
          <p style={{ margin: "0 0 8px 0", fontWeight: "bold" }}>난이도</p>
          <div style={styles.difficultyRow}>
            {(Object.keys(DIFFICULTIES) as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                style={{
                  ...styles.diffBtn,
                  ...(d === difficulty ? styles.diffBtnActive : {}),
                }}
              >
                {DIFFICULTIES[d].label}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.bestTimesSection}>
          {(Object.keys(DIFFICULTIES) as Difficulty[]).map((d) => {
            const bt = bestTimes[d];
            if (bt <= 0) return null;
            return (
              <div key={d} style={styles.bestTimeRow}>
                <span style={{ color: "#aaa" }}>{DIFFICULTIES[d].label}:</span>{" "}
                <span style={{ color: "#ffdd44" }}>{formatTime(bt)}</span>
              </div>
            );
          })}
        </div>

        <button
          onClick={startGame}
          disabled={phase === "loading"}
          style={{
            ...styles.startBtn,
            ...(phase === "loading" ? { opacity: 0.6 } : {}),
          }}
        >
          {phase === "loading" ? "로딩 중..." : "게임 시작"}
        </button>

        <p style={styles.credit}>도트 이미지: Majstek</p>
      </div>
    );
  }

  // ─── Game screen ──────────────────────────────────────────────────────

  return (
    <div ref={containerRef} style={styles.gameContainer}>
      <div style={styles.canvasWrapper}>
        <canvas
          ref={canvasRef}
          style={styles.canvas}
          onClick={handleCanvasInteraction}
          onTouchEnd={handleCanvasInteraction}
        />
      </div>
      <div style={styles.controlBar}>
        <button
          onClick={() => setSoundOn((s) => !s)}
          style={styles.soundBtn}
          aria-label={soundOn ? "사운드 끄기" : "사운드 켜기"}
        >
          {soundOn ? "\uD83D\uDD0A" : "\uD83D\uDD07"}
        </button>
        <button
          onClick={() => {
            cancelAnimationFrame(animFrameRef.current);
            gameStateRef.current = null;
            setPhase("menu");
          }}
          style={styles.backBtn}
        >
          메뉴로
        </button>
      </div>
    </div>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  menuContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "32px 16px",
    maxWidth: 480,
    margin: "0 auto",
    fontFamily: "sans-serif",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    margin: "0 0 8px 0",
  },
  subtitle: {
    fontSize: 14,
    color: "#888",
    margin: "0 0 20px 0",
    textAlign: "center",
  },
  instructions: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 1.6,
  },
  difficultySection: {
    textAlign: "center",
    marginBottom: 16,
  },
  difficultyRow: {
    display: "flex",
    gap: 8,
    justifyContent: "center",
  },
  diffBtn: {
    padding: "6px 14px",
    border: "2px solid #555",
    borderRadius: 6,
    background: "transparent",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: "bold",
    color: "inherit",
  },
  diffBtnActive: {
    borderColor: "#ff4444",
    background: "rgba(255, 68, 68, 0.15)",
    color: "#ff4444",
  },
  bestTimesSection: {
    marginBottom: 20,
    fontSize: 13,
    textAlign: "center",
  },
  bestTimeRow: {
    margin: "2px 0",
  },
  startBtn: {
    padding: "12px 40px",
    fontSize: 18,
    fontWeight: "bold",
    border: "2px solid #ff4444",
    borderRadius: 8,
    background: "rgba(255, 68, 68, 0.15)",
    color: "#ff4444",
    cursor: "pointer",
    marginBottom: 20,
  },
  credit: {
    fontSize: 11,
    color: "#666",
    marginTop: 8,
  },
  gameContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    maxWidth: 480,
    margin: "0 auto",
    width: "100%",
  },
  canvasWrapper: {
    width: "100%",
    maxWidth: 480,
  },
  canvas: {
    display: "block",
    width: "100%",
    height: "auto",
    imageRendering: "pixelated",
    cursor: "none",
    touchAction: "none",
    aspectRatio: "3 / 4",
  } as React.CSSProperties,
  controlBar: {
    display: "flex",
    justifyContent: "center",
    gap: 12,
    padding: "8px 0",
  },
  soundBtn: {
    padding: "6px 12px",
    fontSize: 20,
    border: "1px solid #555",
    borderRadius: 6,
    background: "transparent",
    cursor: "pointer",
  },
  backBtn: {
    padding: "6px 16px",
    fontSize: 14,
    border: "1px solid #555",
    borderRadius: 6,
    background: "transparent",
    cursor: "pointer",
    color: "inherit",
  },
};
