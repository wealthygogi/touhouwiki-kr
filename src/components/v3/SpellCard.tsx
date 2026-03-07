import React from 'react';

interface SpellCardRowProps {
  number: number | string;
  name: string;
  owner: string;
}

interface SpellCardTableProps {
  title?: string;
  children: React.ReactNode;
}

export const SpellCardRow: React.FC<SpellCardRowProps> = ({ number, name, owner }) => {
  return (
    <tr>
      <td style={{
        textAlign: 'center',
        fontWeight: 'bold',
        fontFamily: 'var(--ifm-font-family-monospace)',
        width: '3rem',
        color: 'var(--ifm-color-primary)',
      }}>
        {number}
      </td>
      <td>{name}</td>
      <td style={{ color: 'var(--ifm-color-emphasis-700)' }}>{owner}</td>
    </tr>
  );
};

export const SpellCardTable: React.FC<SpellCardTableProps> = ({ title, children }) => {
  return (
    <div style={{ marginBottom: '2rem' }}>
      {title && (
        <h3 style={{
          borderBottom: '2px solid var(--ifm-color-primary)',
          paddingBottom: '0.4rem',
          marginBottom: '0',
        }}>
          {title}
        </h3>
      )}
      <table style={{ width: '100%' }}>
        <thead>
          <tr>
            <th style={{ width: '3rem', textAlign: 'center' }}>#</th>
            <th>Name</th>
            <th style={{ width: '8rem' }}>Owner</th>
          </tr>
        </thead>
        <tbody>
          {children}
        </tbody>
      </table>
    </div>
  );
};
