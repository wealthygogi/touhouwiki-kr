// ── Crypto ──

function xorBlockDecode(
  buffer: Uint8Array,
  length: number,
  blockSize: number,
  base: number,
  add: number
): void {
  const copy = new Uint8Array(buffer);
  let left = length;
  const remainder = left % blockSize;
  if (remainder < Math.floor(blockSize / 4)) {
    left -= remainder;
  }
  if (left > 0) {
    left -= length & 1;
  }

  let p = 0;
  while (left > 0) {
    let currentBlock = blockSize;
    if (left < currentBlock) currentBlock = left;

    let tp1 = p + currentBlock - 1;
    let tp2 = p + currentBlock - 2;
    const hf1 = Math.floor((currentBlock + (currentBlock & 1)) / 2);

    for (let i = 0; i < hf1; i++, p++) {
      buffer[tp1] = (copy[p] ^ base) & 0xff;
      base = (base + add) & 0xff;
      tp1 -= 2;
    }

    const hf2 = Math.floor(currentBlock / 2);
    for (let i = 0; i < hf2; i++, p++) {
      buffer[tp2] = (copy[p] ^ base) & 0xff;
      base = (base + add) & 0xff;
      tp2 -= 2;
    }

    left -= currentBlock;
  }
}

function lzssDecompress(
  input: Uint8Array,
  outputSize: number,
  inputLength: number
): Uint8Array {
  const output = new Uint8Array(outputSize);
  const dict = new Uint8Array(0x2000);
  let dictIdx = 1;
  let inIdx = 0;
  let outIdx = 0;
  let bits = 0;
  let bitCount = 0;

  function getBit(): number {
    if (bitCount === 0) {
      if (inIdx >= inputLength) return 0;
      bits = input[inIdx++];
      bitCount = 8;
    }
    const bit = (bits >> (bitCount - 1)) & 1;
    bitCount--;
    return bit;
  }

  function getBits(n: number): number {
    let result = 0;
    for (let i = 0; i < n; i++) {
      result = (result << 1) | getBit();
    }
    return result;
  }

  while (outIdx < outputSize) {
    if (getBit() === 1) {
      const byte = getBits(8);
      output[outIdx++] = byte;
      dict[dictIdx] = byte;
      dictIdx = (dictIdx + 1) & 0x1fff;
    } else {
      const offset = getBits(13);
      if (offset === 0) break;
      const len = getBits(4) + 3;
      for (let i = 0; i < len && outIdx < outputSize; i++) {
        const byte = dict[(offset + i) & 0x1fff];
        output[outIdx++] = byte;
        dict[dictIdx] = byte;
        dictIdx = (dictIdx + 1) & 0x1fff;
      }
    }
  }

  return output;
}

function th6Decrypt(data: Uint8Array): Uint8Array {
  const result = new Uint8Array(data.length);
  let mask = data[0x0e];
  for (let i = 0; i < 0x0f; i++) {
    result[i] = data[i];
  }
  for (let i = 0x0f; i < data.length; i++) {
    result[i] = (data[i] + 0x100 - mask) & 0xff;
    mask = (mask + 0x07) & 0xff;
  }
  return result;
}

function th7Decrypt(data: Uint8Array): Uint8Array {
  const result = new Uint8Array(data.length);
  let mask = data[0x0d];
  for (let i = 0; i < 0x10; i++) {
    result[i] = data[i];
  }
  for (let i = 0x10; i < data.length; i++) {
    result[i] = (data[i] - mask) & 0xff;
    mask = (mask + 0x07) & 0xff;
  }
  return result;
}

function th8Decrypt(data: Uint8Array, length: number): Uint8Array {
  const result = new Uint8Array(data.length);
  let mask = data[0x15];
  for (let i = 0; i < 0x18; i++) {
    result[i] = data[i];
  }
  for (let i = 0x18; i < length; i++) {
    result[i] = (data[i] + 0x100 - mask) & 0xff;
    mask = (mask + 0x07) & 0xff;
  }
  return result;
}

function th7Decompress(dat: Uint8Array, repLength: number): Uint8Array {
  let v04 = 0;
  let v1c = 0;
  let v30 = 0;
  let v28 = 0;
  let v34 = 1;
  let v11 = 0x80;
  let v20 = 0;

  for (let i = 0; i < 4; i++) {
    v20 = v20 * 0x100 + dat[0x17 - i];
  }

  const v4b = new Uint8Array(0x16c80);
  const decodedata = new Uint8Array(repLength + 0x54);
  for (let i = 0; i < 0x54; i++) {
    decodedata[i] = dat[i];
  }

  let index = 0x54;
  let ii = 0x54;

  while (index < repLength) {
    let flStopDoLoop = false;
    while (index < repLength) {
      let flFirstRun = true;
      let tmpFirst = true;

      while (v30 !== 0 || tmpFirst) {
        tmpFirst = false;
        if (v11 === 0x80) {
          v04 = dat[ii];
          if (ii - 0x54 < v20) ii++;
          else v04 = 0;
          v28 += v04;
        }
        if (flFirstRun) {
          v1c = v04 & v11;
          v11 = v11 >> 1;
          if (v11 === 0) v11 = 0x80;
          if (v1c === 0) {
            flStopDoLoop = true;
            break;
          }
          v30 = 0x80;
          v1c = 0;
          flFirstRun = false;
        } else {
          if ((v11 & v04) !== 0) v1c = v1c | v30;
          v30 = v30 >> 1;
          v11 = v11 >> 1;
          if (v11 === 0) v11 = 0x80;
        }
      }
      if (flStopDoLoop) break;
      decodedata[index] = v1c;
      index++;
      v4b[v34] = v1c & 0xff;
      v34 = (v34 + 1) & 0x1fff;
    }
    if (index > repLength) break;

    v30 = 0x1000;
    v1c = 0;
    while (v30 !== 0) {
      if (v11 === 0x80) {
        v04 = dat[ii];
        if (ii - 0x54 < v20) ii++;
        else v04 = 0;
        v28 += v04;
      }
      if ((v11 & v04) !== 0) v1c = v1c | v30;
      v30 = v30 >> 1;
      v11 = v11 >> 1;
      if (v11 === 0) v11 = 0x80;
    }
    const v0c = v1c;
    if (v0c === 0) break;

    v30 = 8;
    v1c = 0;
    while (v30 !== 0) {
      if (v11 === 0x80) {
        v04 = dat[ii];
        if (ii - 0x54 < v20) ii++;
        else v04 = 0;
        v28 += v04;
      }
      if ((v11 & v04) !== 0) v1c = v1c | v30;
      v30 = v30 >> 1;
      v11 = v11 >> 1;
      if (v11 === 0) v11 = 0x80;
    }
    const v24 = v1c + 2;
    let v10 = 0;
    while (v10 <= v24 && index < repLength) {
      const v2c = v4b[(v0c + v10) & 0x1fff];
      decodedata[index] = v2c;
      index++;
      v4b[v34] = v2c & 0xff;
      v34 = (v34 + 1) & 0x1fff;
      v10++;
    }
  }

  return decodedata;
}

function th8Decompress(
  input: Uint8Array,
  outputSize: number,
  inputLength: number
): Uint8Array {
  return lzssDecompress(input, outputSize, inputLength);
}

// ── Helpers ──

function readUint32LE(buf: Uint8Array, offset: number): number {
  return (
    (buf[offset] |
      (buf[offset + 1] << 8) |
      (buf[offset + 2] << 16) |
      ((buf[offset + 3] << 24) >>> 0)) >>>
    0
  );
}

function readFloat32LE(buf: Uint8Array, offset: number): number {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  return view.getFloat32(offset, true);
}

function readString(buf: Uint8Array, offset: number, maxLen: number): string {
  let end = offset;
  while (end < offset + maxLen && buf[end] !== 0) end++;
  const bytes = buf.slice(offset, end);
  return String.fromCharCode(...bytes);
}

// ── Types ──

export interface ReplayInfo {
  game: string;
  score: number;
  character: string;
  shottype: string;
  difficulty: string;
  date: string;
  slowRate: number;
  stage: string;
  stageCount: number;
}

// ── Game definitions ──

interface NewGameDef {
  characters: string[];
  shottypes: string[];
  difficulties: string[];
  stageOffset: number;
  characterOffset: number;
  ctypeOffset: number;
  rankOffset: number;
  clearOffset: number;
  slowrateOffset: number;
  dateOffset: number;
  totalScoreOffset: number;
  scoreRate: number;
  decodeVar1: number;
  decodeVar2: number;
  decodeVar3: number;
  decodeVar4: number;
  decodeVar5: number;
  decodeVar6: number;
}

const NEW_GAME_DEFS: Record<string, NewGameDef> = {
  "10": {
    characters: ["Reimu", "Marisa"],
    shottypes: ["A", "B", "C"],
    difficulties: ["Easy", "Normal", "Hard", "Lunatic", "Extra"],
    stageOffset: 0x4c, characterOffset: 0x50, ctypeOffset: 0x54,
    rankOffset: 0x58, clearOffset: 0x5c, slowrateOffset: 0x48,
    dateOffset: 0xc, totalScoreOffset: 0x10, scoreRate: 10,
    decodeVar1: 0x400, decodeVar2: 0xaa, decodeVar3: 0xe1,
    decodeVar4: 0x80, decodeVar5: 0x3d, decodeVar6: 0x7a,
  },
  "11": {
    characters: ["Reimu", "Marisa"],
    shottypes: ["A", "B", "C"],
    difficulties: ["Easy", "Normal", "Hard", "Lunatic", "Extra"],
    stageOffset: 0x58, characterOffset: 0x5c, ctypeOffset: 0x60,
    rankOffset: 0x64, clearOffset: 0x68, slowrateOffset: 0x54,
    dateOffset: 0xc, totalScoreOffset: 0x14, scoreRate: 10,
    decodeVar1: 0x800, decodeVar2: 0xaa, decodeVar3: 0xe1,
    decodeVar4: 0x40, decodeVar5: 0x3d, decodeVar6: 0x7a,
  },
  "12": {
    characters: ["Reimu", "Marisa", "Sanae"],
    shottypes: ["A", "B"],
    difficulties: ["Easy", "Normal", "Hard", "Lunatic", "Extra"],
    stageOffset: 0x58, characterOffset: 0x5c, ctypeOffset: 0x60,
    rankOffset: 0x64, clearOffset: 0x68, slowrateOffset: 0x54,
    dateOffset: 0xc, totalScoreOffset: 0x14, scoreRate: 10,
    decodeVar1: 0x800, decodeVar2: 0x5e, decodeVar3: 0xe1,
    decodeVar4: 0x40, decodeVar5: 0x7d, decodeVar6: 0x3a,
  },
  "13": {
    characters: ["Reimu", "Marisa", "Sanae", "Youmu"],
    shottypes: [],
    difficulties: ["Easy", "Normal", "Hard", "Lunatic", "Extra", "Overdrive"],
    stageOffset: 0x58, characterOffset: 0x5c, ctypeOffset: 0x60,
    rankOffset: 0x64, clearOffset: 0x68, slowrateOffset: 0x54,
    dateOffset: 0xc, totalScoreOffset: 0x14, scoreRate: 10,
    decodeVar1: 0x400, decodeVar2: 0x5c, decodeVar3: 0xe1,
    decodeVar4: 0x100, decodeVar5: 0x7d, decodeVar6: 0x3a,
  },
  "14": {
    characters: ["Reimu", "Marisa", "Sakuya"],
    shottypes: ["A", "B"],
    difficulties: ["Easy", "Normal", "Hard", "Lunatic", "Extra"],
    stageOffset: 0x78, characterOffset: 0x7c, ctypeOffset: 0x80,
    rankOffset: 0x84, clearOffset: 0x88, slowrateOffset: 0x74,
    dateOffset: 0xc, totalScoreOffset: 0x14, scoreRate: 10,
    decodeVar1: 0x400, decodeVar2: 0x5c, decodeVar3: 0xe1,
    decodeVar4: 0x100, decodeVar5: 0x7d, decodeVar6: 0x3a,
  },
  "15": {
    characters: ["Reimu", "Marisa", "Sanae", "Reisen"],
    shottypes: [],
    difficulties: ["Easy", "Normal", "Hard", "Lunatic", "Extra"],
    stageOffset: 0x88, characterOffset: 0x8c, ctypeOffset: 0x90,
    rankOffset: 0x94, clearOffset: 0x98, slowrateOffset: 0x84,
    dateOffset: 0xc, totalScoreOffset: 0x14, scoreRate: 10,
    decodeVar1: 0x400, decodeVar2: 0x5c, decodeVar3: 0xe1,
    decodeVar4: 0x100, decodeVar5: 0x7d, decodeVar6: 0x3a,
  },
  "16": {
    characters: ["Reimu", "Cirno", "Aya", "Marisa"],
    shottypes: ["Spring", "Summer", "Autumn", "Winter", "Full"],
    difficulties: ["Easy", "Normal", "Hard", "Lunatic", "Extra"],
    stageOffset: 0x80, characterOffset: 0x84, ctypeOffset: 0x9c,
    rankOffset: 0x8c, clearOffset: 0x90, slowrateOffset: 0x7c,
    dateOffset: 0xc, totalScoreOffset: 0x14, scoreRate: 10,
    decodeVar1: 0x400, decodeVar2: 0x5c, decodeVar3: 0xe1,
    decodeVar4: 0x100, decodeVar5: 0x7d, decodeVar6: 0x3a,
  },
  "17": {
    characters: ["Reimu", "Marisa", "Youmu"],
    shottypes: ["Wolf", "Otter", "Eagle"],
    difficulties: ["Easy", "Normal", "Hard", "Lunatic", "Extra"],
    stageOffset: 0x84, characterOffset: 0x88, ctypeOffset: 0x8c,
    rankOffset: 0x90, clearOffset: 0x94, slowrateOffset: 0x80,
    dateOffset: 0x10, totalScoreOffset: 0x18, scoreRate: 10,
    decodeVar1: 0x400, decodeVar2: 0x5c, decodeVar3: 0xe1,
    decodeVar4: 0x100, decodeVar5: 0x7d, decodeVar6: 0x3a,
  },
  "18": {
    characters: ["Reimu", "Marisa", "Sakuya", "Sanae"],
    shottypes: [],
    difficulties: ["Easy", "Normal", "Hard", "Lunatic", "Extra"],
    stageOffset: 0xa8, characterOffset: 0xac, ctypeOffset: 0xb0,
    rankOffset: 0xb4, clearOffset: 0xb8, slowrateOffset: 0xa4,
    dateOffset: 0x10, totalScoreOffset: 0x18, scoreRate: 10,
    decodeVar1: 0x400, decodeVar2: 0x5c, decodeVar3: 0xe1,
    decodeVar4: 0x100, decodeVar5: 0x7d, decodeVar6: 0x3a,
  },
};

const OLD_GAME_CHARS: Record<string, string[]> = {
  "06": ["ReimuA", "ReimuB", "MarisaA", "MarisaB"],
  "07": ["ReimuA", "ReimuB", "MarisaA", "MarisaB", "SakuyaA", "SakuyaB"],
  "08": [
    "Rm&Yk", "Ms&Al", "Sk&Rr", "Ym&Yy",
    "Reimu", "Yukari", "Marisa", "Alice",
    "Sakuya", "Remilia", "Youmu", "Yuyuko",
  ],
};

const DIFFICULTIES = ["Easy", "Normal", "Hard", "Lunatic", "Extra"];

function formatClear(clearIdx: number, difficulty: string): { stage: string; stageCount: number } {
  if (clearIdx >= 8) return { stage: "All Clear", stageCount: 6 };
  if (clearIdx === 7) return { stage: "Extra Clear", stageCount: 1 };
  if (clearIdx >= 1 && clearIdx <= 6) return { stage: `Stage ${clearIdx}`, stageCount: clearIdx };
  if (difficulty === "Extra") return { stage: "Extra Clear", stageCount: 1 };
  return { stage: "Unknown", stageCount: 0 };
}

// ── Magic number detection ──

const OLD_MAGICS: Record<number, string> = {
  0x50523654: "06",
  0x50523754: "07",
  0x50523854: "08",
  0x50523954: "09",
};

const NEW_MAGICS: Record<number, string> = {
  0x72303174: "10",
  0x72313174: "11",
  0x72323174: "12",
  0x72333174: "13",
  0x72353174: "15",
  0x72363174: "16",
  0x72373174: "17",
  0x72383174: "18",
  0x72303274: "20",
};

const GAME_NAMES: Record<string, string> = {
  "06": "EoSD", "07": "PCB", "08": "IN",
  "10": "MoF", "11": "SA", "12": "UFO",
  "13": "TD", "14": "DDC", "15": "LoLK", "16": "HSiFS",
  "17": "WBaWC", "18": "UM", "20": "FW",
};

// ── Parsers ──

function parseTh6(data: Uint8Array): ReplayInfo {
  const decoded = th6Decrypt(data);
  const charIdx = decoded[0x06];
  const rankIdx = decoded[0x07];
  const charName = OLD_GAME_CHARS["06"][charIdx] ?? `Unknown(${charIdx})`;
  const rank = DIFFICULTIES[rankIdx] ?? `Unknown(${rankIdx})`;
  const slowRate = readFloat32LE(decoded, 0x2c);
  const dateStr = readString(decoded, 0x10, 8);
  const dateParts = dateStr.split("/");
  const date = dateParts.length === 3
    ? `20${dateParts[2]}/${dateParts[0]}/${dateParts[1]}`
    : dateStr;

  let score = 0;
  let stageCount = 0;
  for (let i = 0; i < 7; i++) {
    const stageOffset = readUint32LE(decoded, 0x34 + i * 4);
    if (stageOffset !== 0) {
      score = readUint32LE(decoded, stageOffset);
      stageCount++;
    }
  }

  const isExtra = rankIdx === 4;
  const stage = isExtra
    ? "Extra Clear"
    : stageCount >= 6 ? "All Clear" : `Stage ${stageCount}`;

  return {
    game: `EoSD (th6)`,
    score,
    character: charName.replace(/([A-Z])$/, ""),
    shottype: charName.match(/([A-Z])$/)?.[1] ?? "",
    difficulty: rank,
    date,
    slowRate: Math.round(slowRate * 1000) / 1000,
    stage,
    stageCount,
  };
}

function parseTh7(data: Uint8Array): ReplayInfo {
  const decrypted = th7Decrypt(data);
  const repLength = readUint32LE(decrypted, 0x18);
  const decoded = th7Decompress(decrypted, repLength);

  const charIdx = decoded[0x56];
  const rankIdx = decoded[0x57];
  const charName = OLD_GAME_CHARS["07"][charIdx] ?? `Unknown(${charIdx})`;
  const allRanks = ["Easy", "Normal", "Hard", "Lunatic", "Extra", "Phantasm"];
  const rank = allRanks[rankIdx] ?? `Unknown(${rankIdx})`;
  const slowRate = readFloat32LE(decoded, 0xcc);
  const date = readString(decoded, 0x58, 5);

  let score = 0;
  let stageCount = 0;
  const isExtra = readUint32LE(decoded, 0x34) !== 0;

  if (isExtra) {
    const start = readUint32LE(decoded, 0x34);
    score = readUint32LE(decoded, start) * 10;
    stageCount = 1;
  } else {
    for (let i = 0; i < 7; i++) {
      const off = readUint32LE(decoded, 0x1c + i * 4);
      if (off !== 0) {
        score = readUint32LE(decoded, off) * 10;
        stageCount++;
      }
    }
  }

  const stage = isExtra
    ? (rankIdx === 5 ? "Phantasm Clear" : "Extra Clear")
    : stageCount >= 6 ? "All Clear" : `Stage ${stageCount}`;

  return {
    game: `PCB (th7)`,
    score,
    character: charName.replace(/\s*[A-Z]$/, ""),
    shottype: charName.match(/([A-Z])$/)?.[1] ?? "",
    difficulty: rank,
    date,
    slowRate: Math.round(slowRate * 1000) / 1000,
    stage,
    stageCount,
  };
}

function parseTh8(data: Uint8Array): ReplayInfo {
  const length = readUint32LE(data, 0x0c);
  const decrypted = th8Decrypt(data, length);

  const rawdata = new Uint8Array(decrypted.slice(0x68));
  const dlength = readUint32LE(decrypted, 0x1c);
  const decompressed = th8Decompress(rawdata, dlength, length - 0x68);

  const decoded = new Uint8Array(dlength + 0x68);
  decoded.set(decrypted.subarray(0, 0x68), 0);
  decoded.set(decompressed, 0x68);

  const charIdx = decoded[0x6a];
  const rankIdx = decoded[0x6b];
  const charName = OLD_GAME_CHARS["08"][charIdx] ?? `Unknown(${charIdx})`;
  const rank = DIFFICULTIES[rankIdx] ?? `Unknown(${rankIdx})`;
  const slowRate = readFloat32LE(decoded, 0x118);
  const date = readString(decoded, 0x6c, 5);

  const stageDic: Record<number, string> = { 3: "4A", 4: "4B", 6: "6A", 7: "6B" };
  let routeInfo = "";
  let score = 0;
  let stageCount = 0;
  const isExtra = readUint32LE(decoded, 0x40) !== 0;

  if (isExtra) {
    const start = readUint32LE(decoded, 0x40);
    score = readUint32LE(decoded, start) * 10;
    stageCount = 1;
  } else {
    for (let i = 0; i < 9; i++) {
      const off = readUint32LE(decoded, 0x20 + i * 4);
      if (off !== 0) {
        score = readUint32LE(decoded, off) * 10;
        if (stageDic[i]) routeInfo += stageDic[i];
        stageCount++;
      }
    }
  }

  const stage = isExtra
    ? "Extra Clear"
    : stageCount >= 6
      ? `All Clear${routeInfo ? ` (${routeInfo})` : ""}`
      : `Stage ${stageCount}${routeInfo ? ` (${routeInfo})` : ""}`;

  return {
    game: `IN (th8)`,
    score,
    character: charName,
    shottype: "",
    difficulty: rank,
    date,
    slowRate: Math.round(slowRate * 1000) / 1000,
    stage,
    stageCount,
  };
}

function parseNewFormat(data: Uint8Array, gameId: string): ReplayInfo {
  const def = NEW_GAME_DEFS[gameId];
  if (!def) throw new Error(`Unknown game: ${gameId}`);

  const length = readUint32LE(data, 0x1c);
  const dlength = readUint32LE(data, 0x20);

  const rawdata = new Uint8Array(data.slice(0x24));
  xorBlockDecode(rawdata, length, def.decodeVar1, def.decodeVar2, def.decodeVar3);
  xorBlockDecode(rawdata, length, def.decodeVar4, def.decodeVar5, def.decodeVar6);

  const decoded = lzssDecompress(rawdata, dlength, length);

  const charIdx = decoded[def.characterOffset];
  const ctypeIdx = decoded[def.ctypeOffset];
  const rankIdx = decoded[def.rankOffset];
  const clearIdx = decoded[def.clearOffset];

  const character = def.characters[charIdx] ?? `Unknown(${charIdx})`;
  const shottype = def.shottypes[ctypeIdx] ?? "";
  const difficulty = def.difficulties[rankIdx] ?? `Unknown(${rankIdx})`;
  const { stage, stageCount } = formatClear(clearIdx, difficulty);
  const slowRate = readFloat32LE(decoded, def.slowrateOffset);

  const timestamp = readUint32LE(decoded, def.dateOffset);
  const dateObj = new Date(timestamp * 1000);
  const date = `${dateObj.getFullYear()}/${String(dateObj.getMonth() + 1).padStart(2, "0")}/${String(dateObj.getDate()).padStart(2, "0")}`;

  const score = readUint32LE(decoded, def.totalScoreOffset) * def.scoreRate;

  const gameName = GAME_NAMES[gameId] ?? gameId;

  return {
    game: `${gameName} (th${gameId})`,
    score,
    character,
    shottype,
    difficulty,
    date,
    slowRate: Math.round(slowRate * 1000) / 1000,
    stage,
    stageCount,
  };
}

function parseTh13or14(data: Uint8Array): ReplayInfo {
  try {
    const result = parseNewFormat(data, "13");
    if (result.stage === "Unknown") {
      try { return parseNewFormat(data, "14"); } catch { return result; }
    }
    return result;
  } catch {
    return parseNewFormat(data, "14");
  }
}

// ── th20 parser ──

const TH20_STONE_NAMES = ["Red", "Red2", "Blue", "Blue2", "Yellow", "Yellow2", "Green", "Green2", "Common"];

function parseTh20(data: Uint8Array): ReplayInfo {
  const userDataOffset = readUint32LE(data, 0x0c);

  if (userDataOffset > 0 && userDataOffset < data.length) {
    const userSection = data.subarray(userDataOffset);
    const magic = readString(userSection, 0, 4);

    if (magic === "USER") {
      const textStart = userSection.indexOf(0x0d);
      if (textStart > 0) {
        const textBytes = userSection.subarray(textStart);
        const text = String.fromCharCode(...textBytes.subarray(0, Math.min(500, textBytes.length)));
        const lines = text.split("\r\n").filter(Boolean);

        let date = "";
        let chara = "";
        let rank = "";
        let stage = "";
        let scoreVal = 0;
        let slowRate = 0;

        for (const line of lines) {
          if (line.startsWith("Date ")) date = line.slice(5);
          else if (line.startsWith("Chara ")) chara = line.slice(6).trim();
          else if (line.startsWith("Rank ")) rank = line.slice(5);
          else if (line.startsWith("Stage ")) stage = line.slice(6);
          else if (line.startsWith("Score ")) scoreVal = parseInt(line.slice(6), 10) * 10;
          else if (line.startsWith("Slow Rate ")) slowRate = parseFloat(line.slice(10));
        }

        let character = chara;
        let shottype = "";

        try {
          const compSize = readUint32LE(data, 0x28);
          const decompSize = readUint32LE(data, 0x2c);
          const rawdata = new Uint8Array(data.slice(0x30, 0x30 + compSize));
          xorBlockDecode(rawdata, compSize, 0x400, 0x5c, 0xe1);
          xorBlockDecode(rawdata, compSize, 0x100, 0x7d, 0x3a);
          const decoded = lzssDecompress(rawdata, decompSize, compSize);

          const shot = readUint32LE(decoded, 0xd8);
          const stones = [readUint32LE(decoded, 0xdc)];
          const characters = ["Reimu", "Marisa"];
          character = characters[shot] ?? `Unknown(${shot})`;
          shottype = TH20_STONE_NAMES[stones[0]] ?? `Stone(${stones[0]})`;
        } catch {
          // Fallback: parse chara field from USER section
        }

        const stageCount = stage.includes("All") ? 6 : stage.includes("Extra") ? 1 : 0;

        return {
          game: "FW (th20)",
          score: scoreVal,
          character,
          shottype,
          difficulty: rank,
          date,
          slowRate,
          stage,
          stageCount,
        };
      }
    }
  }

  throw new Error("Could not parse th20 replay: USER section not found");
}

// ── Main entry point ──

export function parseReplay(buffer: ArrayBuffer | Uint8Array): ReplayInfo {
  const data = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

  if (data.length < 16) {
    throw new Error("File too small to be a replay");
  }

  const magic = readUint32LE(data, 0);

  const oldGame = OLD_MAGICS[magic];
  if (oldGame) {
    switch (oldGame) {
      case "06": return parseTh6(data);
      case "07": return parseTh7(data);
      case "08": return parseTh8(data);
      case "09": throw new Error("th9 (PoFV) parsing not yet implemented");
    }
  }

  const newGame = NEW_MAGICS[magic];
  if (newGame) {
    if (newGame === "20") return parseTh20(data);
    if (newGame === "13") return parseTh13or14(data);
    return parseNewFormat(data, newGame);
  }

  throw new Error(`Unknown replay format: magic=0x${magic.toString(16)}`);
}

export function formatScore(score: number): string {
  return score.toLocaleString();
}

export function getCharacterDisplay(info: ReplayInfo): string {
  if (info.shottype) return `${info.character}${info.shottype}`;
  return info.character;
}
