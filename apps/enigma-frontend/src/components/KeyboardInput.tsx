import React from 'react';
import './KeyboardInput.css';

interface KeyboardInputProps {
  onKeyPress: (letter: string) => void;
  disabled?: boolean;
}

const KeyboardInput: React.FC<KeyboardInputProps> = ({ onKeyPress, disabled = false }) => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  return (
    <div className="keyboard-container">
      <div className="keyboard">
        {alphabet.map((letter) => (
          <button
            key={letter}
            className="keyboard-key"
            onClick={() => onKeyPress(letter)}
            disabled={disabled}
          >
            {letter}
          </button>
        ))}
      </div>
    </div>
  );
};

export default KeyboardInput; 