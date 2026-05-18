import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './Onboarding.css';

interface OnboardingProps {
  onClose: () => void;
  onLoadPreset: () => void;
}

const STEPS = [
  {
    n: '1',
    titleKey: 'onboarding.step.rotors.title',
    bodyKey: 'onboarding.step.rotors.body',
  },
  {
    n: '2',
    titleKey: 'onboarding.step.keys.title',
    bodyKey: 'onboarding.step.keys.body',
  },
  {
    n: '3',
    titleKey: 'onboarding.step.current.title',
    bodyKey: 'onboarding.step.current.body',
  },
] as const;

const Onboarding: React.FC<OnboardingProps> = ({ onClose, onLoadPreset }) => {
  const { t } = useTranslation();
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
        aria-label={t('onboarding.aria')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="onboarding-head">
          <span className="onboarding-stamp">STRENG GEHEIM</span>
          <h2 className="onboarding-title emboss">{t('onboarding.title')}</h2>
          <p className="onboarding-lead">{t('onboarding.intro')}</p>
        </div>

        <ol className="onboarding-steps">
          {STEPS.map((s) => (
            <li className="onboarding-step" key={s.n}>
              <span className="onboarding-num">{s.n}</span>
              <div>
                <h3 className="onboarding-step-title">{t(s.titleKey)}</h3>
                <p className="onboarding-step-body">{t(s.bodyKey)}</p>
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
            {t('onboarding.action.start')}
          </button>
          <button
            type="button"
            className="onboarding-btn focus-brass"
            onClick={onClose}
          >
            {t('onboarding.action.skip')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
