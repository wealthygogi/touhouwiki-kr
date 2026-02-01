import React from "react";
import styles from "../styles.module.css";

export type CategoryId = "game" | "character";

export interface Category {
  id: string;
  name: string;
  color: string;
}

export function CategoryButtons(props: {
  categories: Category[];
  selectedCategory: CategoryId;
  disabled: boolean;
  onSelect: (id: CategoryId) => void;
}) {
  const { categories, selectedCategory, disabled, onSelect } = props;

  return (
    <div className={styles.categoryButtons}>
      {categories.map((category) => (
        <button
          key={category.id}
          className={`${styles.categoryButton} ${
            selectedCategory === category.id ? styles.active : ""
          }`}
          style={{ backgroundColor: category.color }}
          onClick={() => onSelect(category.id as CategoryId)}
          disabled={disabled}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}
