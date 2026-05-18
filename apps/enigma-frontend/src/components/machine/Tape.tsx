import React from 'react';
import { useTranslation } from 'react-i18next';
import './Tape.css';

interface TapeProps {
  kind: 'in' | 'out';
  text: string;
}

const Tape: React.FC<TapeProps> = ({ kind, text }) => {
  const { t } = useTranslation();
  const label = kind === 'in' ? 'IN' : 'OUT';
  const placeholder = t(kind === 'in' ? 'tape.placeholder.in' : 'tape.placeholder.out');
  return (
    <div className={`core-tape core-tape--${kind}`}>
      <span className="core-tape-label engrave">{label}</span>
      <div className="core-tape-strip" aria-live="polite">
        {text ? (
          <span className="core-tape-text">{text}</span>
        ) : (
          <span className="core-tape-empty">{placeholder}</span>
        )}
      </div>
    </div>
  );
};

export default Tape;
