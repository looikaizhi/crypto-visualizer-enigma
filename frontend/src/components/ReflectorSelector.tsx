import React from 'react';
import './ReflectorSelector.css';

interface Reflector {
  index: string;
  wiring: string;
}

interface ReflectorSelectorProps {
  selectedReflector: string;
  availableReflectors: Reflector[];
  onReflectorChange: (reflector: string) => void;
}

const ReflectorSelector: React.FC<ReflectorSelectorProps> = ({
  selectedReflector,
  availableReflectors,
  onReflectorChange,
}) => {
  return (
    <div className="reflector-selector-container">
      <h3>反射器配置</h3>
      <div className="reflector-select-wrapper">
        <select
          value={selectedReflector}
          onChange={(e) => onReflectorChange(e.target.value)}
          className="reflector-select"
        >
          {availableReflectors.map((name) => (
            <option key={name.index} value={name.wiring}>
              反射器 {name.index}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default ReflectorSelector; 