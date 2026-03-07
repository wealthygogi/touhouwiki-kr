import React, { useEffect, useMemo, useRef, useState } from "react";
import useBaseUrl from "@docusaurus/useBaseUrl";
import styles from "./styles.module.css";
import { CATEGORIES } from "./data/categories";

import { ActionBar } from "./components/ActionBar";
import { CategoryButtons, type CategoryId } from "./components/CategoryButtons";

import {
  type Character,
  type TouhouNormalizedData,
  type Work,
  loadTouhouNormalizedData,
} from "./data/touhouNormalized";

type CharacterScopeMode = "all" | "selectedWorks";
type CharacterRollMode = "pool" | "balanced";

type GachaResult =
  | {
      kind: "work";
      work: Work;
    }
  | {
      kind: "character";
      character: Character;
      sourceWork: Work | null;
    };

function displayName(ko: string, en: string, ja: string): string {
  return ko || en || ja || "(unknown)";
}

function workLabelOverride(workId: string, fallbackLabel: string): string {
  if (workId === "touhou_gumon_gensokyo_chronicle") return "동방구문사기";
  return fallbackLabel;
}

type WorkGroupId =
  | "game_win"
  | "game_twilight"
  | "game_old"
  | "music_hifuu"
  | "book"
  | "other";

function workGroupOf(work: Work): WorkGroupId {
  if (work.work_section_ja === "WinSTG作品") return "game_win";
  if (work.work_section_ja === "黄昏フロンティア作品") return "game_twilight";
  if (work.work_section_ja === "旧作") return "game_old";
  if (work.name_ja === "秘封倶楽部" || work.name_ko === "비봉구락부") return "music_hifuu";
  if (work.work_section_ja === "書籍作品" || work.type === "book") return "book";
  return "other";
}

function workGroupRank(groupId: WorkGroupId): number {
  switch (groupId) {
    case "game_win":
      return 10;
    case "game_twilight":
      return 20;
    case "game_old":
      return 30;
    case "music_hifuu":
      return 40;
    case "book":
      return 50;
    case "other":
      return 90;
  }
}

function isCommonCharacter(c: Character): boolean {
  return c.group_sub_ja === "共通";
}

function isExcludedCharacter(c: Character): boolean {
  return c.group_sub_ja === "その他（ゲーム）" || c.group_sub_ja === "その他（書籍）";
}

const BALANCED_COMMON_RATE = 0.1;

const GachaGame: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>("game");
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<GachaResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [flashingText, setFlashingText] = useState<string>("");

  const dataUrl = useBaseUrl("/data/touhou_normalized.json");
  const [dataset, setDataset] = useState<TouhouNormalizedData | null>(null);
  const [datasetLoading, setDatasetLoading] = useState(false);
  const [datasetError, setDatasetError] = useState<string | null>(null);

  const [characterScopeMode, setCharacterScopeMode] =
    useState<CharacterScopeMode>("all");
  const [characterRollMode, setCharacterRollMode] =
    useState<CharacterRollMode>("pool");
  const [selectedWorkIds, setSelectedWorkIds] = useState<string[]>([]);
  const [workQuery, setWorkQuery] = useState<string>("");

  // Common characters are always included.
  const includeCommon = true;

  const [characterListQuery, setCharacterListQuery] = useState<string>("");
  const [openCharacterGroups, setOpenCharacterGroups] = useState<Set<string>>(
    () => new Set()
  );

  const flashTimerRef = useRef<number | null>(null);

  const currentCategory = CATEGORIES.find((cat) => cat.id === selectedCategory);

  useEffect(() => {
    return () => {
      if (flashTimerRef.current != null) {
        window.clearInterval(flashTimerRef.current);
        flashTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (dataset) return;
    setDatasetLoading(true);
    setDatasetError(null);

    loadTouhouNormalizedData(dataUrl)
      .then((d) => {
        if (cancelled) return;
        setDataset(d);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Failed to load dataset";
        setDatasetError(msg);
      })
      .finally(() => {
        if (cancelled) return;
        setDatasetLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [dataUrl, dataset]);

  const worksById = useMemo(() => {
    const m = new Map<string, Work>();
    for (const w of dataset?.works || []) m.set(w.id, w);
    return m;
  }, [dataset]);

  const allCharactersFiltered = useMemo(() => {
    return (dataset?.characters || []).filter((c) => !isExcludedCharacter(c));
  }, [dataset]);

  const commonCharacters = useMemo(() => {
    return allCharactersFiltered.filter(isCommonCharacter);
  }, [allCharactersFiltered]);

  const gameWorks = useMemo(() => {
    return (dataset?.works || []).filter((w) => w.type === "game");
  }, [dataset]);

  const workIdsWithCharacters = useMemo(() => {
    const set = new Set<string>();
    for (const c of dataset?.characters || []) {
      if (c.source_work_id) set.add(c.source_work_id);
    }
    return set;
  }, [dataset]);

  const workOptions = useMemo(() => {
    const items = Array.from(workIdsWithCharacters).map((id) => {
      const w = worksById.get(id);
      const label = w
        ? workLabelOverride(id, displayName(w.name_ko, w.name_en, w.name_ja))
        : id;
      const groupId = w ? workGroupOf(w) : ("other" as const);
      return {
        id,
        label,
        groupRank: w ? workGroupRank(groupId) : 999,
        orderIndex: w?.order_index ?? null,
      };
    });

    items.sort((a, b) => {
      if (a.groupRank !== b.groupRank) return a.groupRank - b.groupRank;
      const ao = a.orderIndex;
      const bo = b.orderIndex;
      if (ao != null && bo != null && ao !== bo) return ao - bo;
      if (ao != null && bo == null) return -1;
      if (ao == null && bo != null) return 1;
      return a.label.localeCompare(b.label);
    });

    return items.map(({ id, label }) => ({ id, label }));
  }, [workIdsWithCharacters, worksById]);

  const charactersByWorkId = useMemo(() => {
    const map = new Map<string, Character[]>();
    for (const c of allCharactersFiltered) {
      if (isCommonCharacter(c)) continue;
      if (!c.source_work_id) continue;
      const list = map.get(c.source_work_id) || [];
      list.push(c);
      map.set(c.source_work_id, list);
    }
    return map;
  }, [allCharactersFiltered]);

  const eligibleWorkIds = useMemo(() => {
    if (characterScopeMode === "all") return Array.from(charactersByWorkId.keys());
    return selectedWorkIds;
  }, [characterScopeMode, charactersByWorkId, selectedWorkIds]);

  const eligibleWorkChars = useMemo(() => {
    const out: Character[] = [];
    for (const workId of eligibleWorkIds) {
      const list = charactersByWorkId.get(workId);
      if (list) out.push(...list);
    }
    return out;
  }, [eligibleWorkIds, charactersByWorkId]);

  const eligibleCommonChars = useMemo(() => {
    return includeCommon ? commonCharacters : [];
  }, [commonCharacters, includeCommon]);

  const poolCharacters = useMemo(() => {
    return eligibleWorkChars.concat(eligibleCommonChars);
  }, [eligibleCommonChars, eligibleWorkChars]);

  const canSpin = useMemo(() => {
    if (datasetLoading) return false;
    if (datasetError) return false;
    if (!dataset) return false;
    if (selectedCategory === "game") return gameWorks.length > 0;
    if (selectedCategory === "character") {
      if (characterScopeMode === "selectedWorks" && selectedWorkIds.length === 0) {
        return false;
      }
      return poolCharacters.length > 0;
    }
    return false;
  }, [characterScopeMode, dataset, datasetError, datasetLoading, gameWorks.length, poolCharacters.length, selectedCategory, selectedWorkIds.length]);

  const spinGacha = () => {
    if (isSpinning) return;
    if (!dataset || !canSpin) return;

    if (flashTimerRef.current != null) {
      window.clearInterval(flashTimerRef.current);
      flashTimerRef.current = null;
    }

    setIsSpinning(true);
    setShowResult(false);
    setResult(null);

    const selectedResult: GachaResult = (() => {
      if (selectedCategory === "game") {
        const idx = Math.floor(Math.random() * gameWorks.length);
        const work = gameWorks[idx];
        return { kind: "work", work };
      }

      // character
      if (characterRollMode === "pool") {
        const idx = Math.floor(Math.random() * poolCharacters.length);
        const character = poolCharacters[idx];
        const sourceWork = character.source_work_id
          ? worksById.get(character.source_work_id) || null
          : null;
        return { kind: "character", character, sourceWork };
      }

      // balanced
      const balancedWorkIds = eligibleWorkIds.filter(
        (id) => (charactersByWorkId.get(id) || []).length > 0
      );

      if (balancedWorkIds.length === 0) {
        const idx = Math.floor(Math.random() * poolCharacters.length);
        const character = poolCharacters[idx];
        const sourceWork = character.source_work_id
          ? worksById.get(character.source_work_id) || null
          : null;
        return { kind: "character", character, sourceWork };
      }

      const canPickCommon = includeCommon && eligibleCommonChars.length > 0;
      const pCommon = canPickCommon ? BALANCED_COMMON_RATE : 0;
      if (canPickCommon && Math.random() < pCommon) {
        const idx = Math.floor(Math.random() * eligibleCommonChars.length);
        const character = eligibleCommonChars[idx];
        return { kind: "character", character, sourceWork: null };
      }

      const workIdx = Math.floor(Math.random() * balancedWorkIds.length);
      const workId = balancedWorkIds[workIdx];
      const workChars = charactersByWorkId.get(workId) || [];
      const idx = Math.floor(Math.random() * workChars.length);
      const character = workChars[idx];
      const sourceWork = worksById.get(workId) || null;
      return { kind: "character", character, sourceWork };
    })();

    // 깜빡이는 애니메이션 (2-4초)
    const newSpinDuration = 2000 + Math.random() * 2000;

    // 깜빡이는 텍스트 애니메이션
    const flashInterval = 100; // 100ms마다 텍스트 변경
    const flashCount = Math.floor(newSpinDuration / flashInterval);
    let currentFlash = 0;

    const flashTimer = window.setInterval(() => {
      if (currentFlash < flashCount) {
        if (selectedCategory === "game") {
          const i = Math.floor(Math.random() * gameWorks.length);
          const w = gameWorks[i];
          setFlashingText(displayName(w.name_ko, w.name_en, w.name_ja));
        } else {
          const i = Math.floor(Math.random() * poolCharacters.length);
          const c = poolCharacters[i];
          setFlashingText(displayName(c.name_ko, c.name_en, c.name_ja));
        }
        currentFlash++;
      } else {
        // 최종 결과 표시
        window.clearInterval(flashTimer);
        flashTimerRef.current = null;
        setFlashingText(
          selectedResult.kind === "work"
            ? displayName(
                selectedResult.work.name_ko,
                selectedResult.work.name_en,
                selectedResult.work.name_ja
              )
            : displayName(
                selectedResult.character.name_ko,
                selectedResult.character.name_en,
                selectedResult.character.name_ja
              )
        );
        setIsSpinning(false);
        setResult(selectedResult);
        setShowResult(true);
      }
    }, flashInterval);
    flashTimerRef.current = flashTimer;
  };

  const resetGame = () => {
    setResult(null);
    setShowResult(false);
    setFlashingText("");
  };

  const toggleWorkId = (workId: string) => {
    setSelectedWorkIds((prev) => {
      if (prev.includes(workId)) return prev.filter((x) => x !== workId);
      return prev.concat(workId);
    });
    resetGame();
  };

  const clearSelectedWorks = () => {
    setSelectedWorkIds([]);
    resetGame();
  };

  const selectAllVisibleWorks = (visibleIds: string[]) => {
    setSelectedWorkIds((prev) => {
      const set = new Set(prev);
      for (const id of visibleIds) set.add(id);
      return Array.from(set);
    });
    resetGame();
  };

  const filteredWorkOptions = useMemo(() => {
    const q = workQuery.trim().toLowerCase();
    if (!q) return workOptions;
    return workOptions.filter((w) => w.label.toLowerCase().includes(q));
  }, [workOptions, workQuery]);

  const selectedWorkIdSet = useMemo(() => {
    return new Set(selectedWorkIds);
  }, [selectedWorkIds]);

  const selectedWorkChips = useMemo(() => {
    const map = new Map(workOptions.map((w) => [w.id, w.label] as const));
    return selectedWorkIds
      .map((id) => ({
        id,
        label: map.get(id) || id,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [selectedWorkIds, workOptions]);

  const balancedWorkIds = useMemo(() => {
    return eligibleWorkIds.filter((id) => (charactersByWorkId.get(id) || []).length > 0);
  }, [eligibleWorkIds, charactersByWorkId]);

  const oddsPreview = useMemo(() => {
    if (selectedCategory !== "character") return "";
    if (characterScopeMode === "selectedWorks" && selectedWorkIds.length === 0) {
      return "작품을 선택하면 확률 미리보기가 표시됩니다.";
    }

    const commonCount = eligibleCommonChars.length;
    const workCount = balancedWorkIds.length;
    const total = poolCharacters.length;
    if (total === 0) return "대상 캐릭터가 없습니다.";

    if (characterRollMode === "pool") {
      const commonPct = includeCommon && total > 0 ? Math.round((commonCount / total) * 100) : 0;
      return `풀(캐릭터 균등): 총 ${total}명 · 공통 약 ${commonPct}%`;
    }

    const pCommon = includeCommon && commonCount > 0 ? BALANCED_COMMON_RATE : 0;
    const workPct = workCount > 0 ? Math.round(((1 - pCommon) / workCount) * 100) : 0;
    const commonPct = Math.round(pCommon * 100);
    return `작품 균등: 작품당 약 ${workPct}% · 공통 ${commonPct}%`;
  }, [balancedWorkIds.length, characterRollMode, characterScopeMode, includeCommon, poolCharacters.length, selectedCategory, selectedWorkIds.length, eligibleCommonChars.length]);

  const normalizedCharacterListQuery = useMemo(() => {
    return characterListQuery.trim().toLowerCase();
  }, [characterListQuery]);

  const doesCharacterMatchQuery = (c: Character, q: string) => {
    if (!q) return true;
    return (
      c.id.toLowerCase().includes(q) ||
      c.name_ko.toLowerCase().includes(q) ||
      c.name_ja.toLowerCase().includes(q) ||
      c.name_en.toLowerCase().includes(q)
    );
  };

  type CharacterListItem =
    | { kind: "heading"; id: string; label: string }
    | { kind: "group"; id: string; label: string; characters: Character[] };

  const characterListItems = useMemo(() => {
    if (!dataset) return [] as CharacterListItem[];

    const items: CharacterListItem[] = [];
    const q = normalizedCharacterListQuery;

    const pushGroup = (id: string, label: string, chars: Character[]) => {
      if (!q && chars.length === 0) return;
      if (q && chars.length === 0) return;
      items.push({ kind: "group", id, label, characters: chars });
    };

    // Common group (always included).
    pushGroup(
      "__common",
      "공통",
      commonCharacters.filter((c) => doesCharacterMatchQuery(c, q))
    );

    const groupOrder: Array<{ id: WorkGroupId; label: string }> = [
      { id: "game_win", label: "WinSTG작품" },
      { id: "game_twilight", label: "황혼프론티어 작품" },
      { id: "game_old", label: "구작" },
      { id: "music_hifuu", label: "비봉구락부" },
      { id: "book", label: "서적작품" },
      { id: "other", label: "그외" },
    ];

    const worksByGroup = new Map<WorkGroupId, Array<{ id: string; label: string }>>();
    for (const w of workOptions) {
      const work = worksById.get(w.id);
      const groupId = work ? workGroupOf(work) : ("other" as const);
      const list = worksByGroup.get(groupId) || [];
      list.push(w);
      worksByGroup.set(groupId, list);
    }

    for (const grp of groupOrder) {
      const list = worksByGroup.get(grp.id) || [];
      const groupItems: Array<{ id: string; label: string; chars: Character[] }> = [];
      for (const w of list) {
        const all = charactersByWorkId.get(w.id) || [];
        const chars = all.filter((c) => doesCharacterMatchQuery(c, q));
        if (!q && all.length === 0) continue;
        if (q && chars.length === 0) continue;
        groupItems.push({ id: w.id, label: w.label, chars });
      }

      if (groupItems.length === 0) continue;

      items.push({ kind: "heading", id: `__heading_${grp.id}`, label: grp.label });
      for (const gi of groupItems) {
        items.push({ kind: "group", id: gi.id, label: gi.label, characters: gi.chars });
      }
    }

    return items;
  }, [charactersByWorkId, commonCharacters, dataset, normalizedCharacterListQuery, workOptions, worksById]);

  useEffect(() => {
    const q = normalizedCharacterListQuery;
    if (!q) return;
    const next = new Set<string>();
    for (const it of characterListItems) {
      if (it.kind !== "group") continue;
      if (it.characters.length > 0) next.add(it.id);
    }
    setOpenCharacterGroups(next);
  }, [characterListItems, normalizedCharacterListQuery]);

  const expandAllCharacterGroups = () => {
    setOpenCharacterGroups(
      new Set(
        characterListItems
          .filter((it) => it.kind === "group")
          .map((it) => it.id)
      )
    );
  };

  const collapseAllCharacterGroups = () => {
    setOpenCharacterGroups(new Set());
  };

  const setCharacterGroupOpen = (id: string, open: boolean) => {
    setOpenCharacterGroups((prev) => {
      const next = new Set(prev);
      if (open) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.categorySelector}>
        <h3>카테고리 선택</h3>
        <CategoryButtons
          categories={CATEGORIES}
          selectedCategory={selectedCategory}
          disabled={isSpinning}
          onSelect={(id) => {
            setSelectedCategory(id);
            resetGame();
          }}
        />

        <div className={styles.datasetStatus}>
          {datasetLoading && <span>데이터 로딩 중...</span>}
          {!datasetLoading && datasetError && (
            <span className={styles.datasetError}>{datasetError}</span>
          )}
        </div>

        <ActionBar canSpin={canSpin} isSpinning={isSpinning} onSpin={spinGacha} />

        <div className={styles.slotContainer}>
          <div className={styles.controls}>
            {/* 깜빡이는 결과 영역 */}
            <div className={styles.result}>
              <h3>🎉 결과 🎉</h3>
              <div className={styles.resultItem}>
                <h4 className={isSpinning ? styles.flashing : ""}>
                  {isSpinning
                    ? flashingText
                    : result
                      ? result.kind === "work"
                        ? displayName(
                            result.work.name_ko,
                            result.work.name_en,
                            result.work.name_ja
                          )
                        : displayName(
                            result.character.name_ko,
                            result.character.name_en,
                            result.character.name_ja
                          )
                      : "가챠를 시작해주세요!"}
                </h4>
                {!isSpinning && selectedCategory === "character" && !canSpin && (
                  <p>
                    {characterScopeMode === "selectedWorks" &&
                    selectedWorkIds.length === 0
                      ? "작품을 1개 이상 선택해주세요."
                      : "대상 캐릭터가 없습니다."}
                  </p>
                )}

                {!isSpinning && result?.kind === "work" && (
                  <div className={styles.meta}>
                    {result.work.name_ja && <div>JP: {result.work.name_ja}</div>}
                    {result.work.name_en && <div>EN: {result.work.name_en}</div>}
                  </div>
                )}

                {!isSpinning && result?.kind === "character" && (
                  <div className={styles.meta}>
                    {result.character.name_ja && (
                      <div>JP: {result.character.name_ja}</div>
                    )}
                    {result.character.name_en && (
                      <div>EN: {result.character.name_en}</div>
                    )}
                    {result.sourceWork ? (
                      <div className={styles.sourceWork}>
                        작품: {displayName(
                          result.sourceWork.name_ko,
                          result.sourceWork.name_en,
                          result.sourceWork.name_ja
                        )}
                      </div>
                    ) : isCommonCharacter(result.character) ? (
                      <div className={styles.sourceWork}>작품: 공통</div>
                    ) : null}
                  </div>
                )}
              </div>
              {showResult && result && (
                <button className={styles.resetButton} onClick={resetGame}>
                  다시 하기
                </button>
              )}
            </div>
          </div>
        </div>

        {selectedCategory === "character" && (
          <div className={styles.advancedControls}>
            <div className={styles.controlRow}>
              <div className={styles.controlLabel}>작품 범위</div>
              <div className={styles.segmented}>
                <button
                  type="button"
                  className={`${styles.segmentButton} ${
                    characterScopeMode === "all" ? styles.segmentActive : ""
                  }`}
                  onClick={() => {
                    setCharacterScopeMode("all");
                    resetGame();
                  }}
                  disabled={isSpinning}
                >
                  전체
                </button>
                <button
                  type="button"
                  className={`${styles.segmentButton} ${
                    characterScopeMode === "selectedWorks"
                      ? styles.segmentActive
                      : ""
                  }`}
                  onClick={() => {
                    setCharacterScopeMode("selectedWorks");
                    resetGame();
                  }}
                  disabled={isSpinning}
                >
                  특정 작품
                </button>
              </div>

              {characterScopeMode === "selectedWorks" && (
                <div className={styles.workPicker}>
                  <div className={styles.workPickerHeader}>
                    <div className={styles.workPickerTitle}>
                      작품 선택 <span className={styles.muted}>(선택됨 {selectedWorkIds.length})</span>
                    </div>
                    <div className={styles.workPickerActions}>
                      <button
                        type="button"
                        className={styles.smallButton}
                        onClick={() => selectAllVisibleWorks(filteredWorkOptions.map((w) => w.id))}
                        disabled={isSpinning || datasetLoading || !!datasetError}
                      >
                        전체 선택
                      </button>
                      <button
                        type="button"
                        className={styles.smallButton}
                        onClick={clearSelectedWorks}
                        disabled={isSpinning || datasetLoading || !!datasetError}
                      >
                        전체 해제
                      </button>
                    </div>
                  </div>

                  <div className={styles.workPickerHint}>
                    클릭으로 선택/해제됩니다. (Ctrl/⌘ 필요 없음)
                  </div>

                  <input
                    className={styles.searchInput}
                    type="text"
                    value={workQuery}
                    onChange={(e) => setWorkQuery(e.target.value)}
                    placeholder="작품 검색..."
                    disabled={isSpinning || datasetLoading || !!datasetError}
                  />

                  {selectedWorkChips.length > 0 && (
                    <div className={styles.chipRow}>
                      {selectedWorkChips.map((w) => (
                        <button
                          key={w.id}
                          type="button"
                          className={styles.chip}
                          onClick={() => toggleWorkId(w.id)}
                          disabled={isSpinning || datasetLoading || !!datasetError}
                          title="클릭하면 해제"
                        >
                          {w.label}
                          <span className={styles.chipRemove} aria-hidden>
                            ×
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className={styles.workList}>
                    {filteredWorkOptions.map((w) => {
                      const checked = selectedWorkIdSet.has(w.id);
                      const count = (charactersByWorkId.get(w.id) || []).length;
                      return (
                        <label key={w.id} className={styles.workRow}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleWorkId(w.id)}
                            disabled={isSpinning || datasetLoading || !!datasetError}
                          />
                          <span className={styles.workRowLabel}>{w.label}</span>
                          <span className={styles.workRowCount}>{count}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.controlRow}>
              <div className={styles.controlLabel}>롤 방식</div>
              <div className={styles.segmented}>
                <button
                  type="button"
                  className={`${styles.segmentButton} ${
                    characterRollMode === "pool" ? styles.segmentActive : ""
                  }`}
                  onClick={() => {
                    setCharacterRollMode("pool");
                    resetGame();
                  }}
                  disabled={isSpinning}
                >
                  풀(캐릭터 균등)
                </button>
                <button
                  type="button"
                  className={`${styles.segmentButton} ${
                    characterRollMode === "balanced" ? styles.segmentActive : ""
                  }`}
                  onClick={() => {
                    setCharacterRollMode("balanced");
                    resetGame();
                  }}
                  disabled={isSpinning}
                >
                  작품 균등
                </button>
              </div>
            </div>

            <div className={styles.controlRow}>
              <div className={styles.previewLine}>{oddsPreview}</div>
            </div>

            {!datasetLoading && !datasetError && dataset && (
              <div className={styles.datasetStatus}>
                <span>
                  대상 캐릭터 {poolCharacters.length.toLocaleString()}명
                </span>
              </div>
            )}

            {!datasetLoading && !datasetError && dataset && (
              <div className={styles.characterListSection}>
                <div className={styles.characterListHeader}>
                  <div>
                    <div className={styles.characterListTitle}>캐릭터 목록</div>
                    <div className={styles.characterListSubtitle}>
                      작품별로 접기/펼치기 하면서 확인할 수 있습니다.
                      (その他 게임/서적 제외)
                    </div>
                  </div>
                  <div className={styles.characterListActions}>
                    <button
                      type="button"
                      className={styles.smallButton}
                      onClick={expandAllCharacterGroups}
                      disabled={isSpinning}
                    >
                      전체 펼치기
                    </button>
                    <button
                      type="button"
                      className={styles.smallButton}
                      onClick={collapseAllCharacterGroups}
                      disabled={isSpinning}
                    >
                      전체 접기
                    </button>
                  </div>
                </div>

                <input
                  className={styles.searchInput}
                  type="text"
                  value={characterListQuery}
                  onChange={(e) => setCharacterListQuery(e.target.value)}
                  placeholder="캐릭터 검색... (한국어/일본어/영어)"
                  disabled={isSpinning}
                />

                <div className={styles.accordionList}>
                  {characterListItems.filter((it) => it.kind === "group").length === 0 ? (
                    <div className={styles.emptyNote}>검색 결과가 없습니다.</div>
                  ) : (
                    characterListItems.map((it) => {
                      if (it.kind === "heading") {
                        return (
                          <div key={it.id} className={styles.groupHeading}>
                            {it.label}
                          </div>
                        );
                      }

                      const isOpen = openCharacterGroups.has(it.id);
                      const count = it.characters.length;
                      return (
                        <details
                          key={it.id}
                          className={styles.accordionItem}
                          open={isOpen}
                          onToggle={(e) => {
                            setCharacterGroupOpen(it.id, e.currentTarget.open);
                          }}
                        >
                          <summary className={styles.accordionSummary}>
                            <span className={styles.accordionLabel}>{it.label}</span>
                            <span className={styles.badge}>{count}</span>
                          </summary>
                          <div className={styles.accordionPanel}>
                            <ul className={styles.characterList}>
                              {it.characters
                                .slice()
                                .sort((a, b) =>
                                  displayName(a.name_ko, a.name_en, a.name_ja).localeCompare(
                                    displayName(b.name_ko, b.name_en, b.name_ja)
                                  )
                                )
                                .map((c) => {
                                  const main = displayName(c.name_ko, c.name_en, c.name_ja);
                                  const tail = [
                                    c.name_ja ? `JP: ${c.name_ja}` : "",
                                    c.name_en ? `EN: ${c.name_en}` : "",
                                  ]
                                    .filter(Boolean)
                                    .join(" | ");
                                  return (
                                    <li key={c.id} className={styles.characterRow}>
                                      <div className={styles.characterLine}>
                                        {tail ? `${main} — ${tail}` : main}
                                      </div>
                                    </li>
                                  );
                                })}
                            </ul>
                          </div>
                        </details>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default GachaGame;
