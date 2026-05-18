import React from 'react';
import { useTranslation } from 'react-i18next';
import { QWERTZ_ROWS } from './layout';
import Tape from './Tape';
import './LampBoard.css';

interface LampBoardProps {
  activeLetter: string | null;
  compact?: boolean;
  outputText?: string;
}

const LampBoard: React.FC<LampBoardProps> = ({
  activeLetter,
  compact = false,
  outputText,
}) => {
  const { t } = useTranslation();
  return (
    <div className={`lamp-panel mat-bakelite${compact ? ' lamp-panel--compact' : ''}`}>
      <div
        className="lamp-grid"
        role="group"
        aria-label={t('lamp.aria.board')}
        aria-live="polite"
      >
        {QWERTZ_ROWS.map((row, ri) => (
          <div className="lamp-row" key={ri}>
            {row.map((letter) => {
              const lit = activeLetter === letter;
              return (
                <div
                  key={letter}
                  className={`lamp${lit ? ' lamp--lit' : ''}`}
                  aria-label={t('lamp.aria.letter', {
                    letter,
                    state: t(lit ? 'lamp.state.on' : 'lamp.state.off'),
                  })}
                >
                  <span className="lamp-letter">{letter}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {outputText !== undefined && <Tape kind="out" text={outputText} />}
    </div>
  );
};

export default LampBoard;
