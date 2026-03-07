import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { useColorMode } from '@docusaurus/theme-common';

interface DialogueProps {
  speaker: string;
  children: React.ReactNode;
  align?: 'left' | 'right';
  avatar?: string;
}

// 캐릭터별 테마 색상 (HSL hue 기반)
// [hue, saturation] — lightness는 라이트/다크 모드에서 자동 계산
const CHARACTER_COLORS: Record<string, [number, number]> = {
  // Th06 — 동방홍마향
  reimu_hakurei:      [348, 75], // 빨강/분홍
  marisa_kirisame:    [45, 80],  // 금색
  rumia:              [270, 40], // 어두운 보라
  cirno:              [200, 75], // 얼음 파랑
  hong_meiling:       [0, 65],   // 빨강
  patchouli_knowledge:[275, 55], // 보라
  sakuya_izayoi:      [220, 30], // 은회색
  remilia_scarlet:    [345, 70], // 진홍
  flandre_scarlet:    [50, 75],  // 빨강-노랑

  // Th07 — 동방요요몽
  chen:               [25, 65],  // 갈색/주황
  letty_whiterock:    [210, 25], // 차가운 회색
  alice_margatroid:   [215, 60], // 파랑
  lily_white:         [0, 0],    // 흰색/회색
  lunasa_prismriver:  [50, 55],  // 노랑
  merlin_prismriver:  [340, 55], // 분홍
  lyrica_prismriver:  [280, 55], // 보라
  youmu_konpaku:      [150, 35], // 은녹색
  yuyuko_saigyouji:   [330, 60], // 벚꽃 분홍
  ran_yakumo:         [40, 70],  // 금색/주황
  yukari_yakumo:      [280, 50], // 보라

  // Th075 — 동방췌몽상
  suika_ibuki:        [25, 70],  // 주황

  // Th08 — 동방영야초
  wriggle_nightbug:   [120, 50], // 초록
  mystia_lorelei:     [330, 50], // 분홍
  keine_kamishirasawa:[215, 40], // 파랑/은색
  tewi_inaba:         [340, 50], // 분홍
  reisen_udongein_inaba:[350, 55], // 빨강/보라
  reisen:             [350, 55],
  eirin_yagokoro:     [225, 45], // 파랑/은색
  kaguya_houraisan:   [310, 50], // 분홍/보라
  fujiwara_no_mokou:  [10, 70],  // 불꽃 빨강

  // Th09 — 동방화영총
  aya_shameimaru:     [0, 55],   // 빨강/검정
  medicine_melancholy:[90, 50],  // 연두
  yuuka_kazami:       [130, 55], // 초록
  komachi_onozuka:    [5, 60],   // 빨강
  shikieiki_yamaxanadu:[225, 50], // 파랑

  // Th10 — 동방풍신록
  minoriko_aki:       [35, 65],  // 단풍 주황
  shizuha_aki:        [45, 55],  // 노랑 단풍
  hina_kagiyama:      [140, 45], // 초록/빨강
  nitori_kawashiro:   [200, 65], // 파랑
  momiji_inubashiri:  [0, 50],   // 빨강/흰색
  sanae_kochiya:      [145, 55], // 초록
  kanako_yasaka:      [230, 55], // 파랑
  suwako_moriya:      [95, 45],  // 녹갈색

  // Th105 — 동방비상천
  iku_nagae:          [260, 50], // 보라/파랑
  tenshi_hinanawi:    [210, 55], // 파랑

  // Th11 — 동방지령전
  kisume:             [160, 40], // 청록
  yamame_kurodani:    [45, 55],  // 노랑/갈색
  parsee_mizuhashi:   [90, 50],  // 질투의 초록
  yuugi_hoshiguma:    [15, 65],  // 빨강/주황
  satori_komeiji:     [310, 50], // 분홍/보라
  rin_kaenbyou:       [5, 65],   // 빨강/주황
  utsuho_reiuji:      [350, 60], // 검정/빨강
  koishi_komeiji:     [75, 50],  // 노랑/초록

  // Th12 — 동방성련선
  nazrin:             [45, 30],  // 회갈색
  kogasa_tatara:      [240, 55], // 파랑/보라
  ichirin_kumoi:      [215, 45], // 파랑/흰색
  unzan:              [215, 35], // 회색/파랑
  shou_toramaru:      [40, 65],  // 주황/노랑
  byakuren_hijiri:    [280, 50], // 보라
  nue_houjuu:         [350, 45], // 검정/빨강
  murasa_minamitsu:   [195, 55], // 청록

  // Th13 — 동방신령묘
  kyouko_kasodani:    [130, 50], // 초록
  yoshika_miyako:     [180, 45], // 청록
  seiga_kaku:         [210, 50], // 파랑
  mononobe_no_futo:   [35, 35],  // 회갈색
  toyosatomimi_no_miko:[280, 45], // 보라/금색
  mamizou_futatsuiwa: [30, 45],  // 갈색
  soga_no_tojiko:     [155, 45], // 청록

  // Th135/Th145 — 동방심기루/심비록
  hata_no_kokoro:     [340, 55], // 분홍
  sumireko_usami:     [270, 50], // 보라

  // Th14 — 동방휘침성
  wakasagihime:       [195, 60], // 물빛 파랑
  sekibanki:          [0, 60],   // 빨강
  kagerou_imaizumi:   [15, 50],  // 빨갈색
  benben_tsukumo:     [240, 45], // 파랑/보라
  yatsuhashi_tsukumo: [20, 55],  // 빨강/주황
  seija_kijin:        [350, 55], // 빨강/검정
  shinmyoumaru_sukuna:[310, 50], // 보라/빨강
  raiko_horikawa:     [10, 60],  // 빨강/금색

  // Th15 — 동방감주전
  seiran:             [215, 55], // 파랑
  ringo:              [30, 60],  // 주황
  doremy_sweet:       [260, 40], // 보라/파랑
  sagume_kishin:      [280, 35], // 보라/은색
  clownpiece:         [0, 55],   // 빨강/흰/파랑
  junko:              [15, 65],  // 빨강/주황
  hecatia_lapislazuli:[5, 55],   // 빨강

  // Th16 — 동방천공장
  eternity_larva:     [80, 55],  // 초록/노랑
  nemuno_sakata:      [10, 40],  // 빨갈색
  aunn_komano:        [140, 45], // 초록
  narumi_yatadera:    [35, 35],  // 갈색/초록
  satono_nishida:     [275, 45], // 보라
  mai:                [250, 45], // 보라/파랑
  okina_matara:       [50, 50],  // 금색/초록

  // Th155/Th175
  joon_yorigami:      [45, 70],  // 금색
  shion_yorigami:     [230, 45], // 파랑/어두운
  kasen_ibaraki:      [345, 50], // 분홍/빨강
  yuma_toutetsu:      [15, 60],  // 빨강/주황

  // Th17 — 동방귀형수
  eika_ebisu:         [200, 40], // 밝은 파랑
  urumi_ushizaki:     [175, 45], // 파랑/초록
  kutaka_niwatari:    [15, 55],  // 빨강/주황
  yachie_kicchou:     [190, 50], // 파랑/초록
  mayumi_joutouguu:   [25, 40],  // 갈색/빨강
  keiki_haniyasushin: [48, 45],  // 금색/흰색
  saki_kurokoma:      [350, 50], // 검정/빨강
  eagle_spirit:       [130, 45], // 초록
  otter_spirit:       [200, 50], // 파랑
  wolf_spirit:        [0, 50],   // 빨강

  // Th18 — 동방홍룡동
  mike_goutokuji:     [45, 65],  // 노랑/금색
  takane_yamashiro:   [220, 35], // 파랑/회색
  sannyo_komakusa:    [155, 40], // 초록/보라
  misumaru_tamatsukuri:[5, 55],  // 빨강/금색
  tsukasa_kudamaki:   [30, 55],  // 주황
  megumu_iizunamaru:  [225, 50], // 파랑/빨강
  chimata_tenkyuu:    [260, 55], // 무지개/파랑
  momoyo_himemushi:   [350, 50], // 빨강/어두운

  // Th19 — 동방수왕원
  chiyari_tenkajin:   [350, 50], // 빨강/어두운
  enoko_maimoto:      [30, 40],  // 갈색
  hisami_yomotsu:     [290, 45], // 보라/빨강
  zanmu_nippouchi:    [275, 40], // 어두운 보라

  // Th20 — 동방유적봉
  nina_watari:        [200, 50], // 파랑
  ariya_iwanaga:      [35, 45],  // 갈색/주황
  watatsuki_no_toyohime:[300, 45], // 분홍/보라
  yuiman_asama:       [15, 50],  // 빨강/주황
  nareko_michigami:   [45, 50],  // 노랑
  chimi_hoju:         [175, 45], // 청록
  ubame_chirizuka:    [30, 35],  // 갈색

  // 기타
  hatate_himekaidou:  [305, 45], // 보라/분홍
};

// Fallback 팔레트 (해시 기반, 매핑 안 된 캐릭터용)
const FALLBACK_HUES = [210, 170, 130, 30, 0, 270, 220, 150, 330, 250, 195, 20];

function hexFromHSL(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function getCharacterTheme(speaker: string, avatar?: string, isDark = false) {
  let hue: number;
  let sat: number;

  const mapping = avatar ? CHARACTER_COLORS[avatar] : undefined;
  if (mapping) {
    [hue, sat] = mapping;
  } else {
    // 해시 기반 fallback
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

const Dialogue: React.FC<DialogueProps> = ({ speaker, children, align = 'left', avatar }) => {
  const isRight = align === 'right';
  const { colorMode } = useColorMode();
  const theme = getCharacterTheme(speaker, avatar, colorMode === 'dark');
  
  // Docusaurus helper to resolve static assets
  const avatarUrl = avatar ? useBaseUrl(`/img/portraits/${avatar}.webp`) : null;

  return (
    <div style={{
      display: 'flex',
      flexDirection: isRight ? 'row-reverse' : 'row',
      marginBottom: '1.5rem',
      gap: '1rem',
      alignItems: 'flex-start'
    }}>
      {/* Avatar Container */}
      <div style={{
        flexShrink: 0,
        width: '54px',
        height: '54px',
        borderRadius: '50%',
        backgroundColor: theme.bg,
        overflow: 'hidden',
        border: `2px solid ${theme.border}`,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {avatar ? (
          <img 
            src={avatarUrl} 
            alt={speaker}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              const parent = target.parentElement;
              target.style.display = 'none';
              if (parent) {
                parent.style.color = theme.text;
                parent.innerText = speaker[0];
              }
            }}
          />
        ) : (
          <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: theme.text }}>
            {speaker[0]}
          </span>
        )}
      </div>

      {/* Bubble Container */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: isRight ? 'flex-end' : 'flex-start',
        minWidth: 0
      }}>
        {/* Name Label */}
        <div style={{
          fontSize: '0.8rem',
          fontWeight: 'bold',
          marginBottom: '0.25rem',
          color: theme.text,
          padding: '0 0.5rem',
          opacity: 0.9
        }}>
          {speaker}
        </div>

        {/* Message Bubble */}
        <div style={{
          position: 'relative',
          padding: '0.75rem 1rem',
          backgroundColor: isRight ? theme.bg : 'var(--ifm-background-surface-color)',
          color: 'var(--ifm-font-color-base)',
          borderRadius: '14px',
          borderTopLeftRadius: isRight ? '14px' : '4px',
          borderTopRightRadius: isRight ? '4px' : '14px',
          border: `1px solid ${theme.border}44`, // Low opacity border
          borderLeft: isRight ? `1px solid ${theme.border}44` : `4px solid ${theme.border}`,
          borderRight: isRight ? `4px solid ${theme.border}` : `1px solid ${theme.border}44`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          maxWidth: '90%',
          wordBreak: 'break-word'
        }}>
          {/* Bubble Tail */}
          <div style={{
            position: 'absolute',
            top: '0',
            [isRight ? 'right' : 'left']: '-8px',
            width: '0',
            height: '0',
            borderStyle: 'solid',
            borderWidth: isRight ? '0 0 10px 10px' : '0 10px 10px 0',
            borderColor: `transparent transparent transparent ${isRight ? theme.bg : 'var(--ifm-background-surface-color)'}`,
            display: 'none' // Tail is hard to do with borders perfectly, using simplified bubble for now
          }} />
          {children}
        </div>
      </div>
    </div>
  );
};

export default Dialogue;
