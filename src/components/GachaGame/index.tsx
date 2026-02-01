import React, { useEffect, useMemo, useRef, useState } from "react";
import useBaseUrl from "@docusaurus/useBaseUrl";
import styles from "./styles.module.css";
import { CATEGORIES } from "./data/categories";

import {
  type Character,
  type TouhouNormalizedData,
  type Work,
  loadTouhouNormalizedData,
} from "./data/touhouNormalized";

type CategoryId = "game" | "character";
type CharacterScopeMode = "all" | "singleWork";
type CharacterRollMode = "global" | "byWork";

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

function isCommonCharacter(c: Character): boolean {
  return c.group_sub_ja === "共通";
}

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
    useState<CharacterRollMode>("global");
  const [selectedWorkId, setSelectedWorkId] = useState<string>("");

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

  const commonCharacters = useMemo(() => {
    return (dataset?.characters || []).filter(isCommonCharacter);
  }, [dataset]);

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
    const ids = Array.from(workIdsWithCharacters);
    ids.sort((a, b) => {
      const wa = worksById.get(a);
      const wb = worksById.get(b);
      const na = wa ? displayName(wa.name_ko, wa.name_en, wa.name_ja) : a;
      const nb = wb ? displayName(wb.name_ko, wb.name_en, wb.name_ja) : b;
      return na.localeCompare(nb);
    });
    return ids.map((id) => {
      const w = worksById.get(id);
      return {
        id,
        label: w ? displayName(w.name_ko, w.name_en, w.name_ja) : id,
      };
    });
  }, [workIdsWithCharacters, worksById]);

  useEffect(() => {
    if (selectedCategory !== "character") return;
    if (characterScopeMode !== "singleWork") return;
    if (selectedWorkId) return;
    if (!workOptions.length) return;
    setSelectedWorkId(workOptions[0].id);
  }, [characterScopeMode, selectedCategory, selectedWorkId, workOptions]);

  const characterCandidates = useMemo(() => {
    const all = dataset?.characters || [];
    if (characterScopeMode === "all") return all;
    if (!selectedWorkId) return [];
    // Default decision: include common characters in specific-work scope.
    return all.filter(
      (c) => c.source_work_id === selectedWorkId || isCommonCharacter(c)
    );
  }, [characterScopeMode, dataset, selectedWorkId]);

  const charactersByWorkId = useMemo(() => {
    const map = new Map<string, Character[]>();
    for (const c of characterCandidates) {
      if (!c.source_work_id) continue;
      const list = map.get(c.source_work_id) || [];
      list.push(c);
      map.set(c.source_work_id, list);
    }
    return map;
  }, [characterCandidates]);

  const canSpin = useMemo(() => {
    if (datasetLoading) return false;
    if (datasetError) return false;
    if (!dataset) return false;
    if (selectedCategory === "game") return gameWorks.length > 0;
    if (selectedCategory === "character") return characterCandidates.length > 0;
    return false;
  }, [characterCandidates.length, dataset, datasetError, datasetLoading, gameWorks.length, selectedCategory]);

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
      if (characterRollMode === "global") {
        const idx = Math.floor(Math.random() * characterCandidates.length);
        const character = characterCandidates[idx];
        const sourceWork = character.source_work_id
          ? worksById.get(character.source_work_id) || null
          : null;
        return { kind: "character", character, sourceWork };
      }

      // byWork
      const eligibleWorkIds: string[] =
        characterScopeMode === "singleWork" && selectedWorkId
          ? [selectedWorkId]
          : Array.from(charactersByWorkId.keys());

      if (eligibleWorkIds.length === 0) {
        const idx = Math.floor(Math.random() * characterCandidates.length);
        const character = characterCandidates[idx];
        const sourceWork = character.source_work_id
          ? worksById.get(character.source_work_id) || null
          : null;
        return { kind: "character", character, sourceWork };
      }

      const workIdx = Math.floor(Math.random() * eligibleWorkIds.length);
      const workId = eligibleWorkIds[workIdx];
      const workChars = charactersByWorkId.get(workId) || [];
      const pool = workChars.concat(commonCharacters);
      const pickFrom = pool.length > 0 ? pool : characterCandidates;

      const idx = Math.floor(Math.random() * pickFrom.length);
      const character = pickFrom[idx];
      const sourceWork = character.source_work_id
        ? worksById.get(character.source_work_id) || null
        : worksById.get(workId) || null;
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
          const i = Math.floor(Math.random() * characterCandidates.length);
          const c = characterCandidates[i];
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

  return (
    <div className={styles.container}>
      <div className={styles.categorySelector}>
        <h3>카테고리 선택</h3>
        <div className={styles.categoryButtons}>
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              className={`${styles.categoryButton} ${
                selectedCategory === category.id ? styles.active : ""
              }`}
              style={{ backgroundColor: category.color }}
              onClick={() => {
                setSelectedCategory(category.id as CategoryId);
                resetGame();
              }}
              disabled={isSpinning}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className={styles.datasetStatus}>
          {datasetLoading && <span>데이터 로딩 중...</span>}
          {!datasetLoading && datasetError && (
            <span className={styles.datasetError}>{datasetError}</span>
          )}
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
                    characterScopeMode === "singleWork"
                      ? styles.segmentActive
                      : ""
                  }`}
                  onClick={() => {
                    setCharacterScopeMode("singleWork");
                    resetGame();
                  }}
                  disabled={isSpinning}
                >
                  특정 작품
                </button>
              </div>

              {characterScopeMode === "singleWork" && (
                <select
                  className={styles.workSelect}
                  value={selectedWorkId}
                  onChange={(e) => {
                    setSelectedWorkId(e.target.value);
                    resetGame();
                  }}
                  disabled={isSpinning || datasetLoading || !!datasetError}
                >
                  {workOptions.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className={styles.controlRow}>
              <div className={styles.controlLabel}>롤 방식</div>
              <div className={styles.segmented}>
                <button
                  type="button"
                  className={`${styles.segmentButton} ${
                    characterRollMode === "global" ? styles.segmentActive : ""
                  }`}
                  onClick={() => {
                    setCharacterRollMode("global");
                    resetGame();
                  }}
                  disabled={isSpinning}
                >
                  전체 캐릭터 풀
                </button>
                <button
                  type="button"
                  className={`${styles.segmentButton} ${
                    characterRollMode === "byWork" ? styles.segmentActive : ""
                  }`}
                  onClick={() => {
                    setCharacterRollMode("byWork");
                    resetGame();
                  }}
                  disabled={isSpinning}
                >
                  작품 기반
                </button>
              </div>
            </div>

            {!datasetLoading && !datasetError && dataset && (
              <div className={styles.datasetStatus}>
                <span>
                  대상 캐릭터 {characterCandidates.length.toLocaleString()}명
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className={styles.slotContainer}>
        <div className={styles.controls}>
          <button
            className={`${styles.gachaButton} ${
              isSpinning ? styles.spinning : ""
            }`}
            onClick={spinGacha}
            disabled={isSpinning || !canSpin}
          >
            {isSpinning ? "가챠 중..." : "가챠 시작!"}
          </button>

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
                <p>대상 캐릭터가 없습니다.</p>
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
                  {result.sourceWork && (
                    <div className={styles.sourceWork}>
                      작품: {displayName(
                        result.sourceWork.name_ko,
                        result.sourceWork.name_en,
                        result.sourceWork.name_ja
                      )}
                    </div>
                  )}
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
    </div>
  );
};

export default GachaGame;
