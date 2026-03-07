import React from "react";
import styles from "../styles.module.css";

export function ActionBar(props: {
  canSpin: boolean;
  isSpinning: boolean;
  onSpin: () => void;
}) {
  const { canSpin, isSpinning, onSpin } = props;

  return (
    <div className={styles.actionBar}>
      <button
        className={`${styles.gachaButton} ${isSpinning ? styles.spinning : ""}`}
        onClick={onSpin}
        disabled={isSpinning || !canSpin}
      >
        {isSpinning ? "가챠 중..." : "가챠 시작!"}
      </button>
    </div>
  );
}
