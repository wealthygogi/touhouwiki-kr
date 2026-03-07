#!/usr/bin/env python3
"""
v3 MDX Generator - ~/git/touhou-backup/thpatch-data ko.md → MDX 변환 스크립트

Usage:
    python scripts/generate-v3.py music th06        # 특정 게임 뮤직룸
    python scripts/generate-v3.py music all          # 전체 뮤직룸
    python scripts/generate-v3.py spellcard th06     # 특정 게임 스펠카드
    python scripts/generate-v3.py spellcard all      # 전체 스펠카드
    python scripts/generate-v3.py character th06     # 특정 게임 캐릭터
    python scripts/generate-v3.py character all      # 전체 캐릭터
    python scripts/generate-v3.py dialogue th175     # 특정 게임 대사집
    python scripts/generate-v3.py dialogue all       # 전체 대사집
    python scripts/generate-v3.py all                # 전체 (뮤직룸 + 스펠카드 + 캐릭터 + 대사집)
    python scripts/generate-v3.py music th06 --dry-run  # 미리보기
"""

import os
import re
import sys
import json
from pathlib import Path

# 프로젝트 루트
ROOT = Path(__file__).resolve().parent.parent
THPATCH = Path.home() / "git" / "touhou-backup" / "thpatch-data"
DOCS_V3 = ROOT / "docs" / "v3"
DATA_DIR = ROOT / "data"

# 게임 코드 → (타입, 폴더명, 한글명, position) 매핑
GAMES = {
    "Th06": ("shooting_game", "the-embodiment-of-scarlet-devil", "동방홍마향", 6),
    "Th07": ("shooting_game", "perfect-cherry-blossom", "동방요요몽", 7),
    "Th075": ("fighting_game", "immaterial-and-missing-power", "동방췌몽상", 75),
    "Th08": ("shooting_game", "imperishable-night", "동방영야초", 8),
    "Th09": ("shooting_game", "phantasmagoria-of-flower-view", "동방화영총", 9),
    "Th095": ("side_game", "shoot-the-bullet", "동방문화첩", 95),
    "Th10": ("shooting_game", "mountain-of-faith", "동방풍신록", 10),
    "Th105": ("fighting_game", "scarlet-weather-rhapsody", "동방비상천", 105),
    "Th11": ("shooting_game", "subterranean-animism", "동방지령전", 11),
    "Th12": ("shooting_game", "undefined-fantastic-object", "동방성련선", 12),
    "Th123": ("fighting_game", "touhou-hisoutensoku", "동방비상천칙", 123),
    "Th125": ("side_game", "double-spoiler", "더블 스포일러", 125),
    "Th128": ("side_game", "fairy-wars", "요정대전쟁", 128),
    "Th13": ("shooting_game", "ten-desires", "동방신령묘", 13),
    "Th135": ("fighting_game", "hopeless-masquerade", "동방심기루", 135),
    "Th14": ("shooting_game", "double-dealing-character", "동방휘침성", 14),
    "Th143": ("side_game", "impossible-spell-card", "탄막 아마노자쿠", 143),
    "Th145": ("fighting_game", "urban-legend-in-limbo", "동방심비록", 145),
    "Th15": ("shooting_game", "legacy-of-lunatic-kingdom", "동방감주전", 15),
    "Th155": ("fighting_game", "antinomy-of-common-flowers", "동방빙의화", 155),
    "Th16": ("shooting_game", "hidden-star-in-four-seasons", "동방천공장", 16),
    "Th165": ("side_game", "violet-detector", "비봉 나이트메어 다이어리", 165),
    "Th17": ("shooting_game", "wily-beast-and-weakest-creature", "동방귀형수", 17),
    "Th175": ("fighting_game", "gouyoku-ibun", "동방강욕이문", 175),
    "Th18": ("shooting_game", "unconnected-marketeers", "동방홍룡동", 18),
    "Th185": ("side_game", "100th-black-market", "불릿필리아들의 암시장", 185),
    "Th19": ("shooting_game", "the-unfinished-dream-of-all-living-ghost", "동방수왕원", 19),
    "Th20": ("shooting_game", "fossilized-wonders", "동방금상경", 20),
}

# 캐릭터 아바타 매핑 생성
CHARACTER_AVATAR_MAP = {}
try:
    with open(DATA_DIR / "touhou_normalized_v2.json", "r", encoding="utf-8") as f:
        data = json.load(f)
        for char in data.get("characters", []):
            name_ko = char.get("name_ko")
            char_id = char.get("id")
            if name_ko and char_id:
                # 성 떼고 이름만으로도 매칭되게 (예: "레이무" -> "reimu_hakurei")
                CHARACTER_AVATAR_MAP[name_ko] = char_id
                if " " in name_ko:
                    first_name = name_ko.split(" ")[-1]
                    if first_name not in CHARACTER_AVATAR_MAP:
                        CHARACTER_AVATAR_MAP[first_name] = char_id
except Exception as e:
    print(f"Warning: Could not load avatar map: {e}")

# 수동 추가 (매핑 안되는 경우)
CHARACTER_AVATAR_MAP.update({
    "레이무": "reimu_hakurei",
    "마리사": "marisa_kirisame",
    "사쿠야": "sakuya_izayoi",
    "요우무": "youmu_konpaku",
    "앨리스": "alice_margatroid",
    "레밀리아": "remilia_scarlet",
    "유유코": "yuyuko_saigyouji",
    "유카리": "yukari_yakumo",
    "사나에": "sanae_kochiya",
    "아야": "aya_shameimaru",
    "치르노": "cirno",
    "아리야": "ariya_iwanaga",
    "나레코": "nareko_michigami",
    "유이만": "yuiman_asama",
    "토요히메": "watatsuki_no_toyohime",
    "잔무": "zanmu_nippouchi",
    "카나코": "kanako_yasaka",
    "스와코": "suwako_moriya",
    "파츄리": "patchouli_knowledge",
    "오린": "rin_kaenbyou",
    "사토리": "satori_komeiji",
    "코이시": "koishi_komeiji",
    "케이키": "keiki_haniyasushin",
    "사키": "saki_kurokoma",
    "치미": "chimi_hoju",
    "우바메": "ubame_chirizuka",
    "에노코": "enoko_maimoto",
    "에이린": "eirin_yagokoro",
})

def get_avatar_id(name: str) -> str:
    """캐릭터 이름으로 아바타 ID 반환"""
    name = name.strip()
    return CHARACTER_AVATAR_MAP.get(name, "")


def get_game_dir(game_code: str) -> Path:
    """게임 코드로 출력 디렉토리 경로 반환"""
    game_type, folder_name, _, _ = GAMES[game_code]
    return DOCS_V3 / game_type / folder_name


GAME_TYPE_CATEGORIES = {
    "shooting_game": ("슈팅 게임", 1),
    "fighting_game": ("격투 게임", 2),
    "side_game": ("외전 게임", 3),
}


def ensure_game_dir(game_code: str) -> Path:
    """게임 디렉토리가 없으면 _category_.json과 함께 생성 (부모 카테고리도 자동 생성)"""
    game_type, folder_name, kr_name, position = GAMES[game_code]

    # 부모 카테고리 디렉토리 생성
    type_dir = DOCS_V3 / game_type
    type_cat_path = type_dir / "_category_.json"
    if not type_cat_path.exists():
        type_dir.mkdir(parents=True, exist_ok=True)
        if game_type in GAME_TYPE_CATEGORIES:
            kr_type_name, type_pos = GAME_TYPE_CATEGORIES[game_type]
            type_cat = {
                "label": kr_type_name,
                "position": type_pos,
                "link": {"type": "generated-index", "description": f"{kr_type_name} 목록입니다."}
            }
            with open(type_cat_path, "w", encoding="utf-8") as f:
                json.dump(type_cat, f, ensure_ascii=False, indent=2)

    game_dir = type_dir / folder_name
    if not game_dir.exists():
        game_dir.mkdir(parents=True, exist_ok=True)
        cat = {
            "label": kr_name,
            "position": position,
            "link": {
                "type": "generated-index",
                "description": f"{kr_name} ({game_code}) 관련 문서입니다."
            }
        }
        with open(game_dir / "_category_.json", "w", encoding="utf-8") as f:
            json.dump(cat, f, ensure_ascii=False, indent=2)
    return game_dir


def clean_wiki_content(raw: str) -> str:
    """ko.md에서 위키 노이즈 제거, 본문만 추출"""
    lines = raw.split("\n")
    # YAML frontmatter 제거
    if lines and lines[0].strip() == "---":
        end = -1
        for i in range(1, len(lines)):
            if lines[i].strip() == "---":
                end = i
                break
        if end > 0:
            lines = lines[end + 1:]

    content = "\n".join(lines)

    # "다른 언어:" 블록 제거 (다른 언어: 부터 다음 빈 줄 두 개 또는 ## 헤더까지)
    content = re.sub(
        r"다른 언어:\s*\n(?:\s*\*[^\n]*\n)*",
        "",
        content
    )

    # 위키 네비게이션 제거
    patterns_to_remove = [
        r"Touhou Project \d+.*?translations are in progress\.\s*",
        r"Touhou Patch Center\s*",
        r"< \[Th\d+\].*?\n",
        r"\[둘러보기로 이동\].*?\n",
        r"\[검색으로 이동\].*?\n",
        r"이 문서는.*?완료했습니다\.\s*\n",
        r"오래된 번역은.*?표시됩니다\.\s*\n",
        r"# 동방.*?Touhou Patch Center\s*\n",  # 제목 + 사이트명 라인
    ]
    for pat in patterns_to_remove:
        content = re.sub(pat, "", content, flags=re.DOTALL)

    return content.strip()


def escape_mdx(text: str) -> str:
    """MDX에서 문제되는 문자 이스케이프"""
    if not text:
        return ""
    # &를 먼저 변환 (HTML 엔티티 중복 방지 위해 나중에 할 수도 있지만 여기선 단순하게)
    # 사실 &lt; 등을 직접 쓰고 있으므로 & 자체를 변환하면 안됨.
    # 대신 문제되는 문자만 최소한으로 변환
    text = text.replace("{", "&#123;")
    text = text.replace("}", "&#125;")
    text = text.replace("<", "&lt;")
    text = text.replace(">", "&gt;")
    text = text.replace('"', "&quot;")
    text = text.replace("~", "&#126;")
    # @ 문자도 Docusaurus/MDX에서 이슈가 될 수 있으므로 변환 (특히 이메일처럼 보일 때)
    # 하지만 여기선 구분자로 쓰이므로 일단 둠. 
    # 대신 줄바꿈으로 변환되는 로직이 있다면 거기서 처리.
    return text


# ========== 뮤직룸 파서 ==========

def parse_music(game_code: str) -> list[dict]:
    """Music/ko.md에서 트랙 정보 추출"""
    music_path = THPATCH / game_code / "Music" / "ko.md"
    if not music_path.exists():
        return []

    raw = music_path.read_text(encoding="utf-8")
    content = clean_wiki_content(raw)

    tracks = []
    # 패턴: No. X [title](link) 또는 No. X title
    # 코멘트: @ 로 시작하는 줄

    # 목차 섹션 제거
    content = re.sub(r"## 목차\s*\n(?:\s*\*[^\n]*\n)*", "", content)
    # Music titles translation 헤더 제거
    content = re.sub(r"#{1,5}\s*\[?Music titles translation\]?.*?\n", "", content)
    # spells.js 관련 제거
    content = re.sub(r"\|[^\|]*Gnome[^\|]*\|[^\|]*\|\s*\n", "", content)

    # 트랙 추출: "No. X" 패턴으로 분할
    track_pattern = re.compile(
        r"\|\s*No\.\s*(\d+)\s*\[([^\]]+)\]\([^)]*\)\s*\|"
        r"(?:\s*Arrangement of \*?\[?([^\]]*?)\]?(?:\([^)]*\))?\*?\s*\|)?"
    )
    comment_pattern = re.compile(r"\|\s*@\s*(.*?)\s*\|")

    lines = content.split("\n")
    i = 0
    while i < len(lines):
        line = lines[i]
        m = track_pattern.search(line)
        if m:
            number = m.group(1)
            title = m.group(2).strip()
            original = m.group(3).strip() if m.group(3) else None

            # 다음 줄에서 코멘트 찾기
            comment = ""
            for j in range(i + 1, min(i + 4, len(lines))):
                cm = comment_pattern.search(lines[j])
                if cm:
                    comment = cm.group(1).strip()
                    i = j
                    break

            tracks.append({
                "number": number,
                "title": title,
                "original": original,
                "comment": comment,
            })
        i += 1

    return tracks


def generate_music_mdx(game_code: str, tracks: list[dict]) -> str:
    """트랙 리스트 → music.mdx 문자열"""
    _, _, kr_name, _ = GAMES[game_code]
    thpatch_url = f"https://www.thpatch.net/wiki/{game_code.lower()}/Music/ko"

    lines = [
        "---",
        f'title: "뮤직룸"',
        f"sidebar_position: 4",
        "---",
        "",
        "import MusicTrack from '@site/src/components/v3/MusicTrack';",
        "",
        ":::info",
        f"데이터 출처: [Touhou Patch Center — {game_code}/Music]({thpatch_url}).\\",
        "원문은 CC BY-SA 4.0을 따르며, 동일한 라이선스로 재배포했습니다.",
        ":::",
        "",
        "# 뮤직룸",
        "",
    ]

    for t in tracks:
        original_attr = ""
        if t["original"]:
            orig = escape_mdx(t["original"])
            original_attr = f'\n  originalTitle="{orig}"'

        comment = escape_mdx(t["comment"]) if t["comment"] else ""
        title = escape_mdx(t["title"])

        lines.append(f"<MusicTrack")
        lines.append(f'  number="{t["number"]}"')
        lines.append(f'  title="{title}"{original_attr}')
        lines.append(f'  composer="ZUN"')
        lines.append(f">")
        if comment:
            lines.append(comment)
        lines.append(f"</MusicTrack>")
        lines.append("")

    return "\n".join(lines)


def process_music(game_code: str, dry_run: bool = False) -> bool:
    """특정 게임의 뮤직룸 MDX 생성"""
    if game_code not in GAMES:
        print(f"  [SKIP] {game_code}: 알 수 없는 게임 코드")
        return False

    tracks = parse_music(game_code)
    if not tracks:
        print(f"  [SKIP] {game_code}: Music/ko.md 없음 또는 트랙 없음")
        return False

    mdx = generate_music_mdx(game_code, tracks)

    if dry_run:
        print(f"  [DRY-RUN] {game_code}: {len(tracks)}곡")
        print(mdx[:500])
        print("...")
        return True

    game_dir = ensure_game_dir(game_code)
    out_path = game_dir / "music.mdx"
    out_path.write_text(mdx, encoding="utf-8")
    print(f"  [OK] {game_code}: {len(tracks)}곡 → {out_path.relative_to(ROOT)}")
    return True


# ========== 스펠카드 파서 ==========

def parse_spell_cards(game_code: str) -> list[dict]:
    """Spell_cards/ko.md에서 스펠카드 정보 추출"""
    sc_path = THPATCH / game_code / "Spell_cards" / "ko.md"
    if not sc_path.exists():
        return []

    raw = sc_path.read_text(encoding="utf-8")
    content = clean_wiki_content(raw)

    # 목차 제거
    content = re.sub(r"## 목차\s*\n(?:\s*\*[^\n]*\n)*", "", content)
    # spells.js 관련 제거
    content = re.sub(r"\|[^\|]*Gnome[^\|]*\|[^\|]*\|\s*\n", "", content)

    cards = []
    current_stage = None

    # 테이블 헤더 찾기 (| # | Name | Owner |)
    lines = content.split("\n")
    in_table = False

    for line in lines:
        line = line.strip()
        if not line.startswith("|"):
            # 마크다운 헤더로 된 스테이지 구분 (## Stage 1 등)
            stage_match = re.match(r"#{1,4}\s*(Stage\s+\d+|Extra\s*Stage|Last Word|라스트 워드)", line, re.IGNORECASE)
            if stage_match:
                current_stage = stage_match.group(1).strip()
            continue

        cells = [c.strip() for c in line.split("|")]
        # 빈 셀 제거 (앞뒤 | 때문에)
        cells = [c for c in cells if c != ""]

        if not cells:
            continue

        # 헤더 행 건너뛰기
        if cells[0] in ("#", "---") or all(c == "---" for c in cells):
            if cells[0] == "#":
                in_table = True
            continue

        if not in_table and len(cells) < 2:
            continue

        # 스테이지 구분 행 감지
        if len(cells) >= 1:
            stage_match = re.match(
                r"(Stage\s+\d+|Extra\s*Stage|Extra|Last Word|라스트 워드|Last\s*Spell)",
                cells[0],
                re.IGNORECASE
            )
            if stage_match and (len(cells) < 3 or cells[1] == "" or cells[2] == ""):
                current_stage = stage_match.group(1).strip()
                in_table = True
                continue

        # 캐릭터 구분 행 (격투게임: 캐릭터명 | | |)
        if len(cells) >= 1 and len(cells) <= 3:
            if (len(cells) == 1) or (len(cells) >= 2 and cells[1] == "" and (len(cells) < 3 or cells[2] == "")):
                # 스테이지 패턴이 아니면 캐릭터 구분으로 처리
                if not re.match(r"^\d+$", cells[0]) and not re.match(r"player-", cells[0]):
                    current_stage = cells[0]
                    in_table = True
                    continue

        # 스펠카드 행: number | name | owner (| description 선택)
        if len(cells) >= 3:
            num = cells[0]
            name = cells[1]
            owner = cells[2]
            # ID 패턴: 숫자, player-xxx, common-x, 0+Boss..., 0\_1 등
            # 스테이지 헤더가 아닌 모든 유효한 ID를 허용
            is_stage = re.match(
                r"^(Stage\s+\d+|Extra|Last|라스트|스킬|#|---)",
                num, re.IGNORECASE
            )
            if name and not is_stage and num != "":
                cards.append({
                    "number": num,
                    "name": name,
                    "owner": owner,
                    "stage": current_stage or "",
                })

    return cards


def generate_spellcard_mdx(game_code: str, cards: list[dict]) -> str:
    """스펠카드 리스트 → spell-cards.mdx 문자열"""
    _, _, kr_name, _ = GAMES[game_code]
    thpatch_url = f"https://www.thpatch.net/wiki/{game_code.lower()}/Spell_cards/ko"

    lines = [
        "---",
        f'title: "스펠카드"',
        f"sidebar_position: 5",
        "---",
        "",
        "import { SpellCardTable, SpellCardRow } from '@site/src/components/v3';",
        "",
        ":::info",
        f"데이터 출처: [Touhou Patch Center — {game_code}/Spell cards]({thpatch_url}).\\",
        "원문은 CC BY-SA 4.0을 따르며, 동일한 라이선스로 재배포했습니다.",
        ":::",
        "",
    ]

    # 스테이지별 그룹핑
    stages = []
    current_stage = None
    current_cards = []

    for card in cards:
        stage = card["stage"]
        if stage != current_stage:
            if current_cards:
                stages.append((current_stage or "기타", current_cards))
            current_stage = stage
            current_cards = []
        current_cards.append(card)

    if current_cards:
        stages.append((current_stage or "기타", current_cards))

    for stage_name, stage_cards in stages:
        title = escape_mdx(stage_name)
        lines.append(f'<SpellCardTable title="{title}">')
        for card in stage_cards:
            num = escape_mdx(str(card["number"]))
            name = escape_mdx(card["name"])
            owner = escape_mdx(card["owner"])
            lines.append(f'  <SpellCardRow number="{num}" name="{name}" owner="{owner}" />')
        lines.append("</SpellCardTable>")
        lines.append("")

    return "\n".join(lines)


def process_spellcard(game_code: str, dry_run: bool = False) -> bool:
    """특정 게임의 스펠카드 MDX 생성"""
    if game_code not in GAMES:
        print(f"  [SKIP] {game_code}: 알 수 없는 게임 코드")
        return False

    cards = parse_spell_cards(game_code)
    if not cards:
        print(f"  [SKIP] {game_code}: Spell_cards/ko.md 없음 또는 카드 없음")
        return False

    mdx = generate_spellcard_mdx(game_code, cards)

    if dry_run:
        print(f"  [DRY-RUN] {game_code}: {len(cards)}장")
        print(mdx[:500])
        print("...")
        return True

    game_dir = ensure_game_dir(game_code)
    out_path = game_dir / "spell-cards.mdx"
    out_path.write_text(mdx, encoding="utf-8")
    print(f"  [OK] {game_code}: {len(cards)}장 → {out_path.relative_to(ROOT)}")
    return True


# ========== 캐릭터 파서 ==========

# 캐릭터명 → 영어 파일명 매핑 (omake.txt에 영어명이 없는 게임용)
CHARACTER_NAME_MAP = {
    # Th06
    "하쿠레이 레이무": "hakurei_reimu",
    "키리사메 마리사": "kirisame_marisa",
    "루미아": "rumia",
    "치르노": "cirno",
    "홍 메이링": "hong_meiling",
    "파츄리 널릿지": "patchouli_knowledge",
    "이자요이 사쿠야": "izayoi_sakuya",
    "레밀리아 스칼렛": "remilia_scarlet",
    "플랑드르 스칼렛": "flandre_scarlet",
    # Th07
    "레티 화이트락": "letty_whiterock",
    "첸": "chen",
    "앨리스 마가트로이드": "alice_margatroid",
    "릴리 화이트": "lily_white",
    "루나사 프리즘리버": "lunasa_prismriver",
    "장녀 루나사 프리즘리버": "lunasa_prismriver",
    "차녀 메를랑 프리즘리버": "merlin_prismriver",
    "메를랑 프리즘리버": "merlin_prismriver",
    "삼녀 리리카 프리즘리버": "lyrica_prismriver",
    "리리카 프리즘리버": "lyrica_prismriver",
    "콘파쿠 요우무": "konpaku_youmu",
    "사이교우지 유유코": "saigyouji_yuyuko",
    "야쿠모 란": "yakumo_ran",
    "야쿠모 유카리": "yakumo_yukari",
    # Th08
    "카미시라사와 케이네": "kamishirasawa_keine",

    "이나바 테위": "inaba_tewi",
    "레이센 우동게인 이나바": "reisen_udongein_inaba",
    "야고코로 에이린": "yagokoro_eirin",
    "호라이산 카구야": "houraisan_kaguya",
    "후지와라노 모코우": "fujiwara_no_mokou",
    # Th09
    "샤메이마루 아야": "shameimaru_aya",
    "메디슨 멜랑콜리": "medicine_melancholy",
    "카자미 유카": "kazami_yuuka",
    "오노즈카 코마치": "onozuka_komachi",
    "시키에이키 야마자나두": "shikieiki_yamaxanadu",
    # Th10
    "아키 시즈하": "aki_shizuha",
    "아키 미노리코": "aki_minoriko",
    "카기야마 히나": "kagiyama_hina",
    "카와시로 니토리": "kawashiro_nitori",
    "이누바시리 모미지": "inubashiri_momiji",
    "코치야 사나에": "kochiya_sanae",
    "야사카 카나코": "yasaka_kanako",
    # Th11
    "쿠로다니 야마메": "kurodani_yamame",
    "미즈하시 파르시": "mizuhashi_parsee",
    "호시구마 유기": "hoshiguma_yuugi",
    "코메이지 사토리": "komeiji_satori",
    "카엔린": "kaenbyou_rin",
    "레이우지 우츠호": "reiuji_utsuho",
    "코메이지 코이시": "komeiji_koishi",
    # Th12
    "운잔": "unzan",
    "나즈린": "nazrin",
    "타타라 코가사": "tatara_kogasa",
    "쿠모이 이치린": "kumoi_ichirin",
    "무라사 미나미츠": "murasa_minamitsu",
    "토라마루 쇼": "toramaru_shou",
    "히지리 뱌쿠렌": "hijiri_byakuren",
    "호쥬 누에": "houjuu_nue",
    # Th13
    "카소다니 쿄코": "kasodani_kyouko",
    "미야코 요시카": "miyako_yoshika",
    "곽 청아": "kaku_seiga",
    "소가노 토지코": "soga_no_tojiko",
    "모노노베노 후토": "mononobe_no_futo",
    "토요사토미미노 미코": "toyosatomimi_no_miko",
    "후타츠이와 마미조": "futatsuiwa_mamizou",
    # Th14
    "와카사기히메": "wakasagihime",
    "세키반키": "sekibanki",
    "이마이즈미 카게로": "imaizumi_kagerou",
    "츠쿠모 벤벤": "tsukumo_benben",
    "츠쿠모 야츠하시": "tsukumo_yatsuhashi",
    "키진 세이자": "kijin_seija",
    "스쿠나 신묘마루": "sukuna_shinmyoumaru",
    "호리카와 라이코": "horikawa_raiko",
    # Th15
    "세이란": "seiran",
    "링고": "ringo",
    "도레미 스위트": "doremy_sweet",
    "키신 사구메": "kishin_sagume",
    "크라운피스": "clownpiece",
    "쥰코": "junko",
    "헤카티아 라피스라줄리": "hecatia_lapislazuli",
    # Th16
    "에타니티 라바": "eternity_larva",
    "사카타 네무노": "sakata_nemuno",
    "코마노 아운": "komano_aunn",
    "야타데라 나리즈": "yatadera_narizu",
    "니시다 사토노": "nishida_satono",
    "테이레이다 마이": "teireida_mai",
    "마타라 오키나": "matara_okina",
    # Th17
    "에비스 에이카": "ebisu_eika",
    "우시자키 우루미": "ushizaki_urumi",
    "니와타리 쿠타카": "niwatari_kutaka",
    "키타쵸 요즈미": "kitacho_yozumi",
    "요리카와 한야": "yorikawa_hanya",
    "쿠로카마 소야": "kurokoma_saki",
    # Th18
    "히메 타카네": "takane_yamashiro",
    "코마쿠사 사나쿠": "komakusa_sannyo",
    "야마시로 타카네": "yamashiro_takane",
    "타마츠쿠리 미스마루": "tamatsukuri_misumaru",
    "텐교 쿠도쿠": "tenkyuu_chimata",
    "모모요": "momoyo_himemushi",
    "이이자쿠라 미사기": "iizunamaru_megumu",
    # Th19
    "손 비텐": "son_biten",
    "미츠가시라 에노코": "enoko_maimoto",
    "엔오코 라이코": "enoko_maimoto",
    "텐카진 치야리": "chiyari",
    "차마": "chiyari",
    "요모츠 히사미": "hisami_yomotsu",
    "닛파쿠 잔무": "zanmu_nippaku",
    "미야마 스이카": "miyama_suika",
    "오카자키 유메미": "okazaki_yumemi",
    "장가 나츠미": "zanmu_nippaku",
    # Th075
    "이부키 스이카": "ibuki_suika",
    # Th135
    "하타노 코코로": "hatano_kokoro",
    # Th145
    "우사미 스미레코": "usami_sumireko",
    # Th128
    "대요정": "daiyousei",
    "스타 사파이어": "star_sapphire",
    "루나 차일드": "luna_child",
    "서니 밀크": "sunny_milk",
    # Th175
    "토테츠 유마": "toutetsu_yuuma",
    "야사카 카나코": "yasaka_kanako",
    "무라사 미나미츠": "murasa_minamitsu",
    "도끼 바나나시": "yorigami_joon",
    "의존의 여신 시온": "yorigami_shion",
    "요리가미 죠온": "yorigami_joon",
    "요리가미 시온": "yorigami_shion",
}


# 동반 캐릭터 매핑: 이 캐릭터들은 별도 파일 없이 주 캐릭터에 병합
# key = 동반 캐릭터 이름, value = 주 캐릭터 이름
CHARACTER_COMPANION_MAP = {
    "운잔": "쿠모이 이치린",  # Th12: Unzan → Ichirin
}


def parse_characters(game_code: str) -> list[dict]:
    """omake.txt/ko.md 등에서 캐릭터 정보 추출"""
    char_candidates = [
        "omake.txt",
        "characters_setting.txt",
        "characters_setting_and_extra_story.txt"
    ]

    all_characters = []
    source_file_used = "omake.txt"

    for cand in char_candidates:
        p = THPATCH / game_code / cand / "ko.md"
        if not p.exists():
            continue

        source_file_used = cand
        raw = p.read_text(encoding="utf-8")
        content = clean_wiki_content(raw)

        # ``` 코드블록 내용만 추출
        blocks = re.findall(r"```\s*\n(.*?)```", content, re.DOTALL)
        if blocks:
            content = "\n".join(blocks)

        # 캐릭터 섹션 찾기
        # [.．] = ASCII 마침표 + 전각 마침표(U+FF0E) 모두 매칭
        char_section_patterns = [
            r"={3,}\s*\n■\d+[.．]\s*캐릭터에 대한.*?\n={3,}\s*\n",
            r"={3,}\s*\n■\d+[.．]\s*캐릭터 설정\s*\n={3,}\s*\n",
            r"={3,}\s*\n\s*■\d+[.．]\s*캐릭터 설정\s*\n={3,}\s*\n",
            r"={3,}\s*\n■\d+[.．]\s*보스 캐릭터 설정\s*\n={3,}\s*\n",
            r"={3,}\s*\n■\d+[.．]\s*캐릭터 소개\s*\n={3,}\s*\n",
            r"={3,}\s*\n■\d+[.．]\s*캐릭터\s*\n={3,}\s*\n",
            r"■\d+[.．]\s*캐릭터 설정\s*\n",
        ]

        char_start = -1
        for pat in char_section_patterns:
            m = re.search(pat, content)
            if m:
                char_start = m.end()
                break

        if char_start < 0:
            continue

        next_section = re.search(r"\n={3,}\s*\n■|\n■\d+\.", content[char_start:])
        if next_section:
            char_content = content[char_start:char_start + next_section.start()]
        else:
            char_content = content[char_start:]

        char_blocks = re.split(r"\n\s*○", char_content)

        for i, block in enumerate(char_blocks):
            block = block.strip()
            if not block:
                continue
            if i == 0 and not char_content.strip().startswith("○"):
                continue

            parsed = _parse_char_block(block)
            if parsed:
                all_characters.extend(parsed)

    # 중복 제거 (같은 이름이 플레이어/적 양쪽에 등장하면 설명 병합)
    seen: dict[str, int] = {}  # name -> index in unique_chars
    unique_chars = []
    for c in all_characters:
        if c["name"] not in seen:
            seen[c["name"]] = len(unique_chars)
            unique_chars.append(c)
        else:
            existing = unique_chars[seen[c["name"]]]
            if c.get("description"):
                if existing.get("description"):
                    existing["description"] += "\n\n---\n\n" + c["description"]
                else:
                    existing["description"] = c["description"]

    # 동반 캐릭터 병합: CHARACTER_COMPANION_MAP에 정의된 캐릭터를 주 캐릭터에 병합
    companions: dict[str, dict] = {}
    for c in unique_chars:
        if c["name"] in CHARACTER_COMPANION_MAP:
            primary_name = CHARACTER_COMPANION_MAP[c["name"]]
            companions[primary_name] = c

    final_chars = []
    for c in unique_chars:
        if c["name"] in CHARACTER_COMPANION_MAP:
            continue  # 동반 캐릭터는 단독 파일 없이 제외
        companion = companions.get(c["name"])
        if companion:
            # 동반 캐릭터 정보를 설명에 병합
            lines = [f"[{companion['name']}]"]
            if companion.get("species"):
                lines.append(f"종족: {companion['species']}")
            if companion.get("ability"):
                lines.append(f"능력: {companion['ability']}")
            if companion.get("description"):
                lines.append(companion["description"])
            companion_text = "\n".join(lines)
            if c.get("description"):
                c["description"] += "\n\n---\n\n" + companion_text
            else:
                c["description"] = companion_text
        final_chars.append(c)

    return final_chars, source_file_used


def _parse_char_block(block: str) -> list[dict]:
    """단일 ○ 블록에서 캐릭터 정보 추출 (복수 캐릭터 가능)"""
    lines = block.split("\n")
    if not lines:
        return []

    # 첫 줄: ○ 뒤의 텍스트
    first_line = lines[0].strip()

    # ○ 라인이 "N면 보스" 등 스테이지 역할인지 확인
    # 이 경우 실제 타이틀과 이름은 다음 줄에 있음
    is_stage_header = bool(re.match(
        r'^(\d+면\s*(보스|중보스)|EX면?\s*(보스|중보스)|엑스트라\s*보스|라스트)',
        first_line, re.IGNORECASE
    ))

    # 전각공백(　)으로 분리된 인라인 타이틀 처리
    # 예: "5면 보스　역습의 아마노자쿠", "낙원의 멋진 무녀"
    inline_title = ""
    if "\u3000" in first_line:
        parts = first_line.split("\u3000", 1)
        if len(parts) == 2 and parts[1].strip():
            inline_title = parts[1].strip()
            first_line = parts[0].strip()
            is_stage_header = True  # 스테이지 정보 + 타이틀 구조

    # 콘텐츠 줄 추출 (빈줄이 아닌 줄들)
    content_lines = []
    for line in lines[1:]:
        stripped = line.strip().replace("\u3000", " ").strip()
        content_lines.append(stripped)

    # 영어 이름 줄 위치 찾기 (파싱 핵심 기준점)
    en_name_indices = []
    for idx, cl in enumerate(content_lines):
        if cl and re.match(r'^[A-Za-z\s\.\-\'\"]+$', cl):
            # 구분선(---...) 제외
            if re.match(r'^-{3,}$', cl):
                continue
            en_name_indices.append(idx)

    # 복수 캐릭터 감지 (같은 블록에 영어 이름이 2개 이상)
    if len(en_name_indices) >= 2:
        return _parse_multi_char_block(first_line, inline_title, content_lines, en_name_indices)

    # 단일 캐릭터 파싱
    title = ""
    name = ""
    name_en = ""
    attrs = {}
    desc_lines = []
    attr_done = False
    alternative_names: list[str] = []

    if en_name_indices:
        # 영어 이름이 있으면, 바로 위 줄이 실제 이름
        en_idx = en_name_indices[0]
        name_en = content_lines[en_idx]

        # 이름: 영어 이름 바로 위의 비어있지 않은 줄
        for k in range(en_idx - 1, -1, -1):
            if content_lines[k]:
                name = content_lines[k]
                break

        # 타이틀 결정
        if inline_title:
            title = inline_title
        elif is_stage_header:
            # 이름 위의 비어있지 않은 줄이 타이틀
            for k in range(en_idx - 2, -1, -1):
                if content_lines[k]:
                    title = content_lines[k]
                    break
            if not title:
                title = first_line
        else:
            title = first_line

        # 속성과 설명: 영어 이름 다음부터
        start_idx = en_idx + 1
        for cl in content_lines[start_idx:]:
            if not cl:
                if attrs and not attr_done:
                    attr_done = True
                elif attr_done and desc_lines:
                    desc_lines.append("")  # 설명 내 단락 구분 보존
                continue
            attr_match = re.match(
                r'^(종족|동족|능력|거처|직업|위험도|인간 우호도|활동 장소|호칭|소유|소속):?\s*(.+)$',
                cl
            )
            if attr_match and not attr_done:
                attrs[attr_match.group(1)] = attr_match.group(2).strip()
            else:
                attr_done = True
                desc_lines.append(cl)
    else:
        # 영어 이름 없음 (Th06, Th075 스타일)
        if is_stage_header and not inline_title:
            # "N면 보스" → 다음줄이 타이틀, 그 다음이 이름(또는 이름만)
            phase = 0  # 0=타이틀대기, 1=이름대기, 2=속성, 3=설명
            for cl in content_lines:
                if not cl:
                    if phase == 2 and attrs:
                        phase = 3
                    elif phase == 3 and desc_lines:
                        desc_lines.append("")
                    continue
                if phase == 0:
                    title = cl
                    phase = 1
                    continue
                if phase == 1:
                    # 속성줄인지 확인
                    attr_match = re.match(
                        r'^(종족|동족|능력|거처|직업):?\s*(.+)$', cl
                    )
                    if attr_match:
                        # 타이틀이 실제 이름이었음 (속성이 바로 옴)
                        name = title
                        title = first_line
                        attrs[attr_match.group(1)] = attr_match.group(2).strip()
                        phase = 2
                    else:
                        name = cl
                        phase = 2
                    continue
                if phase == 2:
                    attr_match = re.match(
                        r'^(종족|동족|능력|거처|직업|위험도|인간 우호도|활동 장소|호칭|소유|소속):?\s*(.+)$',
                        cl
                    )
                    if attr_match:
                        attrs[attr_match.group(1)] = attr_match.group(2).strip()
                    else:
                        phase = 3
                        desc_lines.append(cl)
                elif phase == 3:
                    desc_lines.append(cl)
        else:
            # 일반 형식: ○타이틀 / 이름 / 속성 / 설명
            # Th19 스타일: ○타이틀 / 종족 / 이름 / 능력 / 설명 (속성이 먼저 오고 이름이 필드로 나오는 경우)
            title = inline_title if inline_title else first_line
            phase = 0  # 0=이름대기, 1=속성/추가이름, 2=설명
            alternative_names: list[str] = []
            for cl in content_lines:
                if not cl:
                    if phase == 1 and attrs:
                        phase = 2
                    elif phase == 2 and desc_lines:
                        desc_lines.append("")
                    continue
                if phase == 0:
                    # Th19 스타일: 속성이 먼저 오는 경우 (종족, 이름 등)
                    attr_early = re.match(
                        r'^(종족|동족|능력|거처|직업|위험도|인간 우호도|활동 장소|호칭|소유|소속|이름)\s+(.+)$',
                        cl
                    )
                    if attr_early:
                        key, val = attr_early.group(1), attr_early.group(2).strip()
                        if key == '이름':
                            name = val
                            phase = 1  # 이름 찾음
                        else:
                            attrs[key] = val
                            # phase 0 유지: 이름을 계속 찾음
                    else:
                        name = cl
                        phase = 1
                    continue
                if phase == 1:
                    attr_match = re.match(
                        r'^(종족|동족|능력|거처|직업|위험도|인간 우호도|활동 장소|호칭|소유|소속|이름):?\s*(.+)$',
                        cl
                    )
                    if attr_match:
                        key, val = attr_match.group(1), attr_match.group(2).strip()
                        if key == '이름' and not name:
                            name = val
                        else:
                            attrs[key] = val
                    elif (not attrs
                          and len(cl) <= 20
                          and re.match(r'^[가-힣\s]+$', cl)):
                        # 연속된 한국어 이름 (예: 차녀 메를랑 프리즘리버)
                        alternative_names.append(cl)
                    else:
                        phase = 2
                        desc_lines.append(cl)
                elif phase == 2:
                    desc_lines.append(cl)

    if not name:
        return []

    # 설명 정리 - 섹션 구분선/◇ 헤더 제거 (마지막 플레이어 캐릭터에 적 캐릭터 구분선이 bleeding되는 문제 방지)
    desc_lines = [l for l in desc_lines if not re.match(r'^-{10,}$', l) and not l.startswith('◇')]
    description = "\n".join(desc_lines).strip()
    description = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", description)
    description = re.sub(r"원본 주소.*$", "", description, flags=re.DOTALL).strip()

    # 이름 끝 괄호 제거 (예: "손 비텐 (孫 美天)" → "손 비텐")
    name = re.sub(r'\s*\([^)]*\)\s*$', '', name).strip()

    # 속성 키워드로 시작하는 경우 잘못된 파싱 (Th19: 종족/이름 필드가 먼저 나오는 스타일)
    if re.match(r'^(종족|동족|능력|거처|직업|위험도|이름)\s', name):
        return []

    # 두 캐릭터 이름이 '와'/'과'로 연결된 경우 스킵 (Th11 캐릭터 설정 등)
    # "야사카 카나코와 모리야 스와코." → 4개 이상의 단어 중 하나가 와/과로 끝나는 경우
    name_words = name.rstrip('.。').split()
    if (len(name_words) >= 4
            and any(w.endswith('와') or w.endswith('과') for w in name_words[:-1])):
        return []

    # 너무 긴 "이름"은 설명 문장 → 스킵
    if len(name) > 20 and not name_en:
        return []

    base_entry = {
        "title": title,
        "name": name,
        "name_en": name_en,
        "ability": attrs.get("능력", ""),
        "species": attrs.get("종족", attrs.get("동족", "")),
        "location": attrs.get("거처", attrs.get("활동 장소", "")),
        "description": description,
    }

    # 연속된 한국어 이름이 있으면 각각 동일 내용의 항목으로 확장 (예: 프리즘리버 세자매)
    if alternative_names:
        results = [base_entry]
        for alt_name in alternative_names:
            alt_entry = dict(base_entry)
            alt_entry["name"] = alt_name
            alt_entry["name_en"] = ""
            results.append(alt_entry)
        return results

    return [base_entry]


def _parse_multi_char_block(first_line: str, inline_title: str,
                             content_lines: list[str],
                             en_name_indices: list[int]) -> list[dict]:
    """복수 캐릭터가 포함된 블록 파싱 (예: Th14 4면 츠쿠모 자매)"""
    characters = []
    is_last_idx = len(en_name_indices) - 1

    for ei, en_idx in enumerate(en_name_indices):
        name_en = content_lines[en_idx]
        name = ""
        title = ""

        # 이름: 영어이름 바로 위
        for k in range(en_idx - 1, -1, -1):
            if content_lines[k]:
                name = content_lines[k]
                break

        # 타이틀: 이름 위 (속성 줄은 타이틀로 사용하지 않음)
        name_line_idx = en_idx - 1
        attr_pattern = re.compile(r'^(종족|동족|능력|거처|직업|위험도):?\s*')
        for k in range(name_line_idx - 1, -1, -1):
            if content_lines[k]:
                # 이전 캐릭터 영어이름 아래가 아닌지 확인
                if ei > 0 and k <= en_name_indices[ei - 1]:
                    break
                # 속성 줄은 타이틀로 사용하지 않음
                if attr_pattern.match(content_lines[k]):
                    continue
                title = content_lines[k]
                break

        if not title:
            title = inline_title or first_line

        # 속성: 이 캐릭터의 영어이름부터 다음 캐릭터 시작 전까지
        next_start = en_name_indices[ei + 1] if ei < is_last_idx else len(content_lines)
        attrs = {}
        desc_lines = []
        attr_done = False
        is_last = (ei == is_last_idx)

        for cl in content_lines[en_idx + 1 : next_start]:
            if not cl:
                if attrs and not attr_done:
                    attr_done = True
                continue
            attr_match = re.match(
                r'^(종족|동족|능력|거처|직업|위험도):?\s*(.+)$', cl
            )
            if attr_match and not attr_done:
                attrs[attr_match.group(1)] = attr_match.group(2).strip()
            elif is_last:
                attr_done = True
                desc_lines.append(cl)

        # 마지막 캐릭터는 다음 섹션까지 설명 계속 파싱
        if is_last and next_start == len(content_lines):
            pass  # 위 루프에서 이미 전부 처리됨

        if not name:
            continue

        description = "\n".join(desc_lines).strip()
        description = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", description)
        description = re.sub(r"원본 주소.*$", "", description, flags=re.DOTALL).strip()

        characters.append({
            "title": title,
            "name": name,
            "name_en": name_en,
            "ability": attrs.get("능력", ""),
            "species": attrs.get("종족", attrs.get("동족", "")),
            "location": attrs.get("거처", ""),
            "description": description,
        })

    return characters


def name_to_filename(name: str, name_en: str = "") -> str:
    """캐릭터 이름을 영어 파일명으로 변환"""
    if name in CHARACTER_NAME_MAP:
        return CHARACTER_NAME_MAP[name]
    if name_en:
        fn = name_en.lower().strip()
        fn = re.sub(r"['\s]+", "_", fn)
        fn = re.sub(r"[^a-z0-9_]", "", fn)
        fn = re.sub(r"_+", "_", fn).strip("_")
        return fn
    return ""


def extract_char_preserved_meta(content: str) -> dict:
    """기존 캐릭터 MDX에서 수동 추가된 메타데이터 추출 (image, nameJa, themeColor 등)"""
    meta = {}
    # import <var> from '@site/static/img/...'
    img_match = re.search(r"import (\w+) from '@site/static/img/([^']+)'", content)
    if img_match:
        meta["image_var"] = img_match.group(1)
        meta["image_path"] = img_match.group(2)
    # nameJa="..."
    name_ja = re.search(r'nameJa="([^"]*)"', content)
    if name_ja:
        meta["nameJa"] = name_ja.group(1)
    # themeColor="..."
    theme = re.search(r'themeColor="([^"]*)"', content)
    if theme:
        meta["themeColor"] = theme.group(1)
    return meta


def generate_character_mdx(game_code: str, char: dict, position: int,
                            source_file: str = "omake.txt",
                            preserved=None) -> str:
    """캐릭터 정보 → character MDX 문자열"""
    _, _, kr_name, _ = GAMES[game_code]
    thpatch_url = f"https://www.thpatch.net/wiki/{game_code}/{source_file}/ko"
    source_label = source_file.replace(".txt", "").replace("_", " ").title()
    if preserved is None:
        preserved = {}

    name = char["name"]
    name_en = char.get("name_en", "")
    title_text = char.get("title", "")
    ability = char.get("ability", "")
    species = char.get("species", "")
    description = char.get("description", "")

    image_path = preserved.get("image_path", "")
    image_var = preserved.get("image_var", "")
    name_ja = preserved.get("nameJa", "")
    theme_color = preserved.get("themeColor", "")

    # 헤더 구성
    header_parts = [name]
    if name_en:
        header_parts.append(f"({name_en})")

    lines = [
        "---",
        f'sidebar_position: {position}',
        f'title: "{escape_mdx(name)}"',
        f'description: "{escape_mdx(kr_name)}의 캐릭터"',
        "---",
        "",
        "import { CharacterProfile } from '@site/src/components/v3';",
    ]
    if image_path and image_var:
        lines.append(f"import {image_var} from '@site/static/img/{image_path}';")
    lines += [
        "",
        ":::info",
        f"데이터 출처: [Touhou Patch Center — {game_code}/{source_label}]({thpatch_url}).\\",
        "원문은 CC BY-SA 4.0을 따르며, 동일한 라이선스로 재배포했습니다.",
        ":::",
        "",
        f"## {' '.join(header_parts)}",
        "",
    ]

    # CharacterProfile 속성
    profile_attrs = [f'name="{escape_mdx(name)}"']
    if name_ja:
        profile_attrs.append(f'nameJa="{escape_mdx(name_ja)}"')
    if name_en:
        profile_attrs.append(f'nameEn="{escape_mdx(name_en)}"')
    if ability:
        profile_attrs.append(f'ability="{escape_mdx(ability)}"')
    if title_text:
        profile_attrs.append(f'title="{escape_mdx(title_text)}"')
    if species:
        profile_attrs.append(f'species="{escape_mdx(species)}"')
    if theme_color:
        profile_attrs.append(f'themeColor="{theme_color}"')
    if image_path and image_var:
        profile_attrs.append(f'image={{{image_var}}}')

    attr_str = "\n  ".join(profile_attrs)
    lines.append(f"<CharacterProfile\n  {attr_str}\n>")

    # 설명 텍스트 (단락별)
    if description:
        paragraphs = re.split(r"\n{2,}", description)
        for p_idx, para in enumerate(paragraphs):
            escaped = escape_mdx(para.strip())
            # 줄바꿈 보존
            escaped = escaped.replace("\n", "\\\n")
            lines.append(f"  {escaped}")
            if p_idx < len(paragraphs) - 1:
                lines.append("")

    lines.append("</CharacterProfile>")
    lines.append("")

    return "\n".join(lines)


def process_character(game_code: str, dry_run: bool = False) -> bool:
    """특정 게임의 캐릭터 MDX 생성"""
    if game_code not in GAMES:
        print(f"  [SKIP] {game_code}: 알 수 없는 게임 코드")
        return False

    characters, source_file = parse_characters(game_code)
    if not characters:
        print(f"  [SKIP] {game_code}: omake.txt/ko.md에 캐릭터 정보 없음")
        return False

    if dry_run:
        print(f"  [DRY-RUN] {game_code}: {len(characters)}명")
        for c in characters:
            print(f"    - {c['name']} ({c.get('name_en', '')})")
        return True

    game_dir = ensure_game_dir(game_code)
    char_dir = game_dir / "characters"
    char_dir.mkdir(exist_ok=True)

    # _category_.json
    cat = {"label": "캐릭터", "position": 2}
    with open(char_dir / "_category_.json", "w", encoding="utf-8") as f:
        json.dump(cat, f, ensure_ascii=False, indent=2)

    count = 0
    for i, char in enumerate(characters):
        filename = name_to_filename(char["name"], char.get("name_en", ""))
        if not filename:
            print(f"    [WARN] {game_code}: 파일명 변환 실패 - {char['name']}")
            continue

        out_path = char_dir / f"{filename}.mdx"
        # 기존 파일에서 수동 추가된 메타데이터(image, nameJa, themeColor) 보존
        preserved = {}
        if out_path.exists():
            preserved = extract_char_preserved_meta(out_path.read_text(encoding="utf-8"))
        mdx = generate_character_mdx(game_code, char, i + 1, source_file, preserved)
        out_path.write_text(mdx, encoding="utf-8")
        count += 1

    # 동반 캐릭터 파일 정리 (이전에 생성된 stale 파일 삭제)
    for companion_name in CHARACTER_COMPANION_MAP:
        companion_fn = name_to_filename(companion_name)
        if companion_fn:
            stale_path = char_dir / f"{companion_fn}.mdx"
            if stale_path.exists():
                stale_path.unlink()
                print(f"    [CLEAN] 동반 캐릭터 파일 삭제: {stale_path.name}")

    print(f"  [OK] {game_code}: {count}명 → {char_dir.relative_to(ROOT)}")
    return True


# ========== 대사집 파서 ==========

# 폴더명 → (타입, 한글 라벨) 매핑
DIALOGUE_FOLDER_MAP = {
    # 표준 캐릭터별 시나리오/엔딩/엑스트라/승리대사
    "_s_Scenario": ("scenario", "시나리오"),
    "_s_Endings": ("endings", "엔딩"),
    "_s_Ending": ("endings", "엔딩"),
    "_s_Script": ("script", "스크립트"),
    "_s_Extra": ("extra", "엑스트라"),
    "_s_Extra_and_Phantasm": ("extra-phantasm", "엑스트라 & 판타즘"),
    "_s_Win_Quotes": ("win-quotes", "승리 대사"),
    "_s_Scenario_-_Spell_cards": ("spell-cards", "스펠카드"),
    # 루트 기반 (Th128)
    "Route_A": ("route-a", "루트 A"),
    "Route_B": ("route-b", "루트 B"),
    "Route_C": ("route-c", "루트 C"),
    "Endings": ("endings", "엔딩"),
    "Extra": ("extra", "엑스트라"),
    # 단일 대화 파일 (Th143, Th165, Th185)
    "Dialog": ("dialog", "대화"),
    # 미션 코멘트 (Th095, Th125)
    "Aya_s_mission_comments": ("aya-comments", "아야의 미션 코멘트"),
    "Hatate_s_mission_comments": ("hatate-comments", "하타테의 미션 코멘트"),
    # 특수
    "Greedy_Trial": ("greedy-trial", "강욕의 시련"),
    "Spoiler_Stage": ("spoiler-stage", "스포일러 스테이지"),
    "Dream_comments": ("dream-comments", "꿈 코멘트"),
    "Day_descriptions": ("day-descriptions", "일지"),
    "Market_comments": ("market-comments", "시장 코멘트"),
    "Hints": ("hints", "힌트"),
}

# Th08 팀별 좌측 화자 설정 (두 캐릭터 모두 left 정렬)
TH08_TEAM_LEFT_SPEAKERS: dict[str, set[str]] = {
    "Boundary_Team": {"레이무", "하쿠레이 레이무", "유카리", "야쿠모 유카리"},
    "Scarlet_Team": {"레밀리아", "레밀리아 스칼렛", "사쿠야", "이자요이 사쿠야"},
    "Ghost_Team": {"요우무", "콘파쿠 요우무", "유유코", "사이교우지 유유코"},
    "Magic_Team": {"마리사", "키리사메 마리사", "앨리스", "앨리스 마가트로이드"},
}


def discover_dialogue_files(game_code: str) -> list[dict]:
    """게임 폴더에서 대사집 파일 발견"""
    game_path = THPATCH / game_code
    if not game_path.exists():
        return []

    results = []
    for folder in sorted(game_path.iterdir()):
        if not folder.is_dir():
            continue
        ko_md = folder / "ko.md"
        if not ko_md.exists():
            continue

        folder_name = folder.name
        # 건너뛸 폴더
        if folder_name in ("Music", "Spell_cards", "omake.txt", "Images",
                           "Images-SpellCard", "index", "Nut_strings",
                           "Trophies", "Help_messages", "Abilities"):
            continue

        # 캐릭터별 시나리오/엔딩/엑스트라/승리대사 패턴 (Character_s_Scenario 등)
        char_match = re.match(
            r"^(.+?)(_s_(?:Scenario_-_Spell_cards|Extra_and_Phantasm|Win_Quotes|Scenario|Endings|Ending|Script|Extra))$",
            folder_name
        )
        if char_match:
            char_name = char_match.group(1).replace("_", " ")
            suffix = char_match.group(2)
            dtype, label = DIALOGUE_FOLDER_MAP.get(suffix, ("unknown", folder_name))
            results.append({
                "path": ko_md,
                "folder": folder_name,
                "character": char_name,
                "type": dtype,
                "label": label,
            })
            continue

        # Th20 스타일: Reimu_Red_Scenario
        th20_scenario_match = re.match(r"^(.+?)_(Red|Blue|Yellow|Green)_Scenario$", folder_name)
        if th20_scenario_match:
            char_name = th20_scenario_match.group(1).replace("_", " ")
            color = th20_scenario_match.group(2)
            results.append({
                "path": ko_md,
                "folder": folder_name,
                "character": char_name,
                "type": f"{color.lower()}-scenario",
                "label": f"{color} 시나리오",
            })
            continue

        # Th20 스타일: Reimu_Scarlet_Devil_Extra
        th20_extra_match = re.match(r"^(.+?)_(.+)_Extra$", folder_name)
        if th20_extra_match:
            char_name = th20_extra_match.group(1).replace("_", " ")
            desc = th20_extra_match.group(2).replace("_", " ")
            results.append({
                "path": ko_md,
                "folder": folder_name,
                "character": char_name,
                "type": f"{desc.lower().replace('_', '-').replace(' ', '-')}-extra",
                "label": f"{desc.replace('_', ' ')} 엑스트라",
            })
            continue

        # 직접 매핑
        if folder_name in DIALOGUE_FOLDER_MAP:
            dtype, label = DIALOGUE_FOLDER_MAP[folder_name]
            results.append({
                "path": ko_md,
                "folder": folder_name,
                "character": None,
                "type": dtype,
                "label": label,
            })

    return results


def parse_dialogue_table(raw: str) -> list[dict]:
    """테이블 형식의 대사 ko.md 파싱 → 섹션별 대사 리스트"""
    content = clean_wiki_content(raw)

    # 목차 제거
    content = re.sub(r"## 목차\s*\n(?:\s*\*[^\n]*\n)*", "", content)
    # Gnome 에디트 아이콘 테이블 제거
    content = re.sub(r"\|[^\|]*Gnome[^\|]*\|[^\|]*\|\s*\n", "", content)
    # 구분선 테이블 제거
    content = re.sub(r"\|\s*---\s*\|\s*---\s*\|\s*\n", "", content)
    # From URL 라인 제거
    content = re.sub(r"^From\s*<https?://[^>]+>\s*$", "", content, flags=re.MULTILINE)
    # 원본 주소 이후 모든 내용 제거
    content = re.sub(r"원본 주소.*$", "", content, flags=re.DOTALL)

    sections = []
    current_section = None
    current_entries = []

    last_speaker = None
    in_quote = False

    for line in content.split("\n"):
        line = line.strip()

        # 섹션 헤더 (## 스테이지 1, ## 1일째 등)
        section_match = re.match(r"^#{1,4}\s+(.+)$", line)
        if section_match:
            if current_section is not None and current_entries:
                sections.append({"title": current_section, "entries": current_entries})
            current_section = section_match.group(1).strip()
            current_entries = []
            last_speaker = None
            in_quote = False
            continue

        # 테이블 행 파싱
        if not line.startswith("|"):
            continue

        cells = [c.strip() for c in line.split("|")]
        cells = [c for c in cells if c is not None]
        # 앞뒤 빈 셀 제거
        if cells and cells[0] == "":
            cells = cells[1:]
        if cells and cells[-1] == "":
            cells = cells[:-1]

        if len(cells) < 2:
            # 단일 셀: 헤더 구분선 등
            continue

        speaker = cells[0].strip()
        text = cells[1].strip() if len(cells) > 1 else ""

        # 구분선 행 건너뛰기
        if speaker == "---" or text == "---":
            continue

        # 타임스탬프 제거 (`N` 단순 숫자 및 `#N@M` 패턴)
        text = re.sub(r"`#?\d+(?:@\d+)?`\s*", "", text)

        # 전각공백 → 일반 공백 (게임 텍스트박스 강제줄바꿈 아티팩트 제거)
        text = re.sub(r'　+', ' ', text)
        # 연속 공백 정리
        text = re.sub(r'  +', ' ', text).strip()

        # <l$> → 줄바꿈
        text = re.sub(r'\s*<l\$>\s*', '\n', text)

        # <c$...$> → 엔딩 마커 (액션으로 처리)
        c_markers = re.findall(r'<c\$(.+?)\$>', text)
        if c_markers:
            text = re.sub(r'\s*<c\$.+?\$>\s*', '', text).strip()
            for marker in c_markers:
                current_entries.append({"type": "action", "text": marker.strip()})
            if not text:
                continue

        # <tl$화자:> 태그에서 speaker 추출 (엔딩 포맷)
        if not speaker:
            tl_match = re.match(r'<tl\$([^:]+):>\s*(.*)', text, re.DOTALL)
            if tl_match:
                speaker = tl_match.group(1).strip()
                text = tl_match.group(2).strip()
                if speaker == "??":
                    speaker = "???"
                # 감싸는 따옴표 제거
                if text.startswith('"') and text.endswith('"'):
                    text = text[1:-1]

        # 빈 텍스트 건너뛰기
        if not text and not speaker:
            continue

        # 음악 표시 (♪)
        if text.startswith("♪"):
            music_name = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", text)
            current_entries.append({"type": "action", "text": music_name})
            continue

        # 특수 태그
        if text in ("<Boss title>", "<Stage selection>"):
            continue

        # ⧼main_N⧽ 패턴 (스테이지 장소)
        if re.match(r"⧼.*?⧽", text):
            continue

        # 화자가 없는 경우
        if not speaker and text:
            # continuation check
            if last_speaker and in_quote:
                current_entries.append({
                    "type": "dialogue",
                    "speaker": last_speaker,
                    "text": text,
                })
                if text.endswith('"') or text.endswith('」'):
                    in_quote = False
                continue

            # 빙의화(Th155) 스타일: "이름: 대사 이름2: 대사2" (화자열 비어있고 이름:으로 시작)
            if re.match(r'^[가-힣]{1,10}:\s*.+', text):
                seg_matches = list(re.finditer(r'([가-힣]{1,10}):', text))
                if seg_matches and seg_matches[0].start() == 0:
                    for si, sm in enumerate(seg_matches):
                        seg_end = seg_matches[si + 1].start() if si + 1 < len(seg_matches) else len(text)
                        seg_text = text[sm.end():seg_end].strip()
                        if seg_text:
                            current_entries.append({
                                "type": "dialogue",
                                "speaker": sm.group(1),
                                "text": seg_text,
                            })
                    continue

            # Inline speaker check (Th105/Th123 style)
            if "@" in text or re.match(r"^([^\"「]{1,15}?)\s+[\"「]", text):
                parts = text.split("@") if "@" in text else [text]
                for part in parts:
                    part = part.strip()
                    if not part: continue
                    
                    # continuation check for parts
                    if last_speaker and in_quote:
                        current_entries.append({
                            "type": "dialogue",
                            "speaker": last_speaker,
                            "text": part,
                        })
                        if part.endswith('"') or part.endswith('」'):
                            in_quote = False
                        continue

                    # 이름 1~15자 (공백포함가능), 그 뒤에 따옴표 시작
                    m = re.match(r"^([^\"「]{1,15}?)\s+([\"「].*)$", part)
                    if m:
                        spk = m.group(1).strip()
                        txt = m.group(2)
                        current_entries.append({
                            "type": "dialogue",
                            "speaker": spk,
                            "text": txt,
                        })
                        last_speaker = spk
                        in_quote = not (txt.endswith('"') or txt.endswith('」'))
                    else:
                        current_entries.append({"type": "action", "text": part})
                continue

            # 장소 표시 (「...」로 시작하는 액션)
            if text.startswith("「") and text.endswith("」"):
                current_entries.append({"type": "action", "text": text})
                continue

            # 일반 액션
            current_entries.append({"type": "action", "text": text})
            continue

        # 화자가 있는 경우
        if speaker:
            current_entries.append({
                "type": "dialogue",
                "speaker": speaker,
                "text": text,
            })
            last_speaker = speaker
            if text.startswith('"') or text.startswith('「'):
                in_quote = not (text.endswith('"') or text.endswith('」'))
            else:
                in_quote = False
            continue

    # 마지막 섹션 추가
    if current_section is not None and current_entries:
        sections.append({"title": current_section, "entries": current_entries})
    elif current_entries:
        sections.append({"title": "대화", "entries": current_entries})

    return sections


def generate_dialogue_mdx(game_code: str, file_info: dict, sections: list[dict],
                          position: int) -> str:
    """대사 섹션 → dialogue MDX 문자열"""
    _, _, kr_name, _ = GAMES[game_code]

    # 제목 구성
    if file_info["character"]:
        char_display = file_info.get("kr_name") or file_info["character"]
        title = f"{char_display} {file_info['label']}"
    else:
        title = file_info["label"]

    # thpatch URL
    folder = file_info["folder"]
    # _s_ (possessive 's) → %27s_ for wiki URL
    wiki_folder = re.sub(r'_s_', '%27s_', folder, count=1)
    thpatch_url = f"https://www.thpatch.net/wiki/{game_code}/{wiki_folder}/ko"

    lines = [
        "---",
        f'title: "{escape_mdx(title)}"',
        f"sidebar_position: {position}",
        "---",
        "",
        "import Dialogue from '@site/src/components/v3/Dialogue';",
        "import Action from '@site/src/components/v3/Action';",
        "import ScenarioStage from '@site/src/components/v3/ScenarioStage';",
        "",
        ":::info",
        f"데이터 출처: [Touhou Patch Center — {game_code}/{folder.replace('_', ' ')}]({thpatch_url}).\\",
        "원문은 CC BY-SA 4.0을 따르며, 동일한 라이선스로 재배포했습니다.",
        ":::",
        "",
    ]

    # 화자 목록 추출 (align 결정용)
    all_speakers = set()
    for section in sections:
        for entry in section["entries"]:
            if entry["type"] == "dialogue":
                all_speakers.add(entry["speaker"])

    protagonist = None
    target_char = file_info.get("character")
    if target_char:
        char_slug = target_char.lower().replace(" ", "_").replace("'", "")
        # A/B/C 타입 접미사 제거 (예: "marisa_a" → "marisa")
        char_slug_base = re.sub(r'_[abc]$', '', char_slug)
        for spk in all_speakers:
            avatar_id = get_avatar_id(spk)
            # avatar_id ("marisa_kirisame") 와 char_slug ("marisa") 매칭
            if avatar_id and (char_slug in avatar_id or char_slug_base in avatar_id):
                protagonist = spk
                break
            if char_slug in spk.lower() or char_slug_base in spk.lower():
                protagonist = spk
                break

    if not protagonist:
        for section in sections:
            for entry in section["entries"]:
                if entry["type"] == "dialogue":
                    protagonist = entry["speaker"]
                    break
            if protagonist:
                break

    # Th08: 팀 기반 좌측 화자 집합 결정 (두 팀원 모두 left)
    left_speakers_set: set[str] = {protagonist} if protagonist else set()
    if game_code == "Th08":
        folder = file_info.get("folder", "")
        for team_key, team_speakers in TH08_TEAM_LEFT_SPEAKERS.items():
            if team_key in folder:
                left_speakers_set = team_speakers
                break

    for section in sections:
        section_title = escape_mdx(section["title"])
        lines.append(f'## {section_title}')
        lines.append("")
        lines.append(f'<ScenarioStage title="{section_title}">')

        for entry in section["entries"]:
            if entry["type"] == "action":
                text = escape_mdx(entry["text"])
                lines.append(f"  <Action>{text}</Action>")
            elif entry["type"] == "dialogue":
                speaker = entry["speaker"]
                text = escape_mdx(entry["text"])
                align = "left" if speaker in left_speakers_set else "right"
                avatar_id = get_avatar_id(speaker)
                avatar_attr = f' avatar="{avatar_id}"' if avatar_id else ""
                lines.append(
                    f'  <Dialogue speaker="{escape_mdx(speaker)}" align="{align}"{avatar_attr}>'
                )
                lines.append(f"    {text}")
                lines.append("  </Dialogue>")

        lines.append("</ScenarioStage>")
        lines.append("")

    return "\n".join(lines)


def parse_index_dialogue_order(game_code: str) -> list[str]:
    """index/en.md에서 대사 파일 링크를 파싱하여 캐릭터 slug 순서 반환"""
    index_path = THPATCH / game_code / "index" / "en.md"
    if not index_path.exists():
        return []

    raw = index_path.read_text(encoding="utf-8")

    # Translatable content 섹션 이후만 파싱
    tc_start = raw.find("## Translatable content")
    if tc_start >= 0:
        raw = raw[tc_start:]

    # 대사 관련 링크에서 캐릭터 slug 추출
    DIALOGUE_SUFFIXES = [
        "Extra_and_Phantasm", "Extra", "Endings", "Scenario", "Win_Quotes",
        "Script", "Intro", "Spell_cards",
    ]
    seen: list[str] = []
    seen_set: set[str] = set()

    for m in re.finditer(r'\[([^\]]+)\]\(/wiki/(?:Special:MyLanguage/)?[a-zA-Z0-9]+/([^)"#\s]+)', raw):
        path = m.group(2).replace("%27", "'").replace("%20", " ")
        # 대사 관련 경로인지 확인
        if not any(path.endswith(s) or f"_{s}" in path or f"'{s}" in path for s in DIALOGUE_SUFFIXES):
            continue
        # 캐릭터명 추출: 접미사 및 변형 제거
        char_part = path
        for suf in sorted(DIALOGUE_SUFFIXES, key=len, reverse=True):
            char_part = re.sub(rf"[_']s?_{suf}.*$", "", char_part)
            char_part = re.sub(rf"_{suf}.*$", "", char_part)
        # 슬러그 정규화
        slug = char_part.strip("_'").lower().replace("'", "").replace(" ", "_")
        if slug and slug not in seen_set:
            seen.append(slug)
            seen_set.add(slug)

    return seen


def process_dialogue(game_code: str, dry_run: bool = False) -> bool:
    """특정 게임의 대사집 MDX 생성"""
    if game_code not in GAMES:
        print(f"  [SKIP] {game_code}: 알 수 없는 게임 코드")
        return False

    dialogue_files = discover_dialogue_files(game_code)
    if not dialogue_files:
        print(f"  [SKIP] {game_code}: 대사 파일 없음")
        return False

    if dry_run:
        print(f"  [DRY-RUN] {game_code}: {len(dialogue_files)}개 파일")
        for f in dialogue_files:
            char = f["character"] or "(공통)"
            print(f"    - {char} / {f['type']} ({f['label']})")
        return True

    game_dir = ensure_game_dir(game_code)
    dialogue_dir = game_dir / "dialogue"
    dialogue_dir.mkdir(exist_ok=True)

    # _category_.json
    cat = {"label": "대사집", "position": 3}
    with open(dialogue_dir / "_category_.json", "w", encoding="utf-8") as f:
        json.dump(cat, f, ensure_ascii=False, indent=2)

    # 캐릭터별 그룹핑 (A/B/C 타입은 기본 캐릭터로 병합)
    char_groups = {}
    non_char_files = []
    for fi in dialogue_files:
        if fi["character"]:
            char = fi["character"]
            # "Marisa A" → 그룹키 "Marisa", "Marisa" → 그룹키 "Marisa"
            base_char = re.sub(r'\s+[ABC]$', '', char)
            if base_char not in char_groups:
                char_groups[base_char] = []
            char_groups[base_char].append(fi)
        else:
            non_char_files.append(fi)

    # index/en.md에서 캐릭터 순서 파싱
    index_order = parse_index_dialogue_order(game_code)

    def char_sort_key(char_name: str) -> int:
        slug = char_name.lower().replace("'", "").replace(" ", "_")
        try:
            return index_order.index(slug)
        except ValueError:
            return len(index_order)  # 인덱스에 없으면 마지막

    count = 0
    position = 1

    # 캐릭터별 대사 (캐릭터 폴더 구조) - index 파일 순서로 정렬
    for char_name, files in sorted(char_groups.items(), key=lambda x: char_sort_key(x[0])):
        char_slug = char_name.lower().replace(" ", "_").replace("'", "")
        # 캐릭터명 한글화 시도 (카테고리 라벨용 - 기본 이름만)
        kr_char_name = char_name
        # CHARACTER_NAME_MAP에서 찾기
        for kn, en in CHARACTER_NAME_MAP.items():
            en_parts = en.split("_")
            if en == char_slug or en_parts[0] == char_slug or en_parts[-1] == char_slug:
                kr_char_name = kn
                break

        # 파일별 한글 표시명 추출 (A/B/C 타입별 개별 이름)
        for fi in files:
            raw = fi["path"].read_text(encoding="utf-8")
            title_match = re.search(r"title:\s*\"([^\"]+)\"", raw)
            if title_match:
                t = title_match.group(1)
                name_match = re.search(r"/(.+?)(?:\s+스토리|\s+엔딩|\s+승리 대사|\s+엑스트라|\s+시나리오|\s+스크립트|\s+스펠카드|\s+레드|\s+블루|\s+옐로우|\s+그린)", t)
                if name_match:
                    fi["_kr_display"] = name_match.group(1).strip()
                    # 카테고리 라벨에는 변형이 아닌 기본 이름 사용
                    if not re.search(r'\s+[ABC]$', fi["character"]):
                        kr_char_name = fi["_kr_display"]

        # 캐릭터별 폴더 생성
        char_dir = dialogue_dir / char_slug
        char_dir.mkdir(exist_ok=True)

        char_cat = {"label": kr_char_name, "position": position}
        with open(char_dir / "_category_.json", "w", encoding="utf-8") as f:
            json.dump(char_cat, f, ensure_ascii=False, indent=2)

        type_positions = {
            "scenario": 1,
            "red-scenario": 1, "blue-scenario": 2, "yellow-scenario": 3, "green-scenario": 4,
            "endings": 10,
            "script": 20,
            "extra": 30,
            "extra-phantasm": 31,
            "win-quotes": 40,
            "spell-cards": 50,
        }

        for fi in files:
            fi["kr_name"] = fi.get("_kr_display", kr_char_name)
            raw = fi["path"].read_text(encoding="utf-8")
            sections = parse_dialogue_table(raw)
            if not sections:
                print(f"    [WARN] {game_code}: 대사 파싱 실패 - {fi['folder']}")
                continue

            sub_pos = type_positions.get(fi["type"], 50)
            # A/B/C 타입이면 position에 오프셋 추가 (A=0, B=1, C=2)
            variant_match = re.search(r'\s+([ABC])$', fi["character"])
            if variant_match:
                variant_offset = ord(variant_match.group(1)) - ord('A')
                sub_pos = sub_pos + variant_offset
            mdx = generate_dialogue_mdx(game_code, fi, sections, sub_pos)

            # 파일명은 원래 캐릭터명 사용 (Marisa A → marisa_a)
            file_slug = fi["character"].lower().replace(" ", "_").replace("'", "")
            filename = f"{file_slug}-{fi['type']}.mdx"
            out_path = char_dir / filename
            out_path.write_text(mdx, encoding="utf-8")
            count += 1

        position += 1

    # 비캐릭터 대사 파일 (Dialog, Route 등)
    for fi in non_char_files:
        raw = fi["path"].read_text(encoding="utf-8")
        sections = parse_dialogue_table(raw)
        if not sections:
            print(f"    [WARN] {game_code}: 대사 파싱 실패 - {fi['folder']}")
            continue

        mdx = generate_dialogue_mdx(game_code, fi, sections, position)

        filename = f"{fi['type']}.mdx"
        out_path = dialogue_dir / filename
        out_path.write_text(mdx, encoding="utf-8")
        count += 1
        position += 1

    # overview.mdx 생성
    overview_lines = [
        "---",
        'title: "대사집"',
        "sidebar_position: 1",
        "---",
        "",
        f"# {GAMES[game_code][2]} 대사집",
        "",
        "아래 목록에서 확인하고 싶은 대사를 선택하세요.",
        "",
    ]
    out_path = dialogue_dir / "overview.mdx"
    out_path.write_text("\n".join(overview_lines), encoding="utf-8")

    print(f"  [OK] {game_code}: {count}개 대사 파일 → {dialogue_dir.relative_to(ROOT)}")
    return True


# ========== CLI ==========

def get_game_codes(target: str) -> list[str]:
    """'all' 또는 특정 게임 코드 → 게임 코드 리스트"""
    if target.lower() == "all":
        return list(GAMES.keys())
    # 대소문자 유연 처리: th06 → Th06
    normalized = "Th" + target.lower().replace("th", "")
    if normalized in GAMES:
        return [normalized]
    # 원본도 시도
    if target in GAMES:
        return [target]
    print(f"Error: 알 수 없는 게임 코드 '{target}'")
    print(f"사용 가능: {', '.join(GAMES.keys())}")
    sys.exit(1)


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    command = sys.argv[1].lower()
    dry_run = "--dry-run" in sys.argv

    if command == "all":
        # 전체: music + spellcard + character + dialogue
        print("=== 뮤직룸 전체 생성 ===")
        for code in sorted(GAMES.keys()):
            process_music(code, dry_run)
        print("\n=== 스펠카드 전체 생성 ===")
        for code in sorted(GAMES.keys()):
            process_spellcard(code, dry_run)
        print("\n=== 캐릭터 전체 생성 ===")
        for code in sorted(GAMES.keys()):
            process_character(code, dry_run)
        print("\n=== 대사집 전체 생성 ===")
        for code in sorted(GAMES.keys()):
            process_dialogue(code, dry_run)
        return

    if len(sys.argv) < 3:
        print(f"Error: 게임 코드 필요 (예: python generate-v3.py {command} th06)")
        sys.exit(1)

    target = sys.argv[2]
    codes = get_game_codes(target)

    if command == "music":
        print(f"=== 뮤직룸 생성 ===")
        for code in codes:
            process_music(code, dry_run)
    elif command in ("spellcard", "spell-card", "spell_card"):
        print(f"=== 스펠카드 생성 ===")
        for code in codes:
            process_spellcard(code, dry_run)
    elif command in ("character", "char"):
        print(f"=== 캐릭터 생성 ===")
        for code in codes:
            process_character(code, dry_run)
    elif command in ("dialogue", "dialog"):
        print(f"=== 대사집 생성 ===")
        for code in codes:
            process_dialogue(code, dry_run)
    else:
        print(f"Error: 알 수 없는 명령어 '{command}'")
        print("사용 가능: music, spellcard, character, dialogue, all")
        sys.exit(1)


if __name__ == "__main__":
    main()
