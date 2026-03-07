# GachaGame 컴포넌트

동방 프로젝트 테마의 가챠 게임 컴포넌트입니다.

## 기능

- 게임, 캐릭터 카테고리 선택
- 깜빡이는 애니메이션으로 가챠 결과 표시
- 각 아이템의 상세 정보 표시

## 사용법

```jsx
import GachaGame from '@site/src/components/GachaGame';

<GachaGame />
```

## 파일 구조

```
src/components/GachaGame/
├── index.tsx              # 메인 컴포넌트
├── styles.module.css      # 스타일
├── data/
│   ├── gameItems.ts       # 게임 아이템 데이터
│   ├── characterItems.ts  # 캐릭터 아이템 데이터
│   ├── categories.ts      # 카테고리 설정
│   └── colorVariations.ts # 색상 변형
└── README.md              # 이 파일
```

## 데이터 구조

```typescript
export interface GachaItem {
  id: string;
  name: string;
  description?: string;
}

export const GAME_ITEMS: GachaItem[] = [
  // 게임 아이템들...
];

export const CHARACTER_ITEMS: GachaItem[] = [
  // 캐릭터 아이템들...
];
```
