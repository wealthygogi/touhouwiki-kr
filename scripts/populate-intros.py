#!/usr/bin/env python3
"""
Populate intro.mdx files with actual game information.
Replaces the "게임 소개 준비 중" placeholder with real content.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
DOCS_V3 = ROOT / "docs/v3"

# Game data: (v3_path, game_code, japanese_title, release_date, genre, story, features)
GAMES = {
    "shooting_game/the-embodiment-of-scarlet-devil": {
        "code": "Th06",
        "kr_title": "동방홍마향",
        "ja_title": "東方紅魔郷 ～ the Embodiment of Scarlet Devil",
        "release": "2002년 8월 11일",
        "genre": "탄막 슈팅",
        "story": (
            "환상향에 갑작스럽게 붉은 안개가 깔리기 시작했다. "
            "태양빛을 차단하는 이 안개는 요괴들에겐 쾌적하지만 인간들에겐 위협이 된다.\n\n"
            "하쿠레이 레이무와 키리사메 마리사는 이변의 근원을 찾아 나선다. "
            "안개의 출처는 호수 한가운데 우뚝 선 스칼렛 디빌 맨션, "
            "그리고 그곳에 사는 흡혈귀 레밀리아 스칼렛이었다."
        ),
        "features": [
            "동방 프로젝트 윈도우 이식작 첫 번째 작품",
            "레이무·마리사 두 캐릭터 선택",
            "초탄부터 9단계의 그레이즈 시스템",
        ],
    },
    "shooting_game/perfect-cherry-blossom": {
        "code": "Th07",
        "kr_title": "동방요요몽",
        "ja_title": "東方妖々夢 ～ Perfect Cherry Blossom",
        "release": "2003년 8월 17일",
        "genre": "탄막 슈팅",
        "story": (
            "봄이 왔는데도 벚꽃이 피지 않는다. 아니, 봄이 어딘가로 사라져버렸다. "
            "환상향에서 봄기운이 느껴지지 않아 레이무·마리사·사쿠야가 조사에 나선다.\n\n"
            "봄을 모으고 있던 범인은 명계 백옥루의 주인 사이교지 유유코. "
            "그녀는 봄의 기운을 집결시켜 사이교 아야카시 아래 봉인된 시신을 부활시키려 하고 있었다."
        ),
        "features": [
            "레이무·마리사·사쿠야 세 캐릭터, 각각 두 가지 샷 타입",
            "체리 포인트와 체리 맥스 게이지 시스템 추가",
            "엑스트라+판타즘 두 단계의 숨겨진 스테이지",
        ],
    },
    "shooting_game/imperishable-night": {
        "code": "Th08",
        "kr_title": "동방영야초",
        "ja_title": "東方永夜抄 ～ Imperishable Night",
        "release": "2004년 8월 15일",
        "genre": "탄막 슈팅",
        "story": (
            "보름달 밤, 달이 사라지고 가짜 달로 교체되었다. "
            "날이 밝기 전까지 진짜 달을 되찾지 않으면 시간이 멈춘 채 이변이 계속된다.\n\n"
            "인간과 요괴가 힘을 합친 네 팀이 밤을 달리며 용의자를 추적한다. "
            "달을 숨긴 것은 요괴의 현인 야쿠모 유카리가 아닌, "
            "달에서 도망쳐 지상에 숨어든 호라이산 카구야를 감추기 위한 야고코로 에이린의 결단이었다."
        ),
        "features": [
            "인간+요괴 4팀(8캐릭터) 중 선택",
            "시간 제한 시스템 — 인간 캐릭터로 보스 처치 시 추가 시간 획득",
            "히든 스테이지 '단야 루트' 포함 8개 엔딩",
        ],
    },
    "shooting_game/phantasmagoria-of-flower-view": {
        "code": "Th09",
        "kr_title": "동방화영총",
        "ja_title": "東方花映塚 ～ Phantasmagoria of Flower View",
        "release": "2005년 8월 14일",
        "genre": "탄막 슈팅 (1vs1 대전)",
        "story": (
            "60년에 한 번 찾아와야 할 백 년의 꽃이 환상향 전역에서 한꺼번에 피어났다. "
            "명계에서 넘쳐난 사령들이 꽃에 깃들어 이변이 일어난 것이다.\n\n"
            "삼도천의 뱃사공 오노즈카 코마치가 심판 에이키의 눈을 피해 게으름을 피우며 "
            "사령을 처리하지 않아 명계에 사령이 넘쳐났음이 밝혀진다."
        ),
        "features": [
            "화면 분할 1vs1 대전 방식 (동방 시리즈 최초)",
            "16명의 플레이어블 캐릭터",
            "CPU 및 2P 대전 지원",
        ],
    },
    "shooting_game/mountain-of-faith": {
        "code": "Th10",
        "kr_title": "동방풍신록",
        "ja_title": "東方風神録 ～ Mountain of Faith",
        "release": "2007년 8월 17일",
        "genre": "탄막 슈팅",
        "story": (
            "하쿠레이 신사에 사자가 찾아와 신사를 폐쇄하고 양보하라고 통보한다. "
            "요카이 산에 외부 세계에서 흘러온 새로운 신사 '모리야 신사'가 자리 잡은 것이다.\n\n"
            "야사카 카나코는 환상향에서 신앙을 모으기 위해 요카이 산의 신앙 관계를 재편하려 한다. "
            "레이무와 마리사는 이 이변의 진상을 파헤치기 위해 산을 오른다."
        ),
        "features": [
            "아이템을 수집해 파워를 올리는 신 시스템 (구 파워 시스템 폐지)",
            "신앙 게이지 — 그레이즈·적 처치로 채워지는 점수 배율",
            "레이무·마리사 두 캐릭터, 각각 세 가지 샷 타입",
        ],
    },
    "shooting_game/subterranean-animism": {
        "code": "Th11",
        "kr_title": "동방지령전",
        "ja_title": "東方地霊殿 ～ Subterranean Animism",
        "release": "2008년 8월 16일",
        "genre": "탄막 슈팅",
        "story": (
            "요카이 산 아래 구 지옥의 간헐천이 이상 분출하기 시작했다. "
            "지하에서 올라오는 원한의 기운이 지상 요괴들을 불안하게 만든다.\n\n"
            "레이무와 마리사는 지하로 내려가 원인을 조사한다. "
            "지하에는 코메이지 사토리가 다스리는 '구 지옥'이 존재하며, "
            "카에뇨우 린이 시체를 이용해 지표를 향해 핵의 불새 레이우지 우츠호를 이용한 열원을 만들어내고 있었다."
        ),
        "features": [
            "지하 세계를 배경으로 하는 어두운 세계관",
            "각 캐릭터마다 요카이 동료(서포터) 선택 — 서포터에 따라 서브샷 변화",
            "6종 서포터(유카리·스와코·카나코·나즈린·파르시·뉴도)",
        ],
    },
    "shooting_game/undefined-fantastic-object": {
        "code": "Th12",
        "kr_title": "동방성련선",
        "ja_title": "東方星蓮船 ～ Undefined Fantastic Object",
        "release": "2009년 8월 15일",
        "genre": "탄막 슈팅",
        "story": (
            "환상향에 UFO가 날아다니기 시작했다. "
            "UFO를 쫓아가던 레이무·마리사·사나에는 봉인된 성인을 태운 비행선을 발견한다.\n\n"
            "비행선에는 요괴와 불교도들이 타고 있었으며, 그들은 "
            "마계에 봉인된 불교 성인 히지리 뱌쿠렌을 해방하려 했다. "
            "뱌쿠렌의 각 파는 서로의 목적을 위해 주인공 앞에 立ち塞がる."
        ),
        "features": [
            "UFO 수집 시스템 — 색 조합에 따라 아이템·폭탄·1UP 획득",
            "레이무·마리사·사나에 세 캐릭터, 각각 두 가지 샷 타입",
            "불교 테마의 배경과 캐릭터",
        ],
    },
    "shooting_game/ten-desires": {
        "code": "Th13",
        "kr_title": "동방신령묘",
        "ja_title": "東方神霊廟 ～ Ten Desires",
        "release": "2011년 8월 13일",
        "genre": "탄막 슈팅",
        "story": (
            "신령들이 환상향에 대거 출현하기 시작했다. "
            "죽은 자의 원념이 신령으로 변해 떠돌고 있는 것이다.\n\n"
            "조사를 이어가던 주인공들은 불로불사를 추구한 도교 신선들의 존재를 파악한다. "
            "토요사토미미노 미코를 비롯한 신선들은 봉마이변 때 봉인되었다가 "
            "수면한 채 신령 묘에 숨어 있었으며, 인간들의 소원을 모아 부활하려 하고 있었다."
        ),
        "features": [
            "신령 게이지 — 신령 수집으로 트랜스 모드 발동",
            "레이무·마리사·사나에·요우무 네 캐릭터",
            "도교 테마의 신선·좀비 캐릭터",
        ],
    },
    "shooting_game/double-dealing-character": {
        "code": "Th14",
        "kr_title": "동방휘침성",
        "ja_title": "東方輝針城 ～ Double Dealing Character",
        "release": "2013년 8월 11일",
        "genre": "탄막 슈팅",
        "story": (
            "인간과 요괴의 도구들이 갑자기 반란을 일으키기 시작했다. "
            "레이무의 부적이 날아가고, 마리사의 빗자루가 반항하며, 사쿠야의 시간 마법도 이상해졌다.\n\n"
            "이변의 배후에는 역전의 아야카시 '기진 세이자'가 있었다. "
            "그녀는 작은 여왕 코가사 스쿠나와 함께 요물(付喪神)을 부추겨 "
            "약자와 강자를 뒤집는 계략을 꾸미고 있었다."
        ),
        "features": [
            "적 탄막을 흡수해 파워 업 하는 하이퍼 아이템 시스템",
            "레이무·마리사·사쿠야 세 캐릭터, 각각 두 가지 샷 타입",
            "초코쿠모·벤벤·야츠하시 등 악기 요물(付喪神) 캐릭터",
        ],
    },
    "shooting_game/legacy-of-lunatic-kingdom": {
        "code": "Th15",
        "kr_title": "동방감주전",
        "ja_title": "東方紺珠伝 ～ Legacy of Lunatic Kingdom",
        "release": "2015년 8월 14일",
        "genre": "탄막 슈팅",
        "story": (
            "달의 수도에서 온 쌍둥이 토끼 링고와 세이란이 환상향에 침입한다. "
            "이어서 달의 불순분자들이 환상향으로 몰려오면서 이변이 시작된다.\n\n"
            "레이무·마리사·사나에·레이센은 달의 수도로 향해 진상을 조사한다. "
            "원한을 품은 준코가 달의 신 토요히메에게 복수하기 위해 음격을 일으킨 것으로, "
            "그 혼란을 틈타 헤카티아 라피스라줄리가 지옥의 군세를 이끌고 있었다."
        ),
        "features": [
            "레가시 모드와 포인트 디바이스 모드 두 가지 플레이 방식",
            "포인트 디바이스 모드: 무한 컨티뉴 + 체크포인트 저장",
            "레이무·마리사·사나에·레이센 네 캐릭터",
        ],
    },
    "shooting_game/hidden-star-in-four-seasons": {
        "code": "Th16",
        "kr_title": "동방천공장",
        "ja_title": "東方天空璋 ～ Hidden Star in Four Seasons",
        "release": "2017년 8월 11일",
        "genre": "탄막 슈팅",
        "story": (
            "봄·여름·가을·겨울이 동시에 환상향을 덮치기 시작했다. "
            "계절이 뒤섞인 이변 속에서 새로운 요괴들이 강한 계절의 힘을 휘두른다.\n\n"
            "이변의 배후에는 숨겨진 신 '마타라 오키나'가 있었다. "
            "그녀는 산의 뒷면에서 은밀히 움직이며, "
            "제자 사토노 테이레이다와 마이 테이레이다를 시켜 계절의 힘을 훔쳐냈다."
        ),
        "features": [
            "계절 아이템 수집으로 시즌 파워 발동",
            "레이무·마리사·아야·치르노 네 캐릭터, 각각 두 가지 타입",
            "각 캐릭터별 계절 테마의 봄버 연출",
        ],
    },
    "shooting_game/wily-beast-and-weakest-creature": {
        "code": "Th17",
        "kr_title": "동방귀형수",
        "ja_title": "東方鬼形獣 ～ Wily Beast and Weakest Creature",
        "release": "2019년 8월 12일",
        "genre": "탄막 슈팅",
        "story": (
            "구 지옥에서 짐승의 영이 대거 지상으로 흘러들어 요괴에게 빙의하기 시작했다. "
            "지상이 혼란에 빠지는 가운데, 동물 영들의 대표가 주인공들에게 협력을 요청한다.\n\n"
            "구 지옥의 은자 이야사카 마요미, 키인 마에슈도, "
            "마유미 조닌이 하니와 군단을 이끌고 지상과 지하를 혼란에 빠뜨리고 있었다."
        ),
        "features": [
            "동물 영(수달·독수리·이리) 파트너 선택으로 샷·봄버 변화",
            "레이무·마리사·요우무 세 캐릭터",
            "동물 영 게이지 — 영혼 흡수로 파워 특수 공격 발동",
        ],
    },
    "shooting_game/unconnected-marketeers": {
        "code": "Th18",
        "kr_title": "동방홍룡동",
        "ja_title": "東方虹龍洞 ～ Unconnected Marketeers",
        "release": "2021년 5월 4일",
        "genre": "탄막 슈팅",
        "story": (
            "환상향에 능력이 담긴 신비한 카드가 흘러다니기 시작했다. "
            "카드를 모으는 자, 이를 암거래하는 자, 요괴에게서 능력을 빼앗는 자가 얽혀들면서 이변이 된다.\n\n"
            "배후에는 카드 시장을 운영하는 미카부시 준이 있었다. "
            "그녀는 요괴들의 능력을 카드에 담아 인간에게 판매하고 있었으며, "
            "그 과정에서 요괴들이 힘을 잃어가고 있었다."
        ),
        "features": [
            "능력 카드 시스템 — 스테이지마다 카드를 입수해 능력 커스터마이즈",
            "레이무·마리사·사나에·사쿠야 네 캐릭터",
            "카드 조합에 따른 다양한 플레이 스타일",
        ],
    },
    "shooting_game/the-unfinished-dream-of-all-living-ghost": {
        "code": "Th19",
        "kr_title": "동방수왕원",
        "ja_title": "東方獣王園 ～ Unfinished Dream of All Living Ghost",
        "release": "2023년 8월 13일",
        "genre": "탄막 슈팅 (1vs1 대전)",
        "story": (
            "꿈과 현실의 경계에 있는 새로운 세계가 열렸다. "
            "그 세계에 발을 들인 존재들은 이유를 알 수 없는 싸움에 휘말리게 된다.\n\n"
            "반경(半夢境)이라 불리는 이 공간에서 레이무를 비롯한 다양한 캐릭터들이 "
            "생사여탈의 이변을 해결하기 위해 힘을 겨룬다."
        ),
        "features": [
            "동방 화영총 이후 두 번째 1vs1 대전형 슈팅",
            "15명의 플레이어블 캐릭터",
            "로컬·온라인 2P 대전 지원",
        ],
    },
    "shooting_game/fossilized-wonders": {
        "code": "Th20",
        "kr_title": "동방금상경",
        "ja_title": "東方錦上京 ～ Fossilized Wonders",
        "release": "2025년 8월 17일 (Steam)",
        "genre": "탄막 슈팅",
        "story": (
            "환상향의 요괴들이 하나둘씩 힘을 잃어가기 시작했다. "
            "마치 시간이 멈춰버린 것처럼 변화 없는 일상이 반복되는 가운데, "
            "성역만이 본 적 없는 변화를 보이고 있었다.\n\n"
            "하쿠레이 레이무와 키리사메 마리사는 이 새로운 이변의 진상을 파헤치기 위해 나선다."
        ),
        "features": [
            "동방 프로젝트 스팀 첫 정식 출시 작품",
            "레이무·마리사 두 캐릭터",
        ],
    },
    # Fighting games
    "fighting_game/immaterial-and-missing-power": {
        "code": "Th075",
        "kr_title": "동방췌몽상",
        "ja_title": "東方萃夢想 ～ Immaterial and Missing Power",
        "release": "2004년 12월 30일",
        "genre": "2D 격투",
        "story": (
            "환상향에 정체불명의 짙은 안개가 끼기 시작했다. "
            "안개 속에서 요괴들이 떠들썩한 연회를 즐기고 있으며, 이 모임의 원인을 두고 갑론을박이 이어진다.\n\n"
            "이변의 원인은 이부키 스이카. "
            "그녀는 '호기(萃)의 능력'으로 요괴들의 마음을 한데 모아 "
            "대규모 연회를 일으키는 장난을 치고 있었다."
        ),
        "features": [
            "Tasofro(黄昏フロンティア)와 ZUN의 공동 제작",
            "10명의 플레이어블 캐릭터",
            "아케이드·VS·스토리 모드 지원",
        ],
    },
    "fighting_game/scarlet-weather-rhapsody": {
        "code": "Th105",
        "kr_title": "동방비상천",
        "ja_title": "東方緋想天 ～ Scarlet Weather Rhapsody",
        "release": "2008년 5월 25일",
        "genre": "2D 격투",
        "story": (
            "환상향에 계절에 어울리지 않는 이상한 날씨가 계속된다. "
            "각지의 요괴들은 이 이변의 원인을 찾아 싸움을 벌인다.\n\n"
            "이변의 주인은 천계에서 내려온 히나나위 텐시. "
            "그녀는 요석(要石)을 이용해 대지진을 일으키고 "
            "환상향을 혼란에 빠뜨려 천계에서의 지루함을 달래려 했다."
        ),
        "features": [
            "날씨 시스템 — 천기가 자동으로 변화하며 전투에 영향",
            "스펠 카드 덱 커스터마이즈",
            "15명의 플레이어블 캐릭터",
        ],
    },
    "fighting_game/touhou-hisoutensoku": {
        "code": "Th123",
        "kr_title": "동방비상천칙",
        "ja_title": "東方非想天則 ～ 超弩級ギニョルの謎を追え！",
        "release": "2009년 8월 15일",
        "genre": "2D 격투 (확장팩)",
        "story": (
            "치르노·홍 메이링·코치야 사나에 세 명이 각자의 이유로 "
            "거대한 그림자(비상천칙)를 쫓는 단편 시나리오.\n\n"
            "치르노는 강해지고 싶어서, 메이링은 수상한 점을 조사하러, "
            "사나에는 거대 로봇이라 착각하여 찾아나선다. "
            "비상천칙의 정체는 캇파의 증기 인형 '비상천칙'이었다."
        ),
        "features": [
            "동방비상천의 확장팩 (단독 실행 가능)",
            "치르노·메이링·사나에 세 명의 신규 시나리오",
            "비상천과 합산 20명 이상의 플레이어블 캐릭터",
        ],
    },
    "fighting_game/hopeless-masquerade": {
        "code": "Th135",
        "kr_title": "동방심기루",
        "ja_title": "東方心綺楼 ～ Hopeless Masquerade",
        "release": "2013년 5월 26일",
        "genre": "2D 격투",
        "story": (
            "환상향의 인간들이 갑자기 신앙을 잃고 허무에 빠지기 시작했다. "
            "요괴들은 인간의 신앙과 인기를 모으기 위해 서로 싸움을 벌인다.\n\n"
            "이변의 발단은 감정의 노 마스크를 잃어버린 하타노 코코로. "
            "마스크를 찾기 위해 뛰어다니는 코코로와 그 소동을 해결하려는 레이무, "
            "인기를 노리는 다른 요괴들이 뒤엉켜 환상향이 시끌벅적해진다."
        ),
        "features": [
            "공중 전투 중심의 새로운 배틀 시스템",
            "인기(人気) 게이지가 도입된 독특한 승패 판정",
            "10명의 플레이어블 캐릭터",
        ],
    },
    "fighting_game/urban-legend-in-limbo": {
        "code": "Th145",
        "kr_title": "동방심비록",
        "ja_title": "東方深秘録 ～ Urban Legend in Limbo",
        "release": "2015년 5월 10일",
        "genre": "2D 격투",
        "story": (
            "환상향에 외부 세계의 도시 전설이 현실로 구현되기 시작했다. "
            "빨간 방·인면견·이끼 소녀 등 다양한 도시 전설이 요괴들을 괴롭힌다.\n\n"
            "외부 세계 고등학생 우사미 스미레코가 능력을 이용해 환상향에 침입한다. "
            "그녀는 도시 전설의 힘으로 환상향과 외부 세계의 경계를 허물려 했다."
        ),
        "features": [
            "도시 전설 시스템 — 캐릭터별 고유 도시 전설 필살기",
            "외부 세계 인간 캐릭터 우사미 스미레코 참전",
            "13명의 플레이어블 캐릭터",
        ],
    },
    "fighting_game/antinomy-of-common-flowers": {
        "code": "Th155",
        "kr_title": "동방빙의화",
        "ja_title": "東方憑依華 ～ Antinomy of Common Flowers",
        "release": "2017년 12월 29일 (Steam)",
        "genre": "2D 격투",
        "story": (
            "완전 빙의(夢想天生)라는 불가사의한 현상이 환상향에 퍼진다. "
            "두 사람이 빙의해 하나가 되면 현신·예지·완전 회피가 가능해지는 이변이다.\n\n"
            "요리가미 죠온과 요리가미 시온 자매가 이 이변에 깊이 얽혀 있으며, "
            "레이무·마리사를 비롯한 캐릭터들이 빙의의 비밀을 파헤친다."
        ),
        "features": [
            "2인 1조 빙의 시스템 — 메인과 서포트 캐릭터를 선택해 전투",
            "스팀 첫 정식 출시 동방 격투 게임",
            "20명의 플레이어블 캐릭터",
        ],
    },
    "fighting_game/gouyoku-ibun": {
        "code": "Th175",
        "kr_title": "동방강욕이문",
        "ja_title": "東方剛欲異聞 ～ Submerged Hell of Sunken Sorrow",
        "release": "2021년 12월 30일",
        "genre": "2D 격투",
        "story": "TBD",
        "features": [],
    },
    # Side games
    "side_game/shoot-the-bullet": {
        "code": "Th095",
        "kr_title": "동방문화첩",
        "ja_title": "東方文花帖 ～ Shoot the Bullet",
        "release": "2005년 12월 30일",
        "genre": "사진 촬영 슈팅",
        "story": (
            "텐구 신문기자 샤메이마루 아야가 환상향의 요괴들을 취재한다. "
            "강적들의 탄막을 사진에 담아야 다음 스테이지로 나아갈 수 있다.\n\n"
            "9명의 보스를 상대로 사진 촬영 미션을 클리어하는 형식의 외전작."
        ),
        "features": [
            "탄막을 카메라로 흡수해 적에게 반사하는 독특한 사진 촬영 시스템",
            "아야만 플레이어블, 공격·회피 불가",
            "기존 슈팅 시리즈 보스들이 재등장",
        ],
    },
    "side_game/double-spoiler": {
        "code": "Th125",
        "kr_title": "더블 스포일러",
        "ja_title": "ダブルスポイラー ～ 東方文花帖",
        "release": "2010년 3월 14일",
        "genre": "사진 촬영 슈팅",
        "story": (
            "샤메이마루 아야의 후배 히메카이도 하타테가 등장한다. "
            "두 기자가 각자의 방식으로 요괴들을 취재하는 외전작.\n\n"
            "동방문화첩의 시스템을 계승하며, 새로운 사진 미션과 캐릭터가 추가되었다."
        ),
        "features": [
            "아야·하타테 두 캐릭터 선택",
            "동방문화첩의 확장판 격 외전",
            "새로운 씬과 보스 추가",
        ],
    },
    "side_game/fairy-wars": {
        "code": "Th128",
        "kr_title": "요정대전쟁",
        "ja_title": "妖精大戦争 ～ 東方三月精",
        "release": "2010년 8월 15일",
        "genre": "탄막 슈팅",
        "story": (
            "치르노가 이끄는 요정 패거리가 다른 요정들과 전쟁을 벌인다. "
            "가장 강한 요정이 되기 위한 치르노의 도전이 펼쳐진다.\n\n"
            "동방삼월정 만화와 연동된 외전 슈팅으로, 치르노의 단독 활약을 그린다."
        ),
        "features": [
            "치르노 단독 주인공",
            "빙결 시스템 — 얼린 탄막을 무기로 역이용",
            "세 가지 루트 분기로 리플레이성 강화",
        ],
    },
    "side_game/impossible-spell-card": {
        "code": "Th143",
        "kr_title": "탄막 아마노자쿠",
        "ja_title": "弾幕アマノジャク ～ Impossible Spell Card",
        "release": "2014년 8월 11일",
        "genre": "탄막 슈팅",
        "story": (
            "역전의 아야카시 기진 세이자가 사방을 적으로 돌리며 도망친다. "
            "\"절대 피할 수 없는\" 탄막 카드를 상대로 치트 아이템을 사용해 탈출하는 것이 목표.\n\n"
            "동방휘침성 이후의 후일담으로, 수배된 세이자의 도주극을 그린다."
        ),
        "features": [
            "기진 세이자 단독 주인공",
            "치트 아이템 사용이 허용·권장되는 독특한 게임 방식",
            "100장에 달하는 다양한 탄막 카드",
        ],
    },
    "side_game/violet-detector": {
        "code": "Th165",
        "kr_title": "비봉 나이트메어 다이어리",
        "ja_title": "秘封ナイトメアダイアリー ～ Violet Detector",
        "release": "2018년 8월 11일",
        "genre": "탄막 슈팅",
        "story": (
            "코노에 하루나(카소다니 쿄코와는 다른 인물)가 악몽의 세계에 갇힌다. "
            "악몽 속에서 반복되는 전투를 통해 탈출구를 찾아야 한다.\n\n"
            "비밀결사 '비봉 나이트메어'의 세계를 배경으로 한 사진 촬영 슈팅 외전."
        ),
        "features": [
            "우사미 스미레코 단독 주인공",
            "꿈 속 악몽을 사진으로 기록하는 다이어리 형식",
            "동방심비록 이후 스미레코의 새로운 이야기",
        ],
    },
    "side_game/100th-black-market": {
        "code": "Th185",
        "kr_title": "불릿필리아들의 암시장",
        "ja_title": "弾幕フィリア達の暗市場 ～ 100th Black Market",
        "release": "2022년 8월 13일",
        "genre": "탄막 슈팅",
        "story": (
            "환상향과 외부 세계 사이에서 비밀리에 운영되는 암시장. "
            "그곳에서 물건을 사고팔면서 탄막 전투가 펼쳐진다.\n\n"
            "돈이 전부인 이 시장에서 다양한 캐릭터들이 각자의 이익을 위해 거래하고 싸운다."
        ),
        "features": [
            "마리사 단독 주인공",
            "구입한 아이템으로 능력을 커스터마이즈하는 쇼핑 시스템",
            "스팀 정식 출시",
        ],
    },
}


def generate_intro(v3_rel: str, data: dict) -> str:
    """Generate intro.mdx content for a game."""
    # Determine table of contents based on existing files
    game_dir = DOCS_V3 / v3_rel
    has_characters = (game_dir / "characters").exists()
    has_dialogue = (game_dir / "dialogue").exists()
    has_music = (game_dir / "music.mdx").exists()
    has_spellcards = (game_dir / "spell-cards.mdx").exists()

    toc_rows = []
    if has_characters:
        # Find first character file (sorted by sidebar_position if possible)
        char_dir = game_dir / "characters"
        char_files = sorted(
            [f.stem for f in char_dir.glob("*.mdx") if f.stem != "_category_"]
        )
        first_char = char_files[0] if char_files else "hakurei_reimu"
        toc_rows.append(f"| 캐릭터 | [보기](./characters/{first_char}) |")
    if has_dialogue:
        toc_rows.append("| 대사집 | [보기](./dialogue/overview) |")
    if has_music:
        toc_rows.append("| 뮤직룸 | [보기](./music) |")
    if has_spellcards:
        toc_rows.append("| 주문카드 | [보기](./spell-cards) |")

    toc = "| 항목 | 링크 |\n|------|------|\n" + "\n".join(toc_rows)

    features_md = ""
    if data.get("features"):
        items = "\n".join(f"- {f}" for f in data["features"])
        features_md = f"\n## 특징\n\n{items}\n"

    return f"""---
title: "{data['kr_title']}"
sidebar_position: 1
---

# {data['kr_title']} ({data['code']})

**{data['ja_title']}**

| | |
|---|---|
| 출시일 | {data['release']} |
| 개발 | 상하이 앨리스 환악단 (ZUN) |
| 장르 | {data['genre']} |

## 줄거리

:::caution 준비 중
게임 줄거리는 추후 업데이트 예정입니다.
:::
{features_md}
## 목차

{toc}
"""


def main():
    dry_run = '--dry-run' in sys.argv
    targets = [a for a in sys.argv[1:] if not a.startswith('--')] or list(GAMES.keys())

    for v3_rel in targets:
        if v3_rel not in GAMES:
            print(f"[SKIP] Unknown: {v3_rel}")
            continue

        intro_path = DOCS_V3 / v3_rel / "intro.mdx"
        if not intro_path.exists():
            print(f"[SKIP] No intro.mdx: {v3_rel}")
            continue

        content = generate_intro(v3_rel, GAMES[v3_rel])
        if dry_run:
            print(f"[DRY] {v3_rel}")
            print(content[:200])
            print("...")
        else:
            intro_path.write_text(content, encoding="utf-8")
            print(f"[OK] {GAMES[v3_rel]['code']} {v3_rel}")


if __name__ == "__main__":
    main()
