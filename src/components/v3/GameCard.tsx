import React, { useState, useEffect, useRef } from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './GameCard.module.css';

/* ──────────────────────────────────────────────
   Types
────────────────────────────────────────────── */
export interface GameEntry {
  id: string;          // e.g. "Th06"
  nameKr: string;      // e.g. "동방홍마향"
  gradient: string;    // CSS gradient string for background
  badge?: string;      // e.g. "슈팅"
  coverImage?: string; // e.g. "/img/cover/th06_embodiment_of_scarlet_devil.webp"
}

export interface CharChip {
  id: string;
  name: string;
  imagePath?: string;
  emoji?: string;
  href: string;
}

export interface HubLinkTile {
  icon: string;
  label: string;
  href: string;
}

export interface GameGridHubProps {
  games: GameEntry[];
  /** Which game to show in the hub by default (id) */
  defaultActiveId: string;
  /** Hub content for each game, keyed by game id */
  hubContent: Record<string, {
    titleKr: string;
    titleJa: string;
    gradient: string;
    chars: CharChip[];
    links: HubLinkTile[];
    dialogueChars?: { name: string; imagePath?: string; links: { label: string; href: string }[] }[];
  }>;
}

/* ──────────────────────────────────────────────
   Sub-components
────────────────────────────────────────────── */
const BaseUrlLink: React.FC<{ href: string; className?: string; children: React.ReactNode }> = ({ href, className, children }) => {
  const url = useBaseUrl(href);
  return <a href={url} className={className}>{children}</a>;
};

const CharChipItem: React.FC<{ chip: CharChip }> = ({ chip }) => {
  const imgUrl = useBaseUrl(chip.imagePath || '/placeholder');
  const hrefUrl = useBaseUrl(chip.href);
  const hasImage = !!chip.imagePath;
  return (
    <a href={hrefUrl} className={styles.charChip}>
      {hasImage ? (
        <img src={imgUrl} alt={chip.name} className={styles.charChipImg} />
      ) : (
        <div className={styles.charChipFallback}>{chip.emoji ?? chip.name[0]}</div>
      )}
      <span className={styles.charChipName}>{chip.name}</span>
    </a>
  );
};

const DialogueCharItem: React.FC<{ dc: { name: string; imagePath?: string; links: { label: string; href: string }[] } }> = ({ dc }) => {
  const imgUrl = useBaseUrl(dc.imagePath || '/placeholder');
  const hasImage = !!dc.imagePath;
  return (
    <div className={styles.dialogueRow}>
      {hasImage ? (
        <img src={imgUrl} alt={dc.name} className={styles.dialogueAvatar} />
      ) : (
        <div className={styles.dialogueAvatarFallback}>{dc.name[0]}</div>
      )}
      <span className={styles.dialogueCharName}>{dc.name}</span>
      <div className={styles.dialogueLinks}>
        {dc.links.map((link) => (
          <BaseUrlLink key={link.label} href={link.href} className={styles.dialogueLink}>
            {link.label}
          </BaseUrlLink>
        ))}
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────
   Main Component
────────────────────────────────────────────── */
const GameGridHub: React.FC<GameGridHubProps> = ({
  games,
  defaultActiveId,
  hubContent,
}) => {
  const getInitialId = () => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      const match = games.find((g) => g.id.toLowerCase() === hash);
      if (match) return match.id;
    }
    return defaultActiveId;
  };

  const [activeId, setActiveId] = useState(getInitialId);
  const hubRef = useRef<HTMLDivElement>(null);

  // Update hash when game is selected
  const selectGame = (id: string) => {
    setActiveId(id);
    window.history.replaceState(null, '', `#${id}`);
  };

  // Listen for hash changes (e.g., back/forward navigation)
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      const match = games.find((g) => g.id.toLowerCase() === hash);
      if (match) {
        setActiveId(match.id);
        hubRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    window.addEventListener('hashchange', onHashChange);
    // Scroll to hub on initial load if hash is present
    if (window.location.hash && hubRef.current) {
      hubRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [games]);

  const hub = hubContent[activeId];
  const activeGame = games.find((g) => g.id === activeId);
  const baseUrl = useBaseUrl('/');
  const resolvePath = (p: string) => p.startsWith('/') ? baseUrl + p.slice(1) : p;

  return (
    <>
      {/* ─── Game Selection Grid ─── */}
      <div className={styles.gridSection}>
        <div className={styles.gridHeader}>
          <div className={styles.gridEyebrow}>동방 프로젝트</div>
          <h2 className={styles.gridTitle}>게임 선택</h2>
        </div>
        <div className={styles.gameGrid}>
          {games.map((game) => (
            <div
              key={game.id}
              className={`${styles.gameCard} ${activeId === game.id ? styles.active : ''}`}
              onClick={() => selectGame(game.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && selectGame(game.id)}
              aria-pressed={activeId === game.id}
              aria-label={`${game.nameKr} 선택`}
            >
              <div className={styles.gameCardThumb}>
                <div
                  className={styles.gameCardBg}
                  style={game.coverImage ? {
                    backgroundImage: `url(${resolvePath(game.coverImage)})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center top',
                  } : { background: game.gradient }}
                />
              </div>
              <div className={styles.gameCardInfo}>
                {game.badge && (
                  <span className={styles.gameCardBadge}>{game.badge}</span>
                )}
                <span className={styles.gameCardName}>{game.nameKr}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Hub Panel ─── */}
      {hub && (
        <div ref={hubRef} className={styles.hubSection}>
          {/* Banner */}
          <div className={styles.hubBanner}>
            <div
              className={styles.hubBannerBg}
              style={activeGame?.coverImage ? {
                backgroundImage: `url(${resolvePath(activeGame.coverImage)})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center top',
              } : { background: hub.gradient }}
            />
            <div className={styles.hubBannerOverlay} />
            <div className={styles.hubBannerContent}>
              <div className={styles.hubBannerEyebrow}>{activeId}</div>
              <h2 className={styles.hubBannerTitle}>{hub.titleKr}</h2>
              <p className={styles.hubBannerJa}>{hub.titleJa}</p>
            </div>
          </div>

          {/* Characters */}
          <div className={styles.sectionLabel}>등장인물</div>
          <div className={styles.characterRow}>
            {hub.chars.map((chip) => (
              <CharChipItem key={chip.id} chip={chip} />
            ))}
          </div>

          {/* Dialogue Characters */}
          {hub.dialogueChars && hub.dialogueChars.length > 0 && (
            <>
              <div className={styles.sectionLabel}>대사집</div>
              <div className={styles.dialogueList}>
                {hub.dialogueChars.map((dc) => {
                  if (dc.imagePath) return <DialogueCharItem key={dc.name} dc={dc} />;
                  // Search current game first, then all games
                  const img = hub.chars.find((c) => c.name === dc.name)?.imagePath
                    || Object.values(hubContent).flatMap((h) => h.chars).find((c) => c.name === dc.name)?.imagePath;
                  return <DialogueCharItem key={dc.name} dc={img ? { ...dc, imagePath: img } : dc} />;
                })}
              </div>
            </>
          )}

          {/* Links */}
          <div className={styles.sectionLabel}>바로가기</div>
          <div className={styles.linkGrid}>
            {hub.links.map((link) => (
              <BaseUrlLink key={link.label} href={link.href} className={styles.linkTile}>
                <span className={styles.linkTileIcon}>{link.icon}</span>
                {link.label}
              </BaseUrlLink>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default GameGridHub;
