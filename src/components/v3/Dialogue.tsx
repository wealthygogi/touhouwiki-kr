import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { useColorMode } from '@docusaurus/theme-common';
import { getCharacterTheme } from './characterColors';

interface DialogueProps {
  speaker: string;
  children: React.ReactNode;
  align?: 'left' | 'right';
  avatar?: string;
}

interface CharacterTheme {
  text: string;
  bg: string;
  border: string;
}

// --- Sub-components ---

function AvatarCircle({
  speaker,
  avatar,
  theme,
}: {
  speaker: string;
  avatar?: string;
  theme: CharacterTheme;
}): React.ReactElement {
  const avatarUrl = avatar ? useBaseUrl(`/img/${avatar}.webp`) : null;

  return (
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
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    }}>
      {avatar ? (
        <img
          src={avatarUrl}
          alt={speaker}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
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
  );
}

function MessageBubble({
  speaker,
  children,
  isRight,
  theme,
}: {
  speaker: string;
  children: React.ReactNode;
  isRight: boolean;
  theme: CharacterTheme;
}): React.ReactElement {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: isRight ? 'flex-end' : 'flex-start',
      minWidth: 0,
    }}>
      {/* Name Label */}
      <div style={{
        fontSize: '0.8rem',
        fontWeight: 'bold',
        marginBottom: '0.25rem',
        color: theme.text,
        padding: '0 0.5rem',
        opacity: 0.9,
      }}>
        {speaker}
      </div>

      {/* Message Content */}
      <div style={{
        position: 'relative',
        padding: '0.35rem 0.75rem',
        backgroundColor: isRight ? theme.bg : 'var(--ifm-background-surface-color)',
        color: 'var(--ifm-font-color-base)',
        borderRadius: '14px',
        borderTopLeftRadius: isRight ? '14px' : '4px',
        borderTopRightRadius: isRight ? '4px' : '14px',
        border: `1px solid ${theme.border}44`,
        borderLeft: isRight ? `1px solid ${theme.border}44` : `4px solid ${theme.border}`,
        borderRight: isRight ? `4px solid ${theme.border}` : `1px solid ${theme.border}44`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        maxWidth: '90%',
        wordBreak: 'break-word' as const,
      }}>
        {/* Bubble Tail (hidden for now, kept for future use) */}
        <div style={{
          position: 'absolute',
          top: '0',
          [isRight ? 'right' : 'left']: '-8px',
          width: '0',
          height: '0',
          borderStyle: 'solid',
          borderWidth: isRight ? '0 0 10px 10px' : '0 10px 10px 0',
          borderColor: `transparent transparent transparent ${isRight ? theme.bg : 'var(--ifm-background-surface-color)'}`,
          display: 'none',
        }} />
        <div className="dialogue-content">
          {children}
        </div>
      </div>
    </div>
  );
}

// --- Main Component ---

const Dialogue: React.FC<DialogueProps> = ({ speaker, children, align = 'left', avatar }) => {
  const isRight = align === 'right';
  const { colorMode } = useColorMode();
  const theme = getCharacterTheme(speaker, avatar, colorMode === 'dark');

  return (
    <div style={{
      display: 'flex',
      flexDirection: isRight ? 'row-reverse' : 'row',
      marginBottom: '0.85rem',
      gap: '1rem',
      alignItems: 'flex-start',
    }}>
      <AvatarCircle speaker={speaker} avatar={avatar} theme={theme} />
      <MessageBubble speaker={speaker} isRight={isRight} theme={theme}>
        {children}
      </MessageBubble>
    </div>
  );
};

export default Dialogue;
