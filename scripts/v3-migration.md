# v3 마이그레이션 작업 노트

## 프로젝트 목표 (docs/v3/README.md)

`~/git/touhou-backup/~/git/touhou-backup/thpatch-data/Th06 ~ Th20` (외전 포함) 의 ko.md 데이터를
`docs/v3/` 아래 MDX 파일로 변환하는 것이 목표.

**변환 대상:**
- **캐릭터**: `omake.txt`, `characters_setting.txt` → CharacterProfile 컴포넌트
- **대사집**: `Scenario`, `Endings`, `Extra`, `Extra_and_Phantasm`, `Win_Quotes` 등 → Dialogue 컴포넌트
- **스펠카드**: `Spell_cards/` → 스펠카드 목록
- **뮤직룸**: `Music/` → MusicTrack 컴포넌트

**포함하지 않는 것:** `Images*/`, `index*/` 폴더

**작업 규칙:**
- 대사집은 줄바꿈·띄어쓰기·특수문자 문제 없이 누가 말했는지 명확히 변환
- 변환 전 각 시리즈 포맷 파악 → 템플릿 구상 → 생성
- `npm run build` 로 컴파일 검증
- 언어: Python
- commit 작업 없음
- 최종 자동화 스크립트만 남기고 `scripts/` 폴더 정리 예정

---

`scripts/generate-v3.py` (1969줄, Python 3.9) 기반 작업 기록.
~/git/touhou-backup/~/git/touhou-backup/thpatch-data/ → docs/v3/ MDX 자동 생성.

---

## 스크립트 사용법

```bash
python scripts/generate-v3.py music th06         # 특정 게임 뮤직룸
python scripts/generate-v3.py character th07     # 특정 게임 캐릭터
python scripts/generate-v3.py dialogue th145     # 특정 게임 대사집
python scripts/generate-v3.py spellcard th10     # 특정 게임 스펠카드
python scripts/generate-v3.py all                # 전체 생성
python scripts/generate-v3.py character all --dry-run  # 미리보기
```

---

## 핵심 데이터 구조

### GAMES dict (line 31)
```python
"Th06": ("shooting_game", "the-embodiment-of-scarlet-devil", "동방홍마향", 6),
#          게임타입            폴더명                            한글명       position
```
- 게임타입: `shooting_game` / `fighting_game` / `side_game`
- `side_game`: Th095, Th125, Th128, Th143, Th165, Th185 (외전 게임)

### CHARACTER_NAME_MAP (line 524)
한국어 이름 → 영어 파일명 매핑. 새 캐릭터 추가 시 여기에 등록 필수.

### CHARACTER_COMPANION_MAP (line 672)
동반 캐릭터 매핑. 여기 등록된 캐릭터는 주 캐릭터에 병합되고 단독 파일 없음.
```python
CHARACTER_COMPANION_MAP = {
    "운잔": "쿠모이 이치린",  # Th12
}
```

### DIALOGUE_FOLDER_MAP (line 1288)
폴더 suffix → (타입, 한글 라벨) 매핑.
```python
"_s_Scenario": ("scenario", "시나리오"),
"_s_Endings":  ("endings", "엔딩"),
"_s_Extra":    ("extra", "엑스트라"),
"_s_Win_Quotes": ("win-quotes", "승리 대사"),
...
```

---

## 완료된 작업

### 게임 카테고리 구조
- `shooting_game` / `fighting_game` / `side_game` 3분류 확립
- `ensure_game_dir()`: 게임 디렉토리 + `_category_.json` 자동 생성
- 외전 게임(`side_game`) 신설: Th095, Th125, Th128, Th143, Th165, Th185

### 캐릭터 파싱 (`_parse_char_block`, `_parse_multi_char_block`)

**처리된 특수 케이스:**

| 케이스 | 원인 | 처리 방법 |
|--------|------|-----------|
| Th07 프리즘리버 세자매 | ○블록에 한국어 이름 3개, 영문명 없음 | `alternative_names` 수집 → 동일 내용으로 3개 파일 생성 |
| Th12 이치린+운잔 | `_parse_multi_char_block` 에서 Ichirin 속성 누락, Unzan 타이틀 버그 | 각 캐릭터별 속성 파싱 + `CHARACTER_COMPANION_MAP`으로 운잔 내용 병합 |
| Th11 `야사카 카나코와 모리야 스와코.` | 복합 이름이 파싱 오류 | 4단어 이상 + 와/과 패턴 필터링 |
| Th19 `종족  사루가미` | 종족 필드가 이름으로 파싱됨 | phase 0에서 `이름` 키워드 지원 추가 |
| Th135 `하타노 코코로` | CHARACTER_NAME_MAP 누락 | 등록 완료 |
| Th145 `우사미 스미레코` | CHARACTER_NAME_MAP 누락 | 등록 완료 |
| Th07 한글 이름 오류 | `레티 화이트록`→`락`, `치렌`→`첸` | 수정 완료 |

**`_parse_multi_char_block` 개선 (line 1032):**
- 이전: 마지막 캐릭터만 attrs 파싱
- 이후: 각 캐릭터별로 자신의 en_name 이후 다음 캐릭터 직전까지 attrs 파싱
- 타이틀 탐색 시 속성 줄(`종족:`, `능력:` 등) 스킵

### 메타데이터 보존 (`extract_char_preserved_meta`, line 1125)
캐릭터 MDX 재생성 시 기존 파일의 수동 추가 데이터 보존:
- `image={...}` + `import ... from '@site/static/img/...'`
- `nameJa="..."`
- `themeColor="..."`

`process_character()`가 덮어쓰기 전에 기존 파일 읽어서 `preserved` dict 구성,
`generate_character_mdx(preserved=...)` 에 전달.

### 대사집 정렬 (`parse_index_dialogue_order`, line 1708)
`~/git/touhou-backup/thpatch-data/{GameCode}/index/en.md`의 "## Translatable content" 섹션에서
캐릭터 순서를 파싱해 `sidebar_position` 결정.

### 게임 이름 수정
- Th165: `비봉 나이트메어 다이어리` (violet-detector)
- Th185: `불릿필리아들의 암시장` (100th-black-market)

---

## 현재 캐릭터 생성 상태

| 게임 | 상태 | 캐릭터 수 | 비고 |
|------|------|-----------|------|
| Th06 | OK | 9명 | |
| Th07 | OK | 15명 | 프리즘리버 3명 포함 |
| Th075 | OK | 10명 | |
| Th08 | OK | 16명 | |
| Th09 | OK | 16명 | |
| Th095 | SKIP | - | 캐릭터 데이터 없음 (외전) |
| Th10 | OK | 11명 | |
| Th105 | SKIP | - | 캐릭터 데이터 없음 |
| Th11 | OK | 16명 | |
| Th12 | OK | 10명 | 운잔→이치린 병합, unzan.mdx 삭제 |
| Th123 | SKIP | - | 캐릭터 데이터 없음 |
| Th125 | SKIP | - | 캐릭터 데이터 없음 (외전) |
| Th128 | SKIP | - | 캐릭터 데이터 없음 (외전) |
| Th13 | OK | 14명 | |
| Th135 | OK | 1명 | 하타노 코코로만 파싱됨 → 수동 보완 필요 |
| Th14 | OK | 12명 | |
| Th143 | SKIP | - | 캐릭터 데이터 없음 (외전) |
| Th145 | OK | 1명 | 우사미 스미레코만 파싱됨 → 수동 보완 필요 |
| Th15 | OK | 11명 | |
| Th155 | SKIP | - | 캐릭터 데이터 없음 |
| Th16 | OK | 11명 | |
| Th165 | SKIP | - | 캐릭터 데이터 없음 (외전) |
| Th17 | OK | 10명 | |
| Th175 | OK | 1명 | 수동 보완 필요 |
| Th18 | OK | 12명 | |
| Th185 | SKIP | - | 캐릭터 데이터 없음 (외전) |
| Th19 | OK | 5명 | 일부만 파싱됨 → 수동 보완 필요 |
| Th20 | OK | 9명 | |

**격투 게임 SKIP 이유:** omake.txt에 캐릭터 설정 섹션 없음.
Th105, Th123, Th155, Th175는 `characters_setting.txt` 등 별도 소스가 없거나
thpatch에 번역 미완료.

---

## 남은 작업

### 1. 캐릭터 수동 보완 필요
- **Th135 (동방심기루)**: 12명 캐릭터 중 하타노 코코로(1명)만 파싱됨.
  나머지는 격투 게임 특성상 characters_setting 없음 → 수동 추가 필요
- **Th145 (동방심비록)**: 우사미 스미레코(1명)만 파싱됨 → 수동 추가 필요
- **Th155 (동방빙의화)**: 요리가미 죠온/시온 등 → 수동 추가 필요
- **Th175 (동방강욕이문)**: 토테츠 유마 등 → 수동 추가 필요
- **Th19 (동방수왕원)**: 일부 캐릭터 파싱됨, CHARACTER_NAME_MAP 맞지 않는 이름 있음

### 2. 대사집 파싱 품질 개선 (기존 plan 파일 참조)
`/Users/john.kim/.claude/plans/flickering-dancing-meerkat.md` 참조.

**미처리 마커들:**
- `<tl$레이무:>` → speaker 추출 (엔딩 파일 화자 태그)
- `` `15` `` 단순 숫자 타임스탬프 → 제거 (현재 `` `#N@M` `` 패턴만 제거)
- `<l$>` → 줄바꿈 변환
- `<c$ENDING No. 3$>` → Action 컴포넌트로 변환
- 대사집 제목 한글화: "Reimu 시나리오" → "레이무 시나리오"

### 3. 수동 작업
- **intro.mdx**: 각 게임 소개 문서 내용 (줄거리, 출시일, 특징 등) 수동 보완
- **music.mdx**: 일본어 곡 제목 (thpatch에 없음) 수동 추가
- **캐릭터 image/nameJa/themeColor**: 새 캐릭터 파일에는 없음 → 수동 추가

### 4. 격투 게임 캐릭터 데이터 소스 탐색
`Th105`, `Th123`, `Th135`, `Th145`, `Th155`, `Th175`는 omake에 캐릭터 섹션이 없음.
~/git/touhou-backup/thpatch-data 내 다른 파일 (예: 각 캐릭터의 win_quotes 파일 헤더) 활용 가능성 검토.

---

## 새 프롬프트 처리 가이드

### "캐릭터가 없다 / 이름이 이상하다"
1. `python scripts/generate-v3.py character ThXX --dry-run` 으로 파싱 결과 확인
2. `~/git/touhou-backup/thpatch-data/ThXX/omake.txt/ko.md` 또는 `characters_setting.txt/ko.md` 원본 확인
3. `CHARACTER_NAME_MAP` (line 524)에 이름 추가 또는 수정
4. 파싱 로직 문제면 `_parse_char_block` (line 789) 또는 `_parse_multi_char_block` (line 1032) 확인

### "대사집이 깨진다 / 형식이 이상하다"
1. 원본 파일: `~/git/touhou-backup/thpatch-data/ThXX/<캐릭터>_s_<타입>/ko.md` 확인
2. `parse_dialogue_table()` (line 1408) 파싱 로직 확인
3. 새 폴더 타입이면 `DIALOGUE_FOLDER_MAP` (line 1288) 추가

### "게임이 없다 / 카테고리가 잘못됐다"
1. `GAMES` dict (line 31) 확인 및 추가
2. `ensure_game_dir()` (line 131)가 `_category_.json` 자동 생성

### "이미지가 사라졌다 / nameJa가 없다"
- 재생성 시 기존 파일의 `image`, `nameJa`, `themeColor`는 `extract_char_preserved_meta()` (line 1125)로 자동 보존됨
- 새 파일(최초 생성)에는 없음 → 수동으로 CharacterProfile에 추가 후 재생성 시 보존됨

### "새 게임 추가"
1. `GAMES` dict에 추가
2. `CHARACTER_NAME_MAP`에 캐릭터 등록
3. `python scripts/generate-v3.py all ThXX` 실행
4. intro.mdx, music 제목, 이미지는 수동 보완

---

## 알려진 빌드 경고 (무시 가능)
```
Broken anchor: boundary_team-scenario#6A, #6B
```
Th08 영야초 시나리오의 앵커 참조 문제. 콘텐츠 결함이 아니라 빌드 경고만 발생.
