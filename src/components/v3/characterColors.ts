// 캐릭터별 테마 색상 (HSL hue 기반)
// [hue, saturation] — lightness는 라이트/다크 모드에서 자동 계산
export const CHARACTER_COLORS: Record<string, [number, number]> = {
  // Th06 — 동방홍마향
  reimu_hakurei:      [348, 75],
  marisa_kirisame:    [45, 80],
  rumia:              [270, 40],
  cirno:              [200, 75],
  hong_meiling:       [0, 65],
  patchouli_knowledge:[275, 55],
  sakuya_izayoi:      [220, 30],
  remilia_scarlet:    [345, 70],
  flandre_scarlet:    [50, 75],

  // Th07 — 동방요요몽
  chen:               [25, 65],
  letty_whiterock:    [210, 25],
  alice_margatroid:   [215, 60],
  lily_white:         [0, 0],
  lunasa_prismriver:  [50, 55],
  merlin_prismriver:  [340, 55],
  lyrica_prismriver:  [280, 55],
  youmu_konpaku:      [150, 35],
  yuyuko_saigyouji:   [330, 60],
  ran_yakumo:         [40, 70],
  yukari_yakumo:      [280, 50],

  // Th075 — 동방췌몽상
  suika_ibuki:        [25, 70],

  // Th08 — 동방영야초
  wriggle_nightbug:   [120, 50],
  mystia_lorelei:     [330, 50],
  keine_kamishirasawa:[215, 40],
  tewi_inaba:         [340, 50],
  reisen_udongein_inaba:[350, 55],
  reisen:             [350, 55],
  eirin_yagokoro:     [225, 45],
  kaguya_houraisan:   [310, 50],
  fujiwara_no_mokou:  [10, 70],

  // Th09 — 동방화영총
  aya_shameimaru:     [0, 55],
  medicine_melancholy:[90, 50],
  yuuka_kazami:       [130, 55],
  komachi_onozuka:    [5, 60],
  shikieiki_yamaxanadu:[225, 50],

  // Th10 — 동방풍신록
  minoriko_aki:       [35, 65],
  shizuha_aki:        [45, 55],
  hina_kagiyama:      [140, 45],
  nitori_kawashiro:   [200, 65],
  momiji_inubashiri:  [0, 50],
  sanae_kochiya:      [145, 55],
  kanako_yasaka:      [230, 55],
  suwako_moriya:      [95, 45],

  // Th105 — 동방비상천
  iku_nagae:          [260, 50],
  tenshi_hinanawi:    [210, 55],

  // Th11 — 동방지령전
  kisume:             [160, 40],
  yamame_kurodani:    [45, 55],
  parsee_mizuhashi:   [90, 50],
  yuugi_hoshiguma:    [15, 65],
  satori_komeiji:     [310, 50],
  rin_kaenbyou:       [5, 65],
  utsuho_reiuji:      [350, 60],
  koishi_komeiji:     [75, 50],

  // Th12 — 동방성련선
  nazrin:             [45, 30],
  kogasa_tatara:      [240, 55],
  ichirin_kumoi:      [215, 45],
  unzan:              [215, 35],
  shou_toramaru:      [40, 65],
  byakuren_hijiri:    [280, 50],
  nue_houjuu:         [350, 45],
  murasa_minamitsu:   [195, 55],

  // Th13 — 동방신령묘
  kyouko_kasodani:    [130, 50],
  yoshika_miyako:     [180, 45],
  seiga_kaku:         [210, 50],
  mononobe_no_futo:   [35, 35],
  toyosatomimi_no_miko:[280, 45],
  mamizou_futatsuiwa: [30, 45],
  soga_no_tojiko:     [155, 45],

  // Th135/Th145 — 동방심기루/심비록
  hata_no_kokoro:     [340, 55],
  sumireko_usami:     [270, 50],

  // Th14 — 동방휘침성
  wakasagihime:       [195, 60],
  sekibanki:          [0, 60],
  kagerou_imaizumi:   [15, 50],
  benben_tsukumo:     [240, 45],
  yatsuhashi_tsukumo: [20, 55],
  seija_kijin:        [350, 55],
  shinmyoumaru_sukuna:[310, 50],
  raiko_horikawa:     [10, 60],

  // Th15 — 동방감주전
  seiran:             [215, 55],
  ringo:              [30, 60],
  doremy_sweet:       [260, 40],
  sagume_kishin:      [280, 35],
  clownpiece:         [0, 55],
  junko:              [15, 65],
  hecatia_lapislazuli:[5, 55],

  // Th16 — 동방천공장
  eternity_larva:     [80, 55],
  nemuno_sakata:      [10, 40],
  aunn_komano:        [140, 45],
  narumi_yatadera:    [35, 35],
  satono_nishida:     [275, 45],
  mai:                [250, 45],
  okina_matara:       [50, 50],

  // Th155/Th175
  joon_yorigami:      [45, 70],
  shion_yorigami:     [230, 45],
  kasen_ibaraki:      [345, 50],
  yuma_toutetsu:      [15, 60],

  // Th17 — 동방귀형수
  eika_ebisu:         [200, 40],
  urumi_ushizaki:     [175, 45],
  kutaka_niwatari:    [15, 55],
  yachie_kicchou:     [190, 50],
  mayumi_joutouguu:   [25, 40],
  keiki_haniyasushin: [48, 45],
  saki_kurokoma:      [350, 50],
  eagle_spirit:       [130, 45],
  otter_spirit:       [200, 50],
  wolf_spirit:        [0, 50],

  // Th18 — 동방홍룡동
  mike_goutokuji:     [45, 65],
  takane_yamashiro:   [220, 35],
  sannyo_komakusa:    [155, 40],
  misumaru_tamatsukuri:[5, 55],
  tsukasa_kudamaki:   [30, 55],
  megumu_iizunamaru:  [225, 50],
  chimata_tenkyuu:    [260, 55],
  momoyo_himemushi:   [350, 50],

  // Th19 — 동방수왕원
  chiyari_tenkajin:   [350, 50],
  enoko_maimoto:      [30, 40],
  hisami_yomotsu:     [290, 45],
  zanmu_nippouchi:    [275, 40],

  // Th20 — 동방유적봉
  nina_watari:        [200, 50],
  ariya_iwanaga:      [35, 45],
  watatsuki_no_toyohime:[300, 45],
  yuiman_asama:       [15, 50],
  nareko_michigami:   [45, 50],
  chimi_hoju:         [175, 45],
  ubame_chirizuka:    [30, 35],

  // 기타
  hatate_himekaidou:  [305, 45],
};

export const FALLBACK_HUES = [210, 170, 130, 30, 0, 270, 220, 150, 330, 250, 195, 20];

export function hexFromHSL(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export interface CharacterTheme {
  text: string;
  bg: string;
  border: string;
}

export function getCharacterTheme(speaker: string, avatar?: string, isDark = false): CharacterTheme {
  let hue: number;
  let sat: number;

  // avatar can be "thXX/character_name" — extract character part for color lookup
  const avatarKey = avatar?.includes('/') ? avatar.split('/').pop()! : avatar;
  // Try direct lookup, then try reversing firstname_lastname ↔ lastname_firstname
  let mapping = avatarKey ? CHARACTER_COLORS[avatarKey] : undefined;
  if (!mapping && avatarKey) {
    const parts = avatarKey.split('_');
    if (parts.length >= 2) {
      const reversed = [...parts.slice(-1), ...parts.slice(0, -1)].join('_');
      mapping = CHARACTER_COLORS[reversed];
    }
  }
  if (mapping) {
    [hue, sat] = mapping;
  } else {
    let hash = 0;
    for (let i = 0; i < speaker.length; i++) {
      hash = speaker.charCodeAt(i) + ((hash << 5) - hash);
    }
    hue = FALLBACK_HUES[Math.abs(hash) % FALLBACK_HUES.length];
    sat = 50;
  }

  if (isDark) {
    return {
      text: hexFromHSL(hue, Math.min(sat, 70), 72),
      bg: hexFromHSL(hue, Math.max(sat - 25, 10), 14),
      border: hexFromHSL(hue, Math.min(sat, 65), 45),
    };
  }
  return {
    text: hexFromHSL(hue, sat, 30),
    bg: hexFromHSL(hue, Math.min(sat + 10, 90), 95),
    border: hexFromHSL(hue, sat, 50),
  };
}
