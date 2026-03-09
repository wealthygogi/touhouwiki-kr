import React from 'react';

interface ActionProps {
  children: React.ReactNode;
}

function OrnamentBar(): React.JSX.Element {
  return (
    <div style={{
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    }}>
      <div style={{
        flex: 1,
        height: '1px',
        background: 'linear-gradient(to right, transparent, var(--ifm-color-emphasis-300))',
      }} />
      <div style={{
        width: '4px',
        height: '4px',
        borderRadius: '50%',
        backgroundColor: 'var(--ifm-color-primary)',
        opacity: 0.6,
      }} />
      <div style={{
        width: '4px',
        height: '4px',
        borderRadius: '50%',
        backgroundColor: 'var(--ifm-color-primary)',
        opacity: 0.6,
      }} />
      <div style={{
        flex: 1,
        height: '1px',
        background: 'linear-gradient(to left, transparent, var(--ifm-color-emphasis-300))',
      }} />
    </div>
  );
}

const Action: React.FC<ActionProps> = ({ children }) => {
  return (
    <div style={{
      margin: '2rem auto',
      maxWidth: '640px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0',
    }}>
      <OrnamentBar />
      <div style={{
        width: '100%',
        padding: '0.9rem 1.75rem',
        backgroundColor: 'var(--ifm-color-emphasis-100)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderBottom: 'none',
        textAlign: 'center',
        fontStyle: 'italic',
        fontSize: '0.92rem',
        lineHeight: '1.7',
        color: 'var(--ifm-color-emphasis-700)',
        whiteSpace: 'pre-wrap',
        fontWeight: 500,
        letterSpacing: '0.01em',
      }}>
        {children}
      </div>
      <OrnamentBar />
    </div>
  );
};

export default Action;
