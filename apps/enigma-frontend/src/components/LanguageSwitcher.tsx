import React from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const OPTIONS = [
  { code: 'en', label: 'EN' },
  { code: 'zh-CN', label: '中' },
] as const;

const LanguageSwitcher: React.FC = () => {
  const { t, i18n } = useTranslation();
  const current = i18n.resolvedLanguage ?? 'en';

  return (
    <div
      className="lang-toggle mat-brass"
      role="group"
      aria-label={t('language.switcher.aria')}
    >
      {OPTIONS.map((o) => {
        const isActive = current.startsWith(o.code);
        return (
          <button
            key={o.code}
            type="button"
            className={`lang-seg focus-brass ${isActive ? 'is-active' : ''}`}
            aria-pressed={isActive}
            onClick={() => i18n.changeLanguage(o.code)}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
};

export default LanguageSwitcher;
