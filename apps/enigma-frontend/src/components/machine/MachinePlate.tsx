import React from 'react';
import './MachinePlate.css';

interface MachinePlateProps {
  onReset: () => void;
  onPreset: () => void;
  onHelp: () => void;
  soundOn: boolean;
  onToggleSound: () => void;
}

const MachinePlate: React.FC<MachinePlateProps> = ({
  onReset,
  onPreset,
  onHelp,
  soundOn,
  onToggleSound,
}) => {
  return (
    <header className="machine-plate mat-brass">
      <div className="plate-shine" aria-hidden="true" />
      <div className="plate-text">
        <h1 className="plate-title emboss">ENIGMA</h1>
        <span className="plate-sub emboss">Chiffriermaschine · 密码机模拟器</span>
      </div>
      <div className="plate-knobs">
        <button
          type="button"
          className="knob-btn focus-brass"
          onClick={onToggleSound}
          aria-pressed={soundOn}
          aria-label={soundOn ? '关闭音效' : '开启音效'}
        >
          音效 {soundOn ? '开' : '关'}
        </button>
        <button
          type="button"
          className="knob-btn focus-brass"
          onClick={onHelp}
          aria-label="打开操作手册"
        >
          手册
        </button>
        <button
          type="button"
          className="knob-btn focus-brass"
          onClick={onPreset}
          aria-label="装载预设密钥"
        >
          装载密钥
        </button>
        <button
          type="button"
          className="knob-btn focus-brass"
          onClick={onReset}
          aria-label="重置机器"
        >
          重置
        </button>
      </div>
    </header>
  );
};

export default MachinePlate;
