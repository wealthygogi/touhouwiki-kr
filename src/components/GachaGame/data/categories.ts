export interface Category {
  id: string;
  name: string;
  color: string;
}

export const CATEGORIES: Category[] = [
  {
    id: "game",
    name: "게임",
    color: "#ff6b6b",
  },
  {
    id: "character",
    name: "캐릭터",
    color: "#4ecdc4",
  },
];
