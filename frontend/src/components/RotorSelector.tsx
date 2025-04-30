import React from 'react';
import './RotorSelector.css';

interface Rotor {
  name: string;
  position: string;
}

interface RotorSelectorProps {
  rotors: Rotor[];
  availableRotors: string[];
  onRotorChange: (index: number, name: string) => void;
  onPositionChange: (index: number, position: string) => void;
}

const RotorSelector: React.FC<RotorSelectorProps> = ({
  rotors,
  availableRotors,
  onRotorChange,
  onPositionChange,
}) => {
  const positions = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  return (
    <div className="rotor-selector-container">
      <h3>转子配置</h3>
      <div className="rotors-grid">
        {rotors.map((rotor, index) => (
          <div key={index} className="rotor-config">
            <div className="rotor-label">转子 {index + 1}</div>
            <select
              value={rotor.name}
              onChange={(e) => onRotorChange(index, e.target.value)}
              className="rotor-select"
            >
              {availableRotors.map((name) => (
                <option key={name} value={name}>
                  转子 {name}
                </option>
              ))}
            </select>
            <select
              value={rotor.position}
              onChange={(e) => onPositionChange(index, e.target.value)}
              className="position-select"
            >
              {positions.map((pos) => (
                <option key={pos} value={pos}>
                  位置 {pos}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RotorSelector; 