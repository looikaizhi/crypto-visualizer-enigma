import React from 'react';
import { useTranslation } from 'react-i18next';
import { QWERTZ_ROWS } from './layout';
import Tape from './Tape';
import './Keyboard.css';

interface KeyboardProps {
  onKeyPress: (letter: string) => void;
  disabled?: boolean;
  pressedKey?: string | null;
  compact?: boolean;
  inputText?: string;
}

const Keyboard: React.FC<KeyboardProps> = ({
  onKeyPress,
  disabled = false,
  pressedKey,
  compact = false,
  inputText,
}) => {
  const { t } = useTranslation();
  return (
    <div className={`kb-panel mat-bakelite${compact ? ' kb-panel--compact' : ''}`}>
      <div className="kb-grid" role="group" aria-label={t('keyboard.aria.board')}>
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
                aria-label={t('keyboard.aria.key', { letter })}
              >
                {letter}
              </button>
            ))}
          </div>
        ))}
      </div>
      {inputText !== undefined && <Tape kind="in" text={inputText} />}
    </div>
  );
};

export default Keyboard;
