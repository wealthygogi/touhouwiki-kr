import type { ReactNode } from "react";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import Heading from "@theme/Heading";

import styles from "./index.module.css";

// ── Game data ──
const GAME_HIGHLIGHTS = [
  { id: "Th06", num: "06", name: "동방홍마향", badge: "슈팅 · 2002" },
  { id: "Th07", num: "07", name: "동방요요몽", badge: "슈팅 · 2003" },
  { id: "Th08", num: "08", name: "동방영야초", badge: "슈팅 · 2004" },
  { id: "Th09", num: "09", name: "동방화영총", badge: "슈팅 · 2005" },
  { id: "Th10", num: "10", name: "동방풍신록", badge: "슈팅 · 2007" },
  { id: "Th11", num: "11", name: "동방지령전", badge: "슈팅 · 2008" },
  { id: "Th12", num: "12", name: "동방성련선", badge: "슈팅 · 2009" },
];

// ── Music data ──
const MUSIC_HIGHLIGHTS = [
  { slug: "dolls-in-pseudo-paradise", title: "봉래인형 ~ Dolls in Pseudo Paradise" },
  { slug: "changeability-of-strange-dream", title: "몽위과학세기 ~ Changeability of Strange Dream" },
  { slug: "ghostly-field-club", title: "렌다이노 야행 ~ Ghostly Field Club" },
];

// ── Toy data ──
const TOY_ITEMS = [
  { slug: "touhou-favorites-chart", icon: "\u2B50", title: "최애표" },
  { slug: "introduce", icon: "\u{1F4C4}", title: "자기소개서" },
  { slug: "gacha", icon: "\u{1F3B2}", title: "가챠" },
  { slug: "replay-scoreboard", icon: "\u{1F4CA}", title: "리플레이 스코어보드" },
];

function HomepageHero() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={styles.hero}>
      <Heading as="h1" className={styles.heroTitle}>
        {siteConfig.title}
      </Heading>
      <p className={styles.heroTagline}>동방 프로젝트 한국어 위키</p>
      <div className={styles.heroButtons}>
        <Link className={styles.btnPrimary} to="/docs/games">
          게임 둘러보기
        </Link>
        <Link className={styles.btnSecondary} to="/docs/music/">
          음악 감상
        </Link>
        <Link className={styles.btnSecondary} to="/docs/toy/intro">
          장난감
        </Link>
      </div>
    </header>
  );
}

function GameSection() {
  const totalGames = 27;
  const shownGames = GAME_HIGHLIGHTS.length;
  const remaining = totalGames - shownGames;

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <Heading as="h2" className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>{"\u{1F3AE}"}</span> 게임
        </Heading>
        <Link className={styles.sectionMore} to="/docs/games">
          전체 보기 →
        </Link>
      </div>
      <div className={styles.gameGrid}>
        {GAME_HIGHLIGHTS.map((g) => (
          <Link
            key={g.id}
            className={styles.gameCard}
            to={`/docs/games#${g.id}`}
          >
            <div className={styles.gameNum}>{g.num}</div>
            <div className={styles.gameName}>{g.name}</div>
            <div className={styles.gameBadge}>{g.badge}</div>
          </Link>
        ))}
        <Link
          className={`${styles.gameCard} ${styles.gameMore}`}
          to="/docs/games"
        >
          <div className={styles.gameMoreNum}>+{remaining}</div>
          <div className={styles.gameMoreLabel}>더 많은 게임</div>
          <div className={styles.gameMoreSub}>슈팅 · 격투 · 외전</div>
        </Link>
      </div>
    </div>
  );
}

function MusicSection() {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <Heading as="h2" className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>{"\u{1F3B5}"}</span> 음악
        </Heading>
        <Link className={styles.sectionMore} to="/docs/music">
          전체 보기 →
        </Link>
      </div>
      <div className={styles.musicGrid}>
        {MUSIC_HIGHLIGHTS.map((m) => (
          <Link
            key={m.slug}
            className={styles.musicCard}
            to={`/docs/music/${m.slug}/`}
          >
            <div className={styles.musicLabel}>ZUN's Music Collection</div>
            <div className={styles.musicTitle}>{m.title}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ToySection() {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <Heading as="h2" className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>{"\u{1F52E}"}</span> 장난감
        </Heading>
        <Link className={styles.sectionMore} to="/docs/toy/intro">
          전체 보기 →
        </Link>
      </div>
      <div className={styles.toyGrid}>
        {TOY_ITEMS.map((t) => (
          <Link
            key={t.slug}
            className={styles.toyCard}
            to={`/docs/toy/${t.slug}`}
          >
            <span className={styles.toyIcon}>{t.icon}</span>
            <div className={styles.toyTitle}>{t.title}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Credits() {
  return (
    <div className={styles.credits}>
      <div className={styles.creditBadge}>
        <strong className={styles.creditLabel}>글 출처</strong>
        <a href="https://www.thpatch.net/" target="_blank" rel="noopener noreferrer">
          thpatch.net
        </a>
      </div>
      <div className={styles.creditBadge}>
        <strong className={styles.creditLabel}>그림 출처</strong>
        <a href="https://x.com/dairi155" target="_blank" rel="noopener noreferrer">
          @dairi155
        </a>
      </div>
      <div className={styles.creditBadge}>
        <strong className={styles.creditLabel}>License</strong>
        <a
          href="https://creativecommons.org/licenses/by/4.0/deed.en"
          target="_blank"
          rel="noopener noreferrer"
        >
          CC BY-SA 4.0
        </a>
      </div>
    </div>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout
      title="홈"
      description="동방 프로젝트 한국어 위키 — 캐릭터, 대사집, 음악, 스펠카드"
    >
      <HomepageHero />
      <main>
        <div className={styles.sections}>
          <GameSection />
          <MusicSection />
          <ToySection />
        </div>
        <Credits />
      </main>
    </Layout>
  );
}
