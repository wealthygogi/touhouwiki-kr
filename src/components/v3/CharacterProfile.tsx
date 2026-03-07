import React from 'react';

interface CharacterProfileProps {
  name: string;
  nameJa?: string;
  nameEn?: string;
  title?: string;
  stage?: string;
  species?: string;
  ability?: string;
  location?: string;
  personality?: string;
  themeColor?: string;
  image?: string;
  children: React.ReactNode;
}

const InfoBadge: React.FC<{ label: string; value?: string; color: string }> = ({ label, value, color }) => {
  if (!value) return null;
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--ifm-color-emphasis-100)',
      padding: '12px 16px',
      borderRadius: '12px',
      borderLeft: `4px solid ${color}`,
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      flex: '1 1 200px'
    }}>
      <span style={{ 
        fontSize: '0.7rem', 
        fontWeight: 'bold', 
        color: 'var(--ifm-color-emphasis-600)',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        marginBottom: '6px'
      }}>
        {label}
      </span>
      <span style={{ 
        fontSize: '0.95rem', 
        color: 'var(--ifm-color-emphasis-900)',
        lineHeight: '1.5',
        fontWeight: '500'
      }}>
        {value}
      </span>
    </div>
  );
};

const CharacterProfile: React.FC<CharacterProfileProps> = ({ 
  name, 
  nameJa,
  nameEn,
  title, 
  stage,
  species, 
  ability, 
  location, 
  personality,
  themeColor = 'var(--ifm-color-primary)',
  image, 
  children 
}) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem',
      marginBottom: '4rem',
      marginTop: '1rem',
    }}>
      {/* Hero Banner Area */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap-reverse',
        background: `linear-gradient(135deg, var(--ifm-background-surface-color) 0%, var(--ifm-color-emphasis-100) 100%)`,
        borderRadius: '24px',
        border: '1px solid var(--ifm-color-emphasis-200)',
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
        position: 'relative'
      }}>
        {/* Decorative background stripe */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, height: '6px',
          background: `linear-gradient(90deg, ${themeColor}, ${themeColor}88)`
        }} />

        {/* Text Content */}
        <div style={{
          flex: '3',
          minWidth: '300px',
          padding: '2.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          {stage && (
            <span style={{
              display: 'inline-block',
              alignSelf: 'flex-start',
              padding: '4px 12px',
              borderRadius: '20px',
              backgroundColor: `${themeColor}22`,
              color: themeColor,
              fontSize: '0.75rem',
              fontWeight: '800',
              marginBottom: '1rem',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              {stage}
            </span>
          )}
          
          <h2 style={{
            fontSize: '2.4rem',
            fontWeight: '900',
            color: 'var(--ifm-color-emphasis-900)',
            margin: '0 0 0.2rem 0',
            lineHeight: '1.2',
            letterSpacing: '-1px'
          }}>
            {name}
          </h2>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            marginBottom: '1.5rem'
          }}>
            {/* Multilingual Names */}
            {(nameJa || nameEn) && (
              <div style={{ fontSize: '0.9rem', color: 'var(--ifm-color-emphasis-600)', opacity: 0.8 }}>
                {nameJa} {nameEn && `· ${nameEn}`}
              </div>
            )}
            
            {/* Title (이명) */}
            {title && (
              <div style={{
                fontSize: '1.1rem',
                color: themeColor,
                fontWeight: '600',
                fontStyle: 'italic'
              }}>
                {title}
              </div>
            )}
          </div>

          {/* Quick Info Badges */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            marginTop: 'auto'
          }}>
            <InfoBadge label="종족" value={species} color={themeColor} />
            <InfoBadge label="능력" value={ability} color={themeColor} />
            <InfoBadge label="거처" value={location} color={themeColor} />
            <InfoBadge label="성격" value={personality} color={themeColor} />
          </div>
        </div>

        {/* Image Area */}
        {image && (
          <div style={{
            flex: '2',
            minWidth: '250px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            padding: '2rem 2rem 0 2rem',
            background: `radial-gradient(circle at center, ${themeColor}15 0%, transparent 70%)`
          }}>
            <img 
              src={image} 
              alt={name} 
              style={{
                width: '100%',
                maxWidth: '350px',
                height: 'auto',
                maxHeight: '400px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.15))',
                transform: 'scale(1.05)',
                transformOrigin: 'bottom center'
              }} 
            />
          </div>
        )}
      </div>

      {/* Detail Content Area */}
      <div style={{
        padding: '0 1rem'
      }}>
        {/* Main Body */}
        <div style={{
          fontSize: '1.05rem',
          lineHeight: '1.85',
          color: 'var(--ifm-color-emphasis-900)',
          textAlign: 'justify'
        }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default CharacterProfile;
