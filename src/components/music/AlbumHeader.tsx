import React from 'react';

interface AlbumHeaderProps {
  cover: string;
  titleKr: string;
  titleJp?: string;
  titleEn?: string;
  sourceUrl?: string;
  themeColor?: string;
  children?: React.ReactNode;
}

const AlbumHeader: React.FC<AlbumHeaderProps> = ({
  cover,
  titleKr,
  titleJp,
  titleEn,
  sourceUrl,
  themeColor = '#7c3aed',
  children,
}) => {
  const subtitle = [titleJp, titleEn].filter(Boolean).join(' ~ ');

  return (
    <div style={{
      display: 'flex',
      gap: '2rem',
      marginBottom: '2rem',
      padding: '1.5rem',
      borderRadius: '16px',
      background: 'var(--ifm-background-surface-color)',
      border: '1px solid var(--ifm-color-emphasis-200)',
      boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
      flexWrap: 'wrap',
    }}>
      <div style={{
        flexShrink: 0,
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05)',
        alignSelf: 'flex-start',
      }}>
        <img
          src={cover}
          alt={titleKr}
          style={{
            height: 300,
            display: 'block',
            objectFit: 'cover',
          }}
        />
      </div>

      <div style={{
        flex: 1,
        minWidth: '250px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}>
        <div>
          <h2 style={{
            fontSize: '1.6rem',
            margin: 0,
            color: themeColor,
            fontWeight: 700,
          }}>
            {titleKr}
          </h2>
          {subtitle && (
            <p style={{
              fontSize: '1rem',
              margin: '0.25rem 0 0',
              color: 'var(--ifm-color-emphasis-600)',
              fontStyle: 'italic',
            }}>
              {subtitle}
            </p>
          )}
        </div>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.25rem 0.75rem',
          background: `${themeColor}15`,
          borderRadius: '20px',
          fontSize: '0.75rem',
          color: themeColor,
          fontWeight: 600,
          alignSelf: 'flex-start',
        }}>
          ZUN's Music Collection
        </div>

        {children && (
          <div style={{
            marginTop: '0.5rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--ifm-color-emphasis-200)',
            fontSize: '0.9rem',
            lineHeight: 1.7,
            color: 'var(--ifm-color-emphasis-700)',
          }}>
            {children}
          </div>
        )}

        <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '0.75rem',
                color: 'var(--ifm-color-emphasis-500)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              출처: touhouwiki
            </a>
          )}
          <div style={{
            fontSize: '0.7rem',
            color: 'var(--ifm-color-emphasis-400)',
            marginTop: '0.3rem',
          }}>
            이 문서는 기계 번역입니다.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlbumHeader;
