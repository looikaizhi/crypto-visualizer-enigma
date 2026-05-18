import React from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../LanguageSwitcher';
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
  const { t } = useTranslation();
  return (
    <header className="machine-plate enigma-topbar mat-brass">
      <div className="plate-shine" aria-hidden="true" />
      <div className="plate-text">
        <h1 className="plate-title emboss">{t('plate.title')}</h1>
        <span className="plate-sub emboss">{t('plate.subtitle')}</span>
      </div>
      <div className="plate-knobs">
        <button
          type="button"
          className="knob-btn focus-brass"
          onClick={onToggleSound}
          aria-pressed={soundOn}
          aria-label={t(soundOn ? 'plate.action.sound.off' : 'plate.action.sound.on')}
        >
          {t('plate.action.sound.label', {
            state: t(soundOn ? 'common.on' : 'common.off'),
          })}
        </button>
        <button
          type="button"
          className="knob-btn focus-brass"
          onClick={onHelp}
          aria-label={t('plate.action.help.aria')}
        >
          {t('plate.action.help.label')}
        </button>
        <button
          type="button"
          className="knob-btn focus-brass"
          onClick={onPreset}
          aria-label={t('plate.action.preset.aria')}
        >
          {t('plate.action.preset.label')}
        </button>
        <button
          type="button"
          className="knob-btn focus-brass"
          onClick={onReset}
          aria-label={t('plate.action.reset.aria')}
        >
          {t('plate.action.reset.label')}
        </button>
        <LanguageSwitcher />
      </div>
    </header>
  );
};

export default MachinePlate;
