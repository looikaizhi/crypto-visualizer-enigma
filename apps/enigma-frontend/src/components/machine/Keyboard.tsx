import React from 'react';
import { QWERTZ_ROWS } from './layout';
import './Keyboard.css';

interface KeyboardProps {
  onKeyPress: (letter: string) => void;
  disabled?: boolean;
  pressedKey?: string | null;
}

const Keyboard: React.FC<KeyboardProps> = ({
  onKeyPress,
  disabled = false,
  pressedKey,
}) => {
  return (
    <div className="kb-panel mat-bakelite" role="group" aria-label="Enigma 键盘">
      {QWERTZ_ROWS.map((row, ri) => (
        <div className="kb-row" key={ri}>
          {row.map((letter) => (
            <button
              key={letter}
              type="button"
              className={`kb-key focus-brass${
                pressedKey === letter ? ' kb-key--pressed' : ''
              }`}
              onClick={() => onKeyPress(letter)}
              disabled={disabled}
              aria-label={`字母 ${letter} 键`}
            >
              {letter}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Keyboard;
