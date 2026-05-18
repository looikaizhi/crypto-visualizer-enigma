import React from 'react';
import { useTranslation } from 'react-i18next';
import type { RotorSelection } from '../../services/api';
import './ConfigRail.css';

interface ConfigRailProps {
  rotors: RotorSelection[];
  selectedReflector: string;
  plugPairCount: number;
  showAdvanced: boolean;
  stepMode: boolean;
  slowMode: boolean;
  onPreset: () => void;
  onReset: () => void;
  onReflectorCycle: () => void;
  onToggleAdvanced: () => void;
  onToggleStep: () => void;
  onToggleSlow: () => void;
}

const ConfigRail: React.FC<ConfigRailProps> = ({
  rotors,
  selectedReflector,
  plugPairCount,
  showAdvanced,
  stepMode,
  slowMode,
  onPreset,
  onReset,
  onReflectorCycle,
  onToggleAdvanced,
  onToggleStep,
  onToggleSlow,
}) => {
  const { t } = useTranslation();
  return (
    <aside className="config-rail mat-wood" aria-label={t('rail.aria')}>
      <h2 className="rail-title emboss">{t('rail.title')}</h2>

      <div className="rail-actions">
        <button type="button" className="rail-btn focus-brass" onClick={onPreset}>
          {t('rail.action.preset')}
        </button>
        <button type="button" className="rail-btn focus-brass" onClick={onReset}>
          {t('rail.action.reset')}
        </button>
        <button
          type="button"
          className="rail-btn focus-brass"
          onClick={onReflectorCycle}
        >
          {t('rail.action.reflector', { value: selectedReflector })}
        </button>
      </div>

      <div className="rail-divider" />

      <div className="rail-toggles">
        <label className="rail-toggle">
          <input
            type="checkbox"
            checked={showAdvanced}
            onChange={onToggleAdvanced}
          />
          <span>{t('rail.toggle.ring')}</span>
        </label>
        <label className="rail-toggle">
          <input type="checkbox" checked={stepMode} onChange={onToggleStep} />
          <span>{t('rail.toggle.step')}</span>
        </label>
        <label className="rail-toggle">
          <input type="checkbox" checked={slowMode} onChange={onToggleSlow} />
          <span>{t('rail.toggle.slow')}</span>
        </label>
      </div>

      <div className="rail-divider" />

      <div className="rail-snapshot">
        <span className="rail-snapshot-head engrave">
          {t('rail.snapshot.head')}
        </span>
        <ul className="rail-snapshot-list">
          {rotors.map((r, i) => (
            <li key={i}>
              {t('rail.snapshot.rotor', {
                n: 3 - i,
                index: r.index || '—',
                position: r.position || 'A',
              })}
              {showAdvanced &&
                t('rail.snapshot.ring', { ring: r.ringSetting || 'A' })}
            </li>
          ))}
          <li>{t('rail.snapshot.reflector', { value: selectedReflector })}</li>
          <li>{t('rail.snapshot.plugs', { count: plugPairCount })}</li>
        </ul>
      </div>
    </aside>
  );
};

export default ConfigRail;
