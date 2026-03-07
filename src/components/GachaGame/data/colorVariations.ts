export const COLOR_VARIATIONS = {
  game: ["#ff6b6b", "#ff5252", "#ff3838"],
  character: ["#4ecdc4", "#44a08d", "#3a8b7a"],
  music: ["#45b7d1", "#3ba3c4", "#318fb7"],
} as const;

export type CategoryType = keyof typeof COLOR_VARIATIONS;
