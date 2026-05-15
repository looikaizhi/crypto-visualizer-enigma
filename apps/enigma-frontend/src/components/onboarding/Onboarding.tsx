import React, { useEffect } from 'react';
import './Onboarding.css';

interface OnboardingProps {
  onClose: () => void;
  onLoadPreset: () => void;
}

const STEPS = [
  {
    n: '1',
    title: '装入转子',
    body: '在转子仓选择三个转子型号，拨动黄铜箭头设定起始位置。',
  },
  {
    n: '2',
    title: '敲击键盘',
    body: '点击键盘或直接用物理键盘输入字母 —— 转子会随之步进。',
  },
  {
    n: '3',
    title: '观察电流',
    body: '灯板会亮起密文；信号路径面板逐段点亮电流穿过机器的轨迹。',
  },
];

const Onboarding: React.FC<OnboardingProps> = ({ onClose, onLoadPreset }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="onboarding-scrim"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="onboarding-card mat-wood"
        role="dialog"
        aria-modal="true"
        aria-label="操作手册"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="onboarding-head">
          <span className="onboarding-stamp">STRENG GEHEIM</span>
          <h2 className="onboarding-title emboss">作战手册</h2>
          <p className="onboarding-lead">
            欢迎操作 Enigma 密码机。三步即可发出第一份密电：
          </p>
        </div>

        <ol className="onboarding-steps">
          {STEPS.map((s) => (
            <li className="onboarding-step" key={s.n}>
              <span className="onboarding-num">{s.n}</span>
              <div>
                <h3 className="onboarding-step-title">{s.title}</h3>
                <p className="onboarding-step-body">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="onboarding-actions">
          <button
            type="button"
            className="onboarding-btn onboarding-btn--primary focus-brass"
            onClick={onLoadPreset}
          >
            装载每日密钥并开始
          </button>
          <button
            type="button"
            className="onboarding-btn focus-brass"
            onClick={onClose}
          >
            我自己来
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
