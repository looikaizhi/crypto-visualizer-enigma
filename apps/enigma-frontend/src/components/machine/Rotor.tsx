import React from 'react';
import { ALPHABET } from './layout';
import type { Rotor as RotorType, RotorSelection } from '../../services/api';
import './Rotor.css';

const CELL = 34;

interface RotorProps {
  slot: number;
  rotor: RotorSelection;
  availableRotors: RotorType[];
  showAdvanced: boolean;
  onRotorChange: (slot: number, rotorIndex: string) => void;
  onPositionChange: (slot: number, position: string) => void;
  onRingSettingChange: (slot: number, ringSetting: string) => void;
}

const shift = (letter: string, delta: number): string => {
  const i = ALPHABET.indexOf(letter);
  const base = i < 0 ? 0 : i;
  return ALPHABET[(base + delta + 26) % 26];
};

const Rotor: React.FC<RotorProps> = ({
  slot,
  rotor,
  availableRotors,
  showAdvanced,
  onRotorChange,
  onPositionChange,
  onRingSettingChange,
}) => {
  const posIndex = Math.max(0, ALPHABET.indexOf(rotor.position || 'A'));
  // 三段字母带，取中段实现无空白滚动
  const strip = [...ALPHABET, ...ALPHABET, ...ALPHABET];
  const offset = -((26 + posIndex - 1) * CELL);

  return (
    <div className="rotor" aria-label={`转子 ${slot + 1}`}>
      <div className="rotor-typewheel">
        <span className="rotor-roman engrave">
          {rotor.index || '—'}
        </span>
        <div className="rotor-window mat-bakelite">
          <div
            className="rotor-strip"
            style={{ transform: `translateY(${offset}px)` }}
          >
            {strip.map((ch, i) => (
              <span className="rotor-cell" key={i}>
                {ch}
              </span>
            ))}
          </div>
          <div className="rotor-window-frame" aria-hidden="true" />
        </div>
        <div className="rotor-knurl" aria-hidden="true" />
      </div>

      <div className="rotor-steppers">
        <button
          type="button"
          className="rotor-arrow focus-brass"
          onClick={() => onPositionChange(slot, shift(rotor.position || 'A', 1))}
          aria-label={`转子 ${slot + 1} 起始位置上调`}
        >
          ▲
        </button>
        <span className="rotor-pos-label engrave">{rotor.position || 'A'}</span>
        <button
          type="button"
          className="rotor-arrow focus-brass"
          onClick={() => onPositionChange(slot, shift(rotor.position || 'A', -1))}
          aria-label={`转子 ${slot + 1} 起始位置下调`}
        >
          ▼
        </button>
      </div>

      <label className="rotor-field">
        <span className="rotor-field-label engrave">型号</span>
        <select
          className="rotor-select focus-brass"
          value={rotor.index}
          onChange={(e) => onRotorChange(slot, e.target.value)}
        >
          <option value="">选择</option>
          {availableRotors.map((r) => (
            <option key={r.index} value={r.index}>
              转子 {r.index}
            </option>
          ))}
        </select>
      </label>

      {showAdvanced && (
        <label className="rotor-field">
          <span className="rotor-field-label engrave">环位</span>
          <select
            className="rotor-select focus-brass"
            value={rotor.ringSetting}
            onChange={(e) => onRingSettingChange(slot, e.target.value)}
          >
            {ALPHABET.map((ch, i) => (
              <option key={ch} value={ch}>
                {i + 1} · {ch}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
};

export default Rotor;
