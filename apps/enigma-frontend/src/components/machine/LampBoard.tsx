import React from 'react';
import { QWERTZ_ROWS } from './layout';
import './LampBoard.css';

interface LampBoardProps {
  activeLetter: string | null;
}

const LampBoard: React.FC<LampBoardProps> = ({ activeLetter }) => {
  return (
    <div
      className="lamp-panel mat-bakelite"
      role="group"
      aria-label="指示灯板"
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
                aria-label={`字母 ${letter} 指示灯，${lit ? '点亮' : '熄灭'}`}
              >
                <span className="lamp-letter">{letter}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default LampBoard;
