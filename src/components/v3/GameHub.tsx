import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './GameHub.module.css';

interface Character {
  id: string;
  name: string;
  imagePath?: string;
  emoji?: string;
  href: string;
}

interface DialogueCharacter {
  name: string;
  imagePath?: string;
  links: { label: string; href: string }[];
}

interface QuickLink {
  icon: string;
  label: string;
  sub: string;
  href: string;
}

interface GameHubProps {
  gameId: string;
  titleKr: string;
  titleJa: string;
  releaseDate?: string;
  developer?: string;
  genre?: string;
  badge?: string;
  characters?: Character[];
  dialogueCharacters?: DialogueCharacter[];
  quickLinks?: QuickLink[];
  storySummary?: string;
}

const BaseUrlLink: React.FC<{ href: string; className?: string; children: React.ReactNode }> = ({ href, className, children }) => {
  const url = useBaseUrl(href);
  return <a href={url} className={className}>{children}</a>;
};

const DialogueRow: React.FC<{ dc: DialogueCharacter }> = ({ dc }) => {
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

const CharacterPortrait: React.FC<{ char: Character }> = ({ char }) => {
  const imgUrl = useBaseUrl(char.imagePath || '/placeholder');
  const hrefUrl = useBaseUrl(char.href);
  const hasImage = !!char.imagePath;
  return (
    <a href={hrefUrl} className={styles.characterCard}>
      {hasImage ? (
        <img
          src={imgUrl}
          alt={char.name}
          className={styles.characterPortrait}
        />
      ) : (
        <div className={styles.characterPortraitFallback}>
          {char.emoji ?? char.name[0]}
        </div>
      )}
      <span className={styles.characterName}>{char.name}</span>
    </a>
  );
};

const GameHub: React.FC<GameHubProps> = ({
  gameId,
  titleKr,
  titleJa,
  releaseDate,
  developer,
  genre,
  badge,
  characters = [],
  dialogueCharacters = [],
  quickLinks = [],
  storySummary,
}) => {
  return (
    <div className={styles.hub}>
      {/* ─── Hero Banner ─── */}
      <div className={styles.heroBanner}>
        <div className={styles.heroTop}>
          <div className={styles.heroEyebrow}>{gameId}</div>
          <h1 className={styles.heroTitle}>{titleKr}</h1>
          <p className={styles.heroJa}>{titleJa}</p>
          <div className={styles.heroMeta}>
            {badge && <span className={styles.heroPill}>{badge}</span>}
            {releaseDate && <span className={styles.heroPill}><strong>출시</strong>{releaseDate}</span>}
            {developer && <span className={styles.heroPill}><strong>개발</strong>{developer}</span>}
            {genre && <span className={styles.heroPill}><strong>장르</strong>{genre}</span>}
          </div>
        </div>
      </div>

      {/* ─── Story Summary ─── */}
      {storySummary && (
        <>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>줄거리</span>
            <div className={styles.sectionHeaderLine} />
          </div>
          <div className={styles.storySummary}>{storySummary}</div>
        </>
      )}

      {/* ─── Characters ─── */}
      {characters.length > 0 && (
        <>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>등장인물</span>
            <div className={styles.sectionHeaderLine} />
          </div>
          <div className={styles.characterGrid}>
            {characters.map((char) => (
              <CharacterPortrait key={char.id} char={char} />
            ))}
          </div>
        </>
      )}

      {/* ─── Dialogue ─── */}
      {dialogueCharacters.length > 0 && (
        <>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>대사집</span>
            <div className={styles.sectionHeaderLine} />
          </div>
          <div className={styles.dialogueList}>
            {dialogueCharacters.map((dc) => (
              <DialogueRow key={dc.name} dc={dc} />
            ))}
          </div>
        </>
      )}

      {/* ─── Quick Links ─── */}
      {quickLinks.length > 0 && (
        <>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>바로가기</span>
            <div className={styles.sectionHeaderLine} />
          </div>
          <div className={styles.quickLinkGrid}>
            {quickLinks.map((ql) => (
              <BaseUrlLink key={ql.label} href={ql.href} className={styles.quickLink}>
                <span className={styles.quickLinkIcon}>{ql.icon}</span>
                <span className={styles.quickLinkLabel}>{ql.label}</span>
                <span className={styles.quickLinkSub}>{ql.sub}</span>
              </BaseUrlLink>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default GameHub;
