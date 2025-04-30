import React from 'react';
import './LampBoard.css';

interface LampBoardProps {
  activeLetter: string | null;
}

const LampBoard: React.FC<LampBoardProps> = ({ activeLetter }) => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  return (
    <div className="lampboard-container">
      <div className="lampboard">
        {alphabet.map((letter) => (
          <div
            key={letter}
            className={`lamp ${activeLetter === letter ? 'lamp-active' : ''}`}
          >
            {letter}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LampBoard; 