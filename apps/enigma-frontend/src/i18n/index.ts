import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import zhCN from './locales/zh-CN.json';

export const SUPPORTED_LANGS = ['en', 'zh-CN'] as const;
export type AppLang = (typeof SUPPORTED_LANGS)[number];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      'zh-CN': { translation: zhCN },
    },
    // Map bare `zh` (and unknown locales) onto our explicit bundles.
    // Note: `nonExplicitSupportedLngs` is intentionally NOT used — combined with
    // an explicit `zh-CN` entry it would collapse `zh-CN` to the base `zh`
    // (absent from supportedLngs) and make every lookup fall back to English.
    fallbackLng: {
      zh: ['zh-CN'],
      default: ['en'],
    },
    supportedLngs: SUPPORTED_LANGS,
    interpolation: { escapeValue: false }, // React already escapes
    detection: {
      // English is the default; Chinese is shown only after the user picks it
      // via the switcher. We therefore do NOT detect `navigator` — only a
      // previously persisted choice in localStorage is honored.
      order: ['localStorage'],
      lookupLocalStorage: 'enigma-lang',
      caches: ['localStorage'],
    },
  });

// Keep <html lang> in sync so assistive tech announces the correct language.
const syncHtmlLang = (lng: string) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng;
  }
};
syncHtmlLang(i18n.resolvedLanguage ?? 'en');
i18n.on('languageChanged', (lng) => syncHtmlLang(lng));

export default i18n;
