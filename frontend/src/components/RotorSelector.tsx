import React from 'react';
import './RotorSelector.css';

const alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

interface Rotor {
  index: string;
  wiring: string;
  
}

interface RotorSelection {
  index: string;
  wiring: string;
  position: string;
}

interface RotorSelectorProps {
  rotors: RotorSelection[];
  availableRotors: Rotor[];
  onRotorChange: (index: number, wiring: string) => void;
  onPositionChange: (index: number, position: string) => void;
}

/* 将 wiring 字符串 → 26 条映射 */
const buildMappings = (wiring: string): { input: string; output: string }[] =>
  Array.from({ length: 26 }, (_, i) => ({
    input: alpha[i],
    output: wiring ? wiring[i] : alpha[i],
  }));

/* ---------- Rotor 可视化 ---------- */
interface RotorProps {
  rotor: RotorSelection;
  mappings: { input: string; output: string }[];
  highlightChar?: string;
}

const RotorVisualizer: React.FC<RotorProps> = ({
  rotor,
  mappings,
  highlightChar,
}) => {
  const rowH = 30;
  const leftX = 10,
    rightX = 140,
    lineStart = 28,
    lineEnd = 122;

  console.log("RotorVisualizer", rotor, mappings, highlightChar);
  return (
    <div className="rotor">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 160 ${rowH * 26}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {mappings.map(({ input, output }) => {
          const i = alpha.indexOf(input);
          const y1 = alpha.indexOf(input) * rowH + rowH / 2;
          const y2 = alpha.indexOf(output) * rowH + rowH / 2;
          const active = highlightChar === input;
          return (
            <g key={input}>
              <text className="letter" x={leftX} y={y1 + 4}>
                {alpha[(i + 26 + (rotor.position.charCodeAt(0) - 65) )% 26]}         
              </text>
              <text className="letter" x={rightX} y={y2 + 4}>
                {output}
              </text>
              {rotor.wiring ? (<path
                d={`M${lineStart} ${y1} C${lineStart + 28} ${y1} ${
                  lineEnd - 28
                } ${y2} ${lineEnd} ${y2}`}
                className={active ? "line-active" : "line"}
              />): (null)}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const RotorSelector: React.FC<RotorSelectorProps> = ({
  rotors,
  availableRotors,
  onRotorChange,
  onPositionChange,
}) => {
  const positions = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  console.log("RotorSelector:", rotors);
  return (
    <div className="rotor-selector-container">
      <h3>转子配置</h3>
      <div className="rotors-grid">
        {rotors.map((rotor, index) => (
          <div key={index} className="rotor-config">
            <div className="rotor-label">转子 {index + 1}</div>
            <select
              value={rotor.index}
              onChange={(e) => onRotorChange(index, e.target.value)}
              className="rotor-select"
            >
              <option value="">请选择扰频器</option>
              {availableRotors.map((value) => (
                <option key={value.index} value={value.index}>
                  转子 {value.index}
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
                  位置{pos.charCodeAt(0) - 65 + 1} {pos} 
                </option>
              ))}
            </select>
            <RotorVisualizer
              rotor={rotor}
              mappings={buildMappings(rotor.wiring)}
              highlightChar={rotor.position}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default RotorSelector;