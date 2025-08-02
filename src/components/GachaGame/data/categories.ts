import { GachaItem } from "./gameItems";
import { GAME_ITEMS } from "./gameItems";
import { CHARACTER_ITEMS } from "./characterItems";

export interface Category {
  id: string;
  name: string;
  items: GachaItem[];
  color: string;
}

export const CATEGORIES: Category[] = [
  {
    id: "game",
    name: "게임",
    items: GAME_ITEMS,
    color: "#ff6b6b",
  },
  {
    id: "character",
    name: "캐릭터",
    items: CHARACTER_ITEMS,
    color: "#4ecdc4",
  },
];
