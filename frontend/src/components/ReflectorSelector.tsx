import React from 'react';
import './ReflectorSelector.css';

interface ReflectorSelectorProps {
  selectedReflector: string;
  availableReflectors: string[];
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
            <option key={name} value={name}>
              反射器 {name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default ReflectorSelector; 