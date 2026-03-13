import React from 'react';

interface JapaneseOriginalProps {
  children: React.ReactNode;
}

const JapaneseOriginal: React.FC<JapaneseOriginalProps> = ({ children }) => {
  return (
    <details className="japanese-original">
      <summary>일본어 원문</summary>
      <div className="japanese-original__content">
        {children}
      </div>
    </details>
  );
};

export default JapaneseOriginal;
