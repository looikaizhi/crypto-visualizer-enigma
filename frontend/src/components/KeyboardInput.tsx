import React from 'react';
import './KeyboardInput.css';

interface KeyboardInputProps {
  onKeyPress: (letter: string) => void;
}

const KeyboardInput: React.FC<KeyboardInputProps> = ({ onKeyPress }) => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  return (
    <div className="keyboard-container">
      <div className="keyboard">
        {alphabet.map((letter) => (
          <button
            key={letter}
            className="keyboard-key"
            onClick={() => onKeyPress(letter)}
          >
            {letter}
          </button>
        ))}
      </div>
    </div>
  );
};

export default KeyboardInput; 