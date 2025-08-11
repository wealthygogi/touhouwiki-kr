export interface Character {
  id: string;
  name: string;
  image: string;
  game: string;
}

export interface PlacedCharacter {
  id: string;
  character: Character;
  x: number;
  y: number;
  width: number;
  height: number;
  isSelected: boolean;
  isResizing: boolean;
  resizeHandle: string | null;
  naturalWidth?: number;
  naturalHeight?: number;
  aspectRatio?: number;
  initializedFromNatural?: boolean;
}

export interface PlacedText {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  color: string;
  isSelected: boolean;
  isResizing: boolean;
  resizeHandle: string | null;
}
