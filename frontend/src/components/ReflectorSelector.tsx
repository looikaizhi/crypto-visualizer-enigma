import React from 'react';
import './ReflectorSelector.css';

const alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

interface Reflector {
  index: string;
  wiring: string;
}

interface ReflectorSelectorProps {
  selectedReflector: string;
  availableReflectors: Reflector[];
  onReflectorChange: (reflector: string) => void;
}

interface ReflectorProps {
  reflector: Reflector;
  mappings: { input: string; output: string }[];
  highlightChar?: string;
}

const buildMappings = (wiring: string): { input: string; output: string }[] =>
  Array.from({ length: 26 }, (_, i) => ({
    input: alpha[i],
    output: wiring ? wiring[i] : alpha[i],
  }));

const ReflectorVisualizer: React.FC<ReflectorProps> = ({
  reflector,
  mappings,
  highlightChar,
}) => {
  const rowH = 30;
  const leftX = 10,
    rightX = 140,
    lineStart = 28,
    lineEnd = 122;

  console.log("ReflectorVisualizer", reflector, mappings, highlightChar);
  return (
    <div className="reflector">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 160 ${rowH * 26}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {mappings.map(({ input, output }) => {
          const y1 = alpha.indexOf(input) * rowH + rowH / 2;
          const active = highlightChar === input;
          return (
            <g key={input}>
              <text className="reflector_letter" x={leftX} y={y1 + 4}>
                {input}         
              </text>
              <text className="reflector_letter" x={rightX} y={y1 + 4}>
                {output}
              </text>
              {reflector.wiring ? (<path
                d={`M${lineStart} ${y1} C${lineStart + 28} ${y1} ${
                  lineEnd - 28
                } ${y1} ${lineEnd} ${y1}`}
                className={active ? "line-active" : "line"}
              />): (null)}
            </g>
          );
        })}
      </svg>
    </div>
  );
};


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
          <option value="">请选择反射器</option>
          {availableReflectors.map((name) => (
            <option key={name.index} value={name.index}>
              反射器 {name.index}
            </option>
          ))}
        </select>
        <ReflectorVisualizer
          reflector={availableReflectors.find(r => r.index === selectedReflector) || availableReflectors[0]}
          mappings={buildMappings(
            availableReflectors.find(r => r.index === selectedReflector)?.wiring || ""
          )}
          highlightChar={"A"}
        />
      </div>
    </div>
  );
};

export default ReflectorSelector; 