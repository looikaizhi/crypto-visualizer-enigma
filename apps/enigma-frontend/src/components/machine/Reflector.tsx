import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const cycle = () => {
    const order = available.length
      ? available.map((r) => r.index)
      : ['A', 'B', 'C'];
    const i = order.indexOf(selected);
    onChange(order[(i + 1) % order.length]);
  };

  return (
    <div className="reflector" aria-label={t('reflector.aria.group')}>
      <span className="reflector-label engrave">UKW</span>
      <button
        type="button"
        className="reflector-disc focus-brass"
        onClick={cycle}
        aria-label={t('reflector.aria.cycle', { value: selected || 'B' })}
      >
        <span className="reflector-glyph">{selected || 'B'}</span>
      </button>
      <span className="reflector-hint engrave">{t('reflector.hint')}</span>
    </div>
  );
};

export default Reflector;
