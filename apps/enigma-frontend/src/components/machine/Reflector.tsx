import React from 'react';
import type { Reflector as ReflectorType } from '../../services/api';
import './Reflector.css';

interface ReflectorProps {
  selected: string;
  available: ReflectorType[];
  onChange: (reflector: string) => void;
}

const Reflector: React.FC<ReflectorProps> = ({
  selected,
  available,
  onChange,
}) => {
  const cycle = () => {
    const order = available.length
      ? available.map((r) => r.index)
      : ['A', 'B', 'C'];
    const i = order.indexOf(selected);
    onChange(order[(i + 1) % order.length]);
  };

  return (
    <div className="reflector" aria-label="反射器">
      <span className="reflector-label engrave">UKW</span>
      <button
        type="button"
        className="reflector-disc focus-brass"
        onClick={cycle}
        aria-label={`反射器 ${selected || 'B'}，点击切换`}
      >
        <span className="reflector-glyph">{selected || 'B'}</span>
      </button>
      <span className="reflector-hint engrave">反射器</span>
    </div>
  );
};

export default Reflector;
