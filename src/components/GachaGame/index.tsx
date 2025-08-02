import React, { useState, useEffect } from "react";
import styles from "./styles.module.css";
import { GachaItem } from "./data/gameItems";
import { CATEGORIES } from "./data/categories";
import { COLOR_VARIATIONS, CategoryType } from "./data/colorVariations";

const GachaGame: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("game");
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<GachaItem | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [flashingText, setFlashingText] = useState<string>("");
  const [spinDuration, setSpinDuration] = useState(2000);

  const currentCategory = CATEGORIES.find((cat) => cat.id === selectedCategory);
  const currentItems = currentCategory?.items || [];

  const spinGacha = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setShowResult(false);
    setResult(null);

    // 랜덤 결과 선택
    const randomIndex = Math.floor(Math.random() * currentItems.length);
    const selectedItem = currentItems[randomIndex];

    // 깜빡이는 애니메이션 (2-4초)
    const newSpinDuration = 2000 + Math.random() * 2000;
    setSpinDuration(newSpinDuration);

    // 깜빡이는 텍스트 애니메이션
    const flashInterval = 100; // 100ms마다 텍스트 변경
    const flashCount = Math.floor(newSpinDuration / flashInterval);
    let currentFlash = 0;

    const flashTimer = setInterval(() => {
      if (currentFlash < flashCount) {
        // 랜덤 아이템으로 깜빡이기
        const randomFlashIndex = Math.floor(
          Math.random() * currentItems.length
        );
        setFlashingText(currentItems[randomFlashIndex].name);
        currentFlash++;
      } else {
        // 최종 결과 표시
        clearInterval(flashTimer);
        setFlashingText(selectedItem.name);
        setIsSpinning(false);
        setResult(selectedItem);
        setShowResult(true);
      }
    }, flashInterval);

    // 디버깅용 로그 (개발 중에만 사용)
    console.log("Selected item:", selectedItem.name, "Index:", randomIndex);
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
                setSelectedCategory(category.id);
                resetGame();
              }}
              disabled={isSpinning}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.slotContainer}>
        <div className={styles.controls}>
          <button
            className={`${styles.gachaButton} ${
              isSpinning ? styles.spinning : ""
            }`}
            onClick={spinGacha}
            disabled={isSpinning}
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
                  : result?.name || "가챠를 시작해주세요!"}
              </h4>
              {!isSpinning && result?.description && (
                <p>{result.description}</p>
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
