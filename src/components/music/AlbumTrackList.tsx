import React from 'react';

interface Track {
  number: number;
  title: string;
  originalTitle: string;
  note?: string;
}

interface AlbumTrackListProps {
  tracks: Track[];
  themeColor?: string;
}

const AlbumTrackList: React.FC<AlbumTrackListProps> = ({
  tracks,
  themeColor = '#7c3aed',
}) => {
  return (
    <div style={{
      marginBottom: '2rem',
      borderRadius: '12px',
      overflow: 'hidden',
      border: '1px solid var(--ifm-color-emphasis-200)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    }}>
      <div style={{
        padding: '0.6rem 1rem',
        background: `linear-gradient(135deg, ${themeColor}, ${themeColor}dd)`,
        color: 'white',
        fontWeight: 600,
        fontSize: '0.85rem',
        letterSpacing: '0.02em',
      }}>
        Track List
      </div>
      {tracks.map((track, i) => (
        <div
          key={track.number}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.6rem 1rem',
            borderBottom: i < tracks.length - 1
              ? '1px solid var(--ifm-color-emphasis-100)'
              : 'none',
            background: i % 2 === 0
              ? 'var(--ifm-background-color)'
              : 'var(--ifm-background-surface-color)',
          }}
        >
          <span style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: `${themeColor}18`,
            color: themeColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 700,
            flexShrink: 0,
            fontFamily: 'var(--ifm-font-family-monospace)',
          }}>
            {String(track.number).padStart(2, '0')}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontWeight: 500,
              fontSize: '0.9rem',
            }}>
              {track.title}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--ifm-color-emphasis-500)',
              fontStyle: 'italic',
            }}>
              {track.originalTitle}
            </div>
          </div>
          {track.note && (
            <span style={{
              fontSize: '0.7rem',
              color: 'var(--ifm-color-emphasis-400)',
              flexShrink: 0,
            }}>
              {track.note}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default AlbumTrackList;
