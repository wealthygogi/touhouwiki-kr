import React from 'react';

interface ScenarioStageProps {
  title: string;
  number?: string | number;
  description?: string;
  children: React.ReactNode;
}

const ScenarioStage: React.FC<ScenarioStageProps> = ({ title, number, description, children }) => {
  return (
    <div style={{
      marginBottom: '4rem',
      padding: '1.5rem',
      borderRadius: '16px',
      backgroundColor: 'var(--ifm-color-emphasis-100)',
      border: '1px solid var(--ifm-color-emphasis-200)',
    }}>
      <div style={{
        marginBottom: '2rem',
        borderBottom: '2px solid var(--ifm-color-primary)',
        paddingBottom: '1rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '0.75rem',
          marginBottom: '0.5rem'
        }}>
          {number && (
            <span style={{
              fontSize: '1.2rem',
              fontWeight: 'bold',
              color: 'var(--ifm-color-primary)',
              textTransform: 'uppercase'
            }}>
              Stage {number}
            </span>
          )}
          <h3 style={{
            margin: 0,
            fontSize: '1.8rem',
            fontWeight: '800',
            color: 'var(--ifm-color-emphasis-900)'
          }}>
            {title}
          </h3>
        </div>
        {description && (
          <p style={{
            margin: 0,
            fontSize: '1rem',
            color: 'var(--ifm-color-emphasis-600)',
            fontStyle: 'italic'
          }}>
            {description}
          </p>
        )}
      </div>
      
      <div>
        {children}
      </div>
    </div>
  );
};

export default ScenarioStage;
